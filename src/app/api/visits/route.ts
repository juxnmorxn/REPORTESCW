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
    const estado = searchParams.get('estado') || '';
    const tipoServicio = searchParams.get('tipo') || ''; // 'Antena', 'Fibra', 'Todos'
    const region = searchParams.get('region') || '';
    const tecnicoId = searchParams.get('tecnicoId') || '';
    const search = searchParams.get('search') || '';

    const db = getDb();

    let query = `
      SELECT 
        v.id,
        v.cliente_id,
        v.tecnico_id,
        v.creado_por_id,
        v.estado_visita,
        v.prioridad,
        v.fecha_asignacion,
        v.fecha_completado,
        v.motivo_reporte,
        v.diagnostico_tecnico,
        c.nombre AS cliente_nombre,
        c.ip AS cliente_ip,
        c.tipo_servicio AS cliente_tipo_servicio,
        c.plan AS cliente_plan,
        c.region AS cliente_region,
        c.direccion AS cliente_direccion,
        ut.nombre AS tecnico_nombre,
        uc.nombre AS creado_por_nombre
      FROM visitas v
      JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios ut ON v.tecnico_id = ut.id
      LEFT JOIN usuarios uc ON v.creado_por_id = uc.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filtrado por rol de técnico:
    // Si es TÉCNICO, mostrar solo visitas asignadas a él O de su región asignada
    if (currentUser.rol === 'TECNICO') {
      if (currentUser.region_asignada && currentUser.region_asignada !== 'Todas') {
        query += ' AND (v.tecnico_id = ? OR c.region = ?)';
        params.push(currentUser.id, currentUser.region_asignada);
      } else {
        query += ' AND v.tecnico_id = ?';
        params.push(currentUser.id);
      }

      // Si el técnico tiene especialidad restringida ('Antena' o 'Fibra') y no especifica 'Todos'
      if (currentUser.especialidad && currentUser.especialidad !== 'Ambos' && !tipoServicio) {
        query += ' AND c.tipo_servicio = ?';
        params.push(currentUser.especialidad);
      }
    } else if (tecnicoId && tecnicoId !== 'Todos') {
      query += ' AND v.tecnico_id = ?';
      params.push(tecnicoId);
    }

    // Filtros generales
    if (estado && estado !== 'Todos') {
      query += ' AND v.estado_visita = ?';
      params.push(estado);
    }

    if (tipoServicio && tipoServicio !== 'Todos') {
      query += ' AND c.tipo_servicio = ?';
      params.push(tipoServicio);
    }

    if (region && region !== 'Todas') {
      query += ' AND c.region = ?';
      params.push(region);
    }

    if (search.trim()) {
      query += ' AND (c.nombre LIKE ? OR c.ip LIKE ? OR c.direccion LIKE ? OR v.motivo_reporte LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY CASE WHEN v.prioridad = 'Urgente' THEN 1 WHEN v.prioridad = 'Normal' THEN 2 ELSE 3 END, v.id DESC";

    const result = await db.execute({
      sql: query,
      args: params,
    });

    return NextResponse.json({
      visitas: result.rows,
    });
  } catch (error: any) {
    console.error('Error al obtener visitas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'SOPORTE')) {
      return NextResponse.json({ error: 'No tienes permiso para crear órdenes de visita' }, { status: 403 });
    }

    const { cliente_id, cliente_ids, tecnico_id, prioridad, motivo_reporte } = await request.json();

    if ((!cliente_id && (!cliente_ids || !Array.isArray(cliente_ids) || cliente_ids.length === 0)) || !motivo_reporte) {
      return NextResponse.json({ error: 'Debes seleccionar al menos un cliente y especificar el motivo' }, { status: 400 });
    }

    const db = getDb();
    const idsToProcess: number[] = cliente_ids && Array.isArray(cliente_ids) && cliente_ids.length > 0
      ? cliente_ids
      : [cliente_id];

    for (const cId of idsToProcess) {
      await db.execute({
        sql: `INSERT INTO visitas (cliente_id, tecnico_id, creado_por_id, estado_visita, prioridad, motivo_reporte)
              VALUES (?, ?, ?, 'Pendiente', ?, ?)`,
        args: [
          Number(cId),
          tecnico_id ? Number(tecnico_id) : null,
          currentUser.id,
          prioridad || 'Normal',
          motivo_reporte,
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: `Se crearon y asignaron ${idsToProcess.length} órdenes de visita en lote al técnico correctamente.`,
      count: idsToProcess.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
