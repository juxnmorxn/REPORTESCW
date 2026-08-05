import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { signUserToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initDb();
    const { rol } = await request.json(); // 'SUPERADMIN' | 'SOPORTE' | 'TECNICO'

    const db = getDb();
    const targetRol = rol || 'SUPERADMIN';

    const result = await db.execute({
      sql: 'SELECT * FROM usuarios WHERE rol = ? AND activo = 1 LIMIT 1',
      args: [targetRol],
    });

    if (result.rows.length === 0) {
      // Fallback to any active user or default admin
      const adminResult = await db.execute('SELECT * FROM usuarios WHERE activo = 1 LIMIT 1');
      if (adminResult.rows.length === 0) {
        return NextResponse.json({ error: 'No hay usuarios en el sistema' }, { status: 404 });
      }
      const u = adminResult.rows[0];
      const payload = {
        id: Number(u.id),
        nombre: String(u.nombre),
        email_o_usuario: String(u.email_o_usuario),
        rol: u.rol as 'SUPERADMIN' | 'SOPORTE' | 'TECNICO',
        region_asignada: u.region_asignada ? String(u.region_asignada) : undefined,
        especialidad: u.especialidad ? (u.especialidad as 'Antena' | 'Fibra' | 'Ambos') : undefined,
      };
      const token = signUserToken(payload);
      await setAuthCookie(token);
      return NextResponse.json({ success: true, user: payload });
    }

    const user = result.rows[0];
    const payload = {
      id: Number(user.id),
      nombre: String(user.nombre),
      email_o_usuario: String(user.email_o_usuario),
      rol: user.rol as 'SUPERADMIN' | 'SOPORTE' | 'TECNICO',
      region_asignada: user.region_asignada ? String(user.region_asignada) : undefined,
      especialidad: user.especialidad ? (user.especialidad as 'Antena' | 'Fibra' | 'Ambos') : undefined,
    };

    const token = signUserToken(payload);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: payload,
    });
  } catch (error: any) {
    console.error('Error en quick login:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor al autenticar' },
      { status: 500 }
    );
  }
}
