import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, initDb } from '@/lib/db';
import { signUserToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initDb();
    const { usuario, password } = await request.json();

    if (!usuario || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM usuarios WHERE email_o_usuario = ? AND activo = 1',
      args: [usuario],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas o usuario inactivo' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, String(user.password_hash));

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

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
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor al autenticar' },
      { status: 500 }
    );
  }
}
