import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'isp_pwa_super_secret_key_30_days_session_2026_change_me';
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 días (2,592,000 segundos)

export interface UserSessionPayload {
  id: number;
  nombre: string;
  email_o_usuario: string;
  rol: 'SUPERADMIN' | 'SOPORTE' | 'TECNICO';
  region_asignada?: string;
  especialidad?: 'Antena' | 'Fibra' | 'Ambos';
}

export function signUserToken(payload: UserSessionPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      nombre: payload.nombre,
      email_o_usuario: payload.email_o_usuario,
      rol: payload.rol,
      region_asignada: payload.region_asignada,
      especialidad: payload.especialidad,
    },
    JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
}

export function verifyUserToken(token: string): UserSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      nombre: decoded.nombre,
      email_o_usuario: decoded.email_o_usuario,
      rol: decoded.rol,
      region_asignada: decoded.region_asignada,
      especialidad: decoded.especialidad,
    };
  } catch (error) {
    return null;
  }
}

// Obtener usuario actual y renovar automáticamente la cookie por otros 30 días si es válido
export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('isp_auth_token')?.value;
    if (!token) return null;

    const user = verifyUserToken(token);
    if (!user) return null;

    // Renovación automática deslizante de la cookie por 30 días en cada visita activa
    try {
      const newToken = signUserToken(user);
      cookieStore.set('isp_auth_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION_SECONDS,
        path: '/',
      });
    } catch (e) {
      // Ignorar si las cabeceras ya fueron enviadas
    }

    return user;
  } catch (err) {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('isp_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('isp_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
