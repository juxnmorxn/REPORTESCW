import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDb, initDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper para detectar columnas automáticamente sin importar variaciones de nombre, acentos o espacios
function buildHeaderMap(firstRow: Record<string, any>): Record<string, string> {
  const keys = Object.keys(firstRow);
  const map: Record<string, string> = {};

  const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  const findKey = (candidates: string[]) => {
    for (const cand of candidates) {
      const candClean = clean(cand);
      const match = keys.find(k => clean(k).includes(candClean));
      if (match) return match;
    }
    return '';
  };

  map['nombre'] = findKey(['nombre', 'cliente', 'usuario', 'razonsocial', 'fullname', 'name']);
  map['ip'] = findKey(['ip', 'ipcliente', 'direccionip', 'ipv4']);
  map['plan'] = findKey(['plan', 'planinternet', 'servicio', 'perfil', 'velocidad']);
  map['region'] = findKey(['router', 'zona', 'nodo', 'region', 'servidor', 'olt']);
  map['direccion'] = findKey(['direccion', 'domicilio', 'ubicacion', 'street', 'address']);
  map['estado'] = findKey(['estado', 'estatus', 'status', 'state']);

  return map;
}

function resolveRowData(row: Record<string, any>, headerMap: Record<string, string>) {
  const getVal = (field: string) => {
    const key = headerMap[field];
    return key && row[key] !== undefined && row[key] !== null ? String(row[key]).trim() : '';
  };

  return {
    nombre: getVal('nombre'),
    ip: getVal('ip'),
    plan: getVal('plan'),
    routerRegion: getVal('region') || 'General',
    direccion: getVal('direccion'),
    estado: getVal('estado') || 'Activo',
  };
}

export async function POST(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.rol !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo el SUPERADMIN puede importar archivos de WispHub.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha adjuntado ningún archivo Excel' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío o no contiene filas de datos' }, { status: 400 });
    }

    const headerMap = buildHeaderMap(rawData[0]);

    if (!headerMap['nombre']) {
      return NextResponse.json(
        { error: 'No se encontró la columna de Nombre o Cliente en el Excel. Encabezados detectados: ' + Object.keys(rawData[0]).join(', ') },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Cargar clientes existentes en memoria para deduplicación ultra-rápida
    const existingRes = await db.execute('SELECT id, ip, nombre, region FROM clientes');

    const existingByIp = new Map<string, number>();
    const existingByNameRegion = new Map<string, number>();

    for (const r of existingRes.rows) {
      const id = Number(r.id);
      const ipStr = String(r.ip || '').trim();
      const nombreStr = String(r.nombre || '').trim().toLowerCase();
      const regionStr = String(r.region || '').trim().toLowerCase();

      if (ipStr) {
        existingByIp.set(ipStr, id);
      }
      if (nombreStr && regionStr) {
        existingByNameRegion.set(`${nombreStr}||${regionStr}`, id);
      }
    }

    const statements: { sql: string; args: any[] }[] = [];
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rawData) {
      const { nombre, ip, plan, routerRegion, direccion, estado } = resolveRowData(row, headerMap);

      if (!nombre) {
        skippedCount++;
        continue;
      }

      const planLower = plan.toLowerCase();
      const tipoServicio = planLower.includes('antena') ? 'Antena' : 'Fibra';

      const nombreKey = nombre.toLowerCase();
      const regionKey = routerRegion.toLowerCase();
      const nameRegionKey = `${nombreKey}||${regionKey}`;

      // Verificar si ya existe por IP o por Nombre + Región
      const existingId = (ip ? existingByIp.get(ip) : null) || existingByNameRegion.get(nameRegionKey);

      if (existingId && existingId > 0) {
        // Cliente ya existe en BD -> Actualizar para evitar duplicados
        statements.push({
          sql: `UPDATE clientes 
                SET nombre = ?, ip = ?, tipo_servicio = ?, plan = ?, region = ?, direccion = ?, estado = ?
                WHERE id = ?`,
          args: [nombre, ip, tipoServicio, plan || 'Estándar', routerRegion, direccion, estado, existingId],
        });
        updatedCount++;
      } else {
        // Nuevo cliente -> Insertar sin duplicar
        statements.push({
          sql: `INSERT INTO clientes (nombre, ip, tipo_servicio, plan, region, direccion, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [nombre, ip, tipoServicio, plan || 'Estándar', routerRegion, direccion, estado],
        });
        importedCount++;

        // Marcar en memoria para evitar que si la misma persona o IP viene 2 veces en el Excel cree un duplicado
        if (ip) existingByIp.set(ip, -1);
        existingByNameRegion.set(nameRegionKey, -1);
      }
    }

    if (statements.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron registros de clientes válidos en el archivo Excel.' },
        { status: 400 }
      );
    }

    // 2. Ejecutar consultas en lotes (batch) de 200 sentencias por transacción HTTP
    const BATCH_SIZE = 200;
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
      const chunk = statements.slice(i, i + BATCH_SIZE);
      await db.batch(chunk, 'write');
    }

    return NextResponse.json({
      success: true,
      message: `¡Importación completada! Se procesaron ${rawData.length} filas del Excel: ${importedCount} clientes nuevos agregados sin duplicar, ${updatedCount} clientes actualizados${skippedCount > 0 ? `, ${skippedCount} filas vacías omitidas` : ''}.`,
      importedCount,
      updatedCount,
      skippedCount,
      totalRows: rawData.length,
    });
  } catch (error: any) {
    console.error('Error procesando Excel de WispHub:', error);
    return NextResponse.json(
      { error: error.message || 'Error inesperado al procesar el archivo Excel' },
      { status: 500 }
    );
  }
}
