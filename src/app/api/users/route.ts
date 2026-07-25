import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, initDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'SOPORTE')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const db = getDb();
    const result = await db.execute(
      'SELECT id, nombre, email_o_usuario, rol, region_asignada, especialidad, activo, creado_en FROM usuarios ORDER BY id DESC'
    );

    return NextResponse.json({ users: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo el SUPERADMIN puede crear usuarios' }, { status: 403 });
    }

    const { nombre, email_o_usuario, password, rol, region_asignada, especialidad } = await request.json();

    if (!nombre || !email_o_usuario || !password || !rol) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben ser provistos' }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.execute({
      sql: 'SELECT id FROM usuarios WHERE email_o_usuario = ?',
      args: [email_o_usuario],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'El nombre de usuario/email ya está registrado' }, { status: 400 });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    await db.execute({
      sql: `INSERT INTO usuarios (nombre, email_o_usuario, password_hash, rol, region_asignada, especialidad, activo)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [nombre, email_o_usuario, hashedPass, rol, region_asignada || 'Todas', especialidad || 'Ambos'],
    });

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo el SUPERADMIN puede editar usuarios' }, { status: 403 });
    }

    const { id, nombre, email_o_usuario, password, rol, region_asignada, especialidad, activo } = await request.json();

    if (!id || !nombre || !email_o_usuario || !rol) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const db = getDb();
    if (password && password.trim() !== '') {
      const hashedPass = await bcrypt.hash(password, 10);
      await db.execute({
        sql: `UPDATE usuarios 
              SET nombre = ?, email_o_usuario = ?, password_hash = ?, rol = ?, region_asignada = ?, especialidad = ?, activo = ?
              WHERE id = ?`,
        args: [nombre, email_o_usuario, hashedPass, rol, region_asignada || 'Todas', especialidad || 'Ambos', activo !== undefined ? activo : 1, id],
      });
    } else {
      await db.execute({
        sql: `UPDATE usuarios 
              SET nombre = ?, email_o_usuario = ?, rol = ?, region_asignada = ?, especialidad = ?, activo = ?
              WHERE id = ?`,
        args: [nombre, email_o_usuario, rol, region_asignada || 'Todas', especialidad || 'Ambos', activo !== undefined ? activo : 1, id],
      });
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
