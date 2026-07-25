import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || '';
    const tipo = searchParams.get('tipo') || '';
    const estado = searchParams.get('estado') || '';
    const sortDir = (searchParams.get('sortDir') || 'ASC').toUpperCase(); // ASC por defecto (1 al N)
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(1000, Number(searchParams.get('limit')) || 100);

    const db = getDb();
    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    if (search.trim()) {
      whereClause += ' AND (nombre LIKE ? OR ip LIKE ? OR direccion LIKE ? OR plan LIKE ? OR coordenadas_gps LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (region.trim() && region !== 'Todas') {
      whereClause += ' AND region = ?';
      params.push(region);
    }

    if (tipo.trim() && tipo !== 'Todos') {
      whereClause += ' AND tipo_servicio = ?';
      params.push(tipo);
    }

    if (estado.trim() && estado !== 'Todos') {
      whereClause += ' AND estado = ?';
      params.push(estado);
    }

    // Contar el total de clientes coincidentes
    const countSql = `SELECT COUNT(*) as total FROM clientes ${whereClause}`;
    const countRes = await db.execute({ sql: countSql, args: params });
    const total = Number(countRes.rows[0]?.total || 0);

    // Consulta de registros con ordenación ASC (1 a N) o DESC y paginación
    const offset = (page - 1) * limit;
    const orderSql = sortDir === 'DESC' ? 'ORDER BY id DESC' : 'ORDER BY id ASC';
    const dataSql = `SELECT * FROM clientes ${whereClause} ${orderSql} LIMIT ? OFFSET ?`;

    const result = await db.execute({
      sql: dataSql,
      args: [...params, limit, offset],
    });

    // Obtener regiones distintas para los dropdowns
    const regionsResult = await db.execute("SELECT DISTINCT region FROM clientes WHERE region IS NOT NULL AND region != '' ORDER BY region ASC");
    const regiones = regionsResult.rows.map(r => String(r.region));

    return NextResponse.json({
      customers: result.rows,
      regiones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'SOPORTE')) {
      return NextResponse.json({ error: 'No autorizado para crear clientes' }, { status: 403 });
    }

    const { nombre, ip, tipo_servicio, plan, region, direccion, coordenadas_gps, estado } = await request.json();

    if (!nombre || !region) {
      return NextResponse.json({ error: 'Nombre y Región (Router) son obligatorios' }, { status: 400 });
    }

    // Auto-detectar tecnología si no se especifica explícitamente
    let detectedType = tipo_servicio;
    if (!detectedType) {
      detectedType = (plan || '').toLowerCase().includes('antena') ? 'Antena' : 'Fibra';
    }

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO clientes (nombre, ip, tipo_servicio, plan, region, direccion, coordenadas_gps, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nombre,
        ip || '',
        detectedType,
        plan || 'Estándar',
        region,
        direccion || '',
        coordenadas_gps || '',
        estado || 'Activo',
      ],
    });

    return NextResponse.json({ success: true, message: 'Cliente registrado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'SOPORTE')) {
      return NextResponse.json({ error: 'No autorizado para editar clientes' }, { status: 403 });
    }

    const { id, nombre, ip, tipo_servicio, plan, region, direccion, coordenadas_gps, estado } = await request.json();

    if (!id || !nombre || !region) {
      return NextResponse.json({ error: 'ID, Nombre y Región (Router) son obligatorios' }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: `UPDATE clientes 
            SET nombre = ?, ip = ?, tipo_servicio = ?, plan = ?, region = ?, direccion = ?, coordenadas_gps = ?, estado = ?
            WHERE id = ?`,
      args: [
        nombre,
        ip || '',
        tipo_servicio || 'Fibra',
        plan || 'Estándar',
        region,
        direccion || '',
        coordenadas_gps || '',
        estado || 'Activo',
        Number(id),
      ],
    });

    return NextResponse.json({ success: true, message: 'Cliente actualizado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
