import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const result = await db.execute('SELECT * FROM vlans ORDER BY vlan_id ASC');
    return NextResponse.json({ vlans: result.rows });
  } catch (error: any) {
    console.error('Error al obtener VLANs:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener VLANs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const { nombre, vlan_id, rango_red, gateway, descripcion } = await request.json();

    if (!nombre || !vlan_id || !rango_red) {
      return NextResponse.json(
        { error: 'El nombre, ID de VLAN y el rango de red son requeridos.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db.execute({
      sql: 'SELECT id FROM vlans WHERE vlan_id = ?',
      args: [Number(vlan_id)],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `Ya existe una VLAN con el ID ${vlan_id}.` },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `INSERT INTO vlans (nombre, vlan_id, rango_red, gateway, descripcion) VALUES (?, ?, ?, ?, ?)`,
      args: [nombre, Number(vlan_id), rango_red, gateway || '', descripcion || ''],
    });

    return NextResponse.json({ success: true, message: 'VLAN creada exitosamente' });
  } catch (error: any) {
    console.error('Error al crear VLAN:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear VLAN' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await initDb();
    const { id, nombre, vlan_id, rango_red, gateway, descripcion } = await request.json();

    if (!id || !nombre || !vlan_id || !rango_red) {
      return NextResponse.json(
        { error: 'ID, Nombre, ID de VLAN y rango de red son requeridos.' },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.execute({
      sql: `UPDATE vlans SET nombre = ?, vlan_id = ?, rango_red = ?, gateway = ?, descripcion = ? WHERE id = ?`,
      args: [nombre, Number(vlan_id), rango_red, gateway || '', descripcion || '', Number(id)],
    });

    return NextResponse.json({ success: true, message: 'VLAN actualizada correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar VLAN:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar VLAN' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de VLAN requerido' }, { status: 400 });
    }

    const db = getDb();
    await db.execute({
      sql: 'DELETE FROM vlans WHERE id = ?',
      args: [Number(id)],
    });

    return NextResponse.json({ success: true, message: 'VLAN eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar VLAN:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar VLAN' },
      { status: 500 }
    );
  }
}
