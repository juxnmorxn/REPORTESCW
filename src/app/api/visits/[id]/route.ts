import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const paramsResolved = await context.params;
    const visitId = Number(paramsResolved.id);

    if (isNaN(visitId)) {
      return NextResponse.json({ error: 'ID de visita inválido' }, { status: 400 });
    }

    const { estado_visita, diagnostico_tecnico, tecnico_id, prioridad } = await request.json();

    const db = getDb();
    const visitCheck = await db.execute({
      sql: 'SELECT * FROM visitas WHERE id = ?',
      args: [visitId],
    });

    if (visitCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    let fechaCompletado = null;
    if (estado_visita === 'Completada') {
      fechaCompletado = new Date().toISOString();
    }

    // Actualizar los campos provistos
    await db.execute({
      sql: `UPDATE visitas 
            SET 
              estado_visita = COALESCE(?, estado_visita),
              diagnostico_tecnico = COALESCE(?, diagnostico_tecnico),
              tecnico_id = COALESCE(?, tecnico_id),
              prioridad = COALESCE(?, prioridad),
              fecha_completado = CASE WHEN ? = 'Completada' THEN CURRENT_TIMESTAMP ELSE fecha_completado END
            WHERE id = ?`,
      args: [
        estado_visita || null,
        diagnostico_tecnico !== undefined ? diagnostico_tecnico : null,
        tecnico_id !== undefined ? (tecnico_id ? Number(tecnico_id) : null) : null,
        prioridad || null,
        estado_visita || null,
        visitId,
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Visita actualizada correctamente',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
