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

    const db = getDb();
    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    if (search.trim()) {
      whereClause += ' AND (nombre_ap LIKE ? OR ip_gestion LIKE ? OR modelo_equipo LIKE ? OR conectado_a LIKE ? OR notas LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (region.trim() && region !== 'Todas') {
      whereClause += ' AND region = ?';
      params.push(region);
    }

    const query = `SELECT * FROM antenas_infraestructura ${whereClause} ORDER BY id DESC`;
    const result = await db.execute({ sql: query, args: params });

    return NextResponse.json({
      antenas: result.rows,
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
      nombre_ap,
      ip_gestion,
      region,
      modelo_equipo,
      usuario_acceso,
      password_acceso,
      conectado_a,
      estado,
      notas,
    } = await request.json();

    if (!nombre_ap || !ip_gestion || !region) {
      return NextResponse.json(
        { error: 'Nombre del AP, IP de Gestión y Región son obligatorios' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Validar si la IP de gestión del AP ya existe
    const existing = await db.execute({
      sql: 'SELECT id, nombre_ap FROM antenas_infraestructura WHERE ip_gestion = ? LIMIT 1',
      args: [ip_gestion.trim()],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `La IP de gestión ${ip_gestion} ya está en uso por el AP "${existing.rows[0].nombre_ap}".` },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `INSERT INTO antenas_infraestructura 
            (nombre_ap, ip_gestion, region, modelo_equipo, usuario_acceso, password_acceso, conectado_a, estado, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nombre_ap.trim(),
        ip_gestion.trim(),
        region.trim(),
        modelo_equipo || 'Ubiquiti Rocket AC',
        usuario_acceso || 'admin',
        password_acceso || '',
        conectado_a || 'Router Principal',
        estado || 'En Línea',
        notas || '',
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Antena / AP registrado en el inventario de red correctamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      id,
      nombre_ap,
      ip_gestion,
      region,
      modelo_equipo,
      usuario_acceso,
      password_acceso,
      conectado_a,
      estado,
      notas,
    } = await request.json();

    if (!id || !nombre_ap || !ip_gestion || !region) {
      return NextResponse.json({ error: 'ID, Nombre, IP y Región son obligatorios' }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: `UPDATE antenas_infraestructura 
            SET nombre_ap = ?, ip_gestion = ?, region = ?, modelo_equipo = ?, usuario_acceso = ?, password_acceso = ?, conectado_a = ?, estado = ?, notas = ?
            WHERE id = ?`,
      args: [
        nombre_ap.trim(),
        ip_gestion.trim(),
        region.trim(),
        modelo_equipo || 'Ubiquiti Rocket AC',
        usuario_acceso || 'admin',
        password_acceso || '',
        conectado_a || 'Router Principal',
        estado || 'En Línea',
        notas || '',
        Number(id),
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Equipo AP actualizado correctamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: 'DELETE FROM antenas_infraestructura WHERE id = ?',
      args: [Number(id)],
    });

    return NextResponse.json({ success: true, message: 'AP eliminado del inventario' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
