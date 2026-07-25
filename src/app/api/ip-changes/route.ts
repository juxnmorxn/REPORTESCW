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
    const sincronizado = searchParams.get('sincronizado') || '';

    const db = getDb();
    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    if (search.trim()) {
      whereClause += ' AND (cliente_nombre LIKE ? OR ip_anterior LIKE ? OR ip_nueva LIKE ? OR ap_nuevo LIKE ? OR motivo_notas LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (region.trim() && region !== 'Todas') {
      whereClause += ' AND region = ?';
      params.push(region);
    }

    if (sincronizado === '0' || sincronizado === '1') {
      whereClause += ' AND sincronizado_wisphub = ?';
      params.push(Number(sincronizado));
    }

    const query = `SELECT * FROM cambios_ip ${whereClause} ORDER BY id DESC LIMIT 500`;
    const result = await db.execute({ sql: query, args: params });

    // Contar pendientes de actualizar en WispHub
    const countRes = await db.execute("SELECT COUNT(*) as count FROM cambios_ip WHERE sincronizado_wisphub = 0");
    const pendientesCount = Number(countRes.rows[0]?.count || 0);

    // Obtener regiones distintas de la base de datos
    const regionsRes = await db.execute("SELECT DISTINCT region FROM clientes WHERE region IS NOT NULL AND region != '' ORDER BY region ASC");
    const regiones = regionsRes.rows.map(r => String(r.region));

    return NextResponse.json({
      cambios: result.rows,
      pendientesCount,
      regiones,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      cliente_id,
      cliente_nombre,
      region,
      ip_anterior,
      ip_nueva,
      ap_anterior,
      ap_nuevo,
      motivo_notas,
      auto_update_cliente = true,
    } = await request.json();

    if (!cliente_nombre || !ip_nueva || !region) {
      return NextResponse.json({ error: 'Nombre de Cliente, Nueva IP y Región son obligatorios.' }, { status: 400 });
    }

    const db = getDb();

    // Validar si la nueva IP ya está en uso por otro cliente en la base de datos
    if (ip_nueva && ip_nueva.trim()) {
      const existingClient = await db.execute({
        sql: 'SELECT id, nombre, region FROM clientes WHERE ip = ? AND id != ? LIMIT 1',
        args: [ip_nueva.trim(), cliente_id ? Number(cliente_id) : -1],
      });

      if (existingClient.rows.length > 0) {
        const occupant = existingClient.rows[0];
        return NextResponse.json(
          {
            error: `⚠️ La IP ${ip_nueva} ya está en uso por el cliente "${occupant.nombre}" (Región: ${occupant.region}). Por favor selecciona una IP libre.`,
          },
          { status: 400 }
        );
      }
    }

    // 1. Insertar registro en la bitácora de cambios de IP/AP
    await db.execute({
      sql: `INSERT INTO cambios_ip (cliente_id, cliente_nombre, region, ip_anterior, ip_nueva, ap_anterior, ap_nuevo, motivo_notas, registrado_por, sincronizado_wisphub)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        cliente_id ? Number(cliente_id) : null,
        cliente_nombre,
        region,
        ip_anterior || '',
        ip_nueva,
        ap_anterior || '',
        ap_nuevo || '',
        motivo_notas || '',
        currentUser.nombre,
      ],
    });

    // 2. Si se solicitó actualizar la ficha del cliente en la BD de la app
    if (auto_update_cliente && cliente_id) {
      await db.execute({
        sql: `UPDATE clientes SET ip = ? WHERE id = ?`,
        args: [ip_nueva, Number(cliente_id)],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cambio de IP/AP registrado en bitácora correctamente. Marcado como pendiente para WispHub.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'SOPORTE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, sincronizado_wisphub } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: `UPDATE cambios_ip SET sincronizado_wisphub = ? WHERE id = ?`,
      args: [sincronizado_wisphub ? 1 : 0, Number(id)],
    });

    return NextResponse.json({
      success: true,
      message: sincronizado_wisphub
        ? 'Marcado como Sincronizado en WispHub.'
        : 'Marcado como Pendiente en WispHub.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
