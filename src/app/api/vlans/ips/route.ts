import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { generateIpRange, IpItem } from '@/lib/ipUtils';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const vlanIdParam = searchParams.get('vlan_id');
    const statusParam = searchParams.get('status') || 'todas'; // 'disponibles', 'ocupadas', 'todas'
    const searchParam = (searchParams.get('search') || '').toLowerCase().trim();

    const db = getDb();

    // 1. Get VLANs
    let vlansSql = 'SELECT * FROM vlans';
    const vlansArgs: any[] = [];

    if (vlanIdParam && vlanIdParam !== 'todas') {
      vlansSql += ' WHERE vlan_id = ?';
      vlansArgs.push(Number(vlanIdParam));
    }
    vlansSql += ' ORDER BY vlan_id ASC';

    const vlansResult = await db.execute({ sql: vlansSql, args: vlansArgs });
    const vlans = vlansResult.rows;

    // 2. Get all customers with their IPs
    const custResult = await db.execute(
      'SELECT id, nombre, ip, tipo_servicio, plan, region, direccion, estado FROM clientes'
    );
    const clientes = custResult.rows;

    // Map IP string to client object for quick O(1) lookup
    const ipToClientMap: { [ip: string]: any } = {};
    clientes.forEach((c: any) => {
      if (c.ip && typeof c.ip === 'string') {
        const cleanedIp = c.ip.trim();
        if (cleanedIp) {
          ipToClientMap[cleanedIp] = c;
        }
      }
    });

    const allIpItems: IpItem[] = [];
    let countTotal = 0;
    let countDisponibles = 0;
    let countOcupadas = 0;

    // 3. Process IPs for each VLAN
    for (const vlan of vlans) {
      const vlanId = Number(vlan.vlan_id);
      const vlanNombre = String(vlan.nombre);
      const rangoStr = String(vlan.rango_red);
      const gateway = vlan.gateway ? String(vlan.gateway) : undefined;

      const generatedIps = generateIpRange(rangoStr);

      for (const ip of generatedIps) {
        countTotal++;
        const client = ipToClientMap[ip];
        const isOccupied = !!client;

        if (isOccupied) {
          countOcupadas++;
        } else {
          countDisponibles++;
        }

        const item: IpItem = {
          ip,
          vlan_id: vlanId,
          vlan_nombre: vlanNombre,
          estado: isOccupied ? 'OCUPADA' : 'DISPONIBLE',
          gateway,
        };

        if (client) {
          item.cliente_id = Number(client.id);
          item.cliente_nombre = String(client.nombre);
          item.cliente_plan = client.plan ? String(client.plan) : undefined;
          item.cliente_region = client.region ? String(client.region) : undefined;
          item.cliente_tipo_servicio = client.tipo_servicio ? String(client.tipo_servicio) : undefined;
          item.cliente_direccion = client.direccion ? String(client.direccion) : undefined;
        }

        // Apply Status Filter
        if (statusParam === 'disponibles' && isOccupied) continue;
        if (statusParam === 'ocupadas' && !isOccupied) continue;

        // Apply Search Filter
        if (searchParam) {
          const matchIp = ip.toLowerCase().includes(searchParam);
          const matchClient = item.cliente_nombre?.toLowerCase().includes(searchParam);
          const matchVlan = vlanNombre.toLowerCase().includes(searchParam);
          const matchRegion = item.cliente_region?.toLowerCase().includes(searchParam);
          if (!matchIp && !matchClient && !matchVlan && !matchRegion) {
            continue;
          }
        }

        allIpItems.push(item);
      }
    }

    return NextResponse.json({
      summary: {
        totalIps: countTotal,
        disponibles: countDisponibles,
        ocupadas: countOcupadas,
        totalVlans: vlans.length,
      },
      vlans,
      ips: allIpItems,
    });
  } catch (error: any) {
    console.error('Error al calcular inventario de IPs por VLAN:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener inventario de IPs' },
      { status: 500 }
    );
  }
}
