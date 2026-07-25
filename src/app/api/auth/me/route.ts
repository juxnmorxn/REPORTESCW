import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
