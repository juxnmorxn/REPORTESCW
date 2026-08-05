import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function DELETE() {
  try {
    await initDb();
    const db = getDb();

    // Limpiar tabla de clientes, visitas y bitácora de cambios de IP
    await db.execute('DELETE FROM visitas');
    await db.execute('DELETE FROM cambios_ip');
    await db.execute('DELETE FROM clientes');

    return NextResponse.json({
      success: true,
      message: 'Base de datos de clientes e historial vaciados con éxito. Lista para nueva importación CSV / Excel.',
    });
  } catch (error: any) {
    console.error('Error al vaciar la base de datos de clientes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al vaciar la base de datos de clientes' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return DELETE();
}
