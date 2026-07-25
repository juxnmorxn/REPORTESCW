import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getDb();

    let regionFilter = '';
    const params: any[] = [];
    if (currentUser.rol === 'TECNICO' && currentUser.region_asignada && currentUser.region_asignada !== 'Todas') {
      regionFilter = ' JOIN clientes c ON v.cliente_id = c.id WHERE c.region = ? ';
      params.push(currentUser.region_asignada);
    }

    const totalVisitas = await db.execute({
      sql: `SELECT COUNT(*) as count FROM visitas v ${regionFilter}`,
      args: params,
    });

    const pendientes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM visitas v ${regionFilter ? regionFilter + ' AND ' : ' WHERE '} v.estado_visita = 'Pendiente'`,
      args: params,
    });

    const enProceso = await db.execute({
      sql: `SELECT COUNT(*) as count FROM visitas v ${regionFilter ? regionFilter + ' AND ' : ' WHERE '} v.estado_visita = 'En Proceso'`,
      args: params,
    });

    const completadas = await db.execute({
      sql: `SELECT COUNT(*) as count FROM visitas v ${regionFilter ? regionFilter + ' AND ' : ' WHERE '} v.estado_visita = 'Completada'`,
      args: params,
    });

    const urgentes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM visitas v ${regionFilter ? regionFilter + ' AND ' : ' WHERE '} v.prioridad = 'Urgente' AND v.estado_visita != 'Completada'`,
      args: params,
    });

    const totalClientes = await db.execute('SELECT COUNT(*) as count FROM clientes');
    const totalTecnicos = await db.execute("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'TECNICO'");
    const totalAntenas = await db.execute("SELECT COUNT(*) as count FROM clientes WHERE tipo_servicio = 'Antena'");
    const totalFibra = await db.execute("SELECT COUNT(*) as count FROM clientes WHERE tipo_servicio = 'Fibra'");

    return NextResponse.json({
      stats: {
        totalVisitas: Number(totalVisitas.rows[0].count),
        pendientes: Number(pendientes.rows[0].count),
        enProceso: Number(enProceso.rows[0].count),
        completadas: Number(completadas.rows[0].count),
        urgentes: Number(urgentes.rows[0].count),
        totalClientes: Number(totalClientes.rows[0].count),
        totalTecnicos: Number(totalTecnicos.rows[0].count),
        totalAntenas: Number(totalAntenas.rows[0].count),
        totalFibra: Number(totalFibra.rows[0].count),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
