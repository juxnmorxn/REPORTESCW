/**
 * Utility functions for IP address calculations and VLAN range processing.
 */

export interface IpItem {
  ip: string;
  vlan_id: number;
  vlan_nombre: string;
  estado: 'DISPONIBLE' | 'OCUPADA';
  cliente_id?: number;
  cliente_nombre?: string;
  cliente_plan?: string;
  cliente_region?: string;
  cliente_tipo_servicio?: string;
  cliente_direccion?: string;
  gateway?: string;
}

/**
 * Generates all usable host IP addresses from a subnet range string.
 * Supports:
 * - CIDR: e.g. "172.19.1.0/24", "192.168.10.0/24"
 * - Range: e.g. "172.19.1.1 - 172.19.1.254" or "172.19.1.1-254"
 * - Wildcard: e.g. "172.19.1.x"
 */
export function generateIpRange(rangoStr: string): string[] {
  const str = rangoStr.trim();
  const ips: string[] = [];

  // Case 1: Range format like "172.19.1.1 - 172.19.1.254" or "172.19.1.1-172.19.1.254"
  if (str.includes('-')) {
    const parts = str.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      const startIp = parts[0];
      let endIp = parts[1];

      // If endIp is just a number, e.g. "172.19.1.1 - 254"
      if (!endIp.includes('.')) {
        const octets = startIp.split('.');
        if (octets.length === 4) {
          endIp = `${octets[0]}.${octets[1]}.${octets[2]}.${endIp}`;
        }
      }

      const startNum = ipToLong(startIp);
      const endNum = ipToLong(endIp);

      if (startNum > 0 && endNum >= startNum && endNum - startNum < 2048) {
        for (let i = startNum; i <= endNum; i++) {
          ips.push(longToIp(i));
        }
        return ips;
      }
    }
  }

  // Case 2: CIDR format like "172.19.1.0/24"
  if (str.includes('/')) {
    const [ipBase, maskStr] = str.split('/');
    const mask = parseInt(maskStr, 10);
    const ipNum = ipToLong(ipBase);

    if (ipNum > 0 && mask >= 16 && mask <= 30) {
      const numHosts = Math.pow(2, 32 - mask);
      const netMask = (0xffffffff << (32 - mask)) >>> 0;
      const network = (ipNum & netMask) >>> 0;
      
      // We list usable host IPs (network + 1 to broadcast - 1)
      const firstHost = network + 1;
      const lastHost = network + numHosts - 2;

      for (let i = firstHost; i <= lastHost; i++) {
        ips.push(longToIp(i));
      }
      return ips;
    }
  }

  // Case 3: Wildcard format like "172.19.1.x"
  if (str.toLowerCase().includes('.x')) {
    const prefix = str.toLowerCase().replace('.x', '');
    for (let i = 1; i <= 254; i++) {
      ips.push(`${prefix}.${i}`);
    }
    return ips;
  }

  // Fallback: If single IP specified
  if (ipToLong(str) > 0) {
    ips.push(str);
  }

  return ips;
}

export function ipToLong(ip: string): number {
  const octets = ip.split('.').map((o) => parseInt(o, 10));
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    return 0;
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}
