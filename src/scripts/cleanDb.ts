import { getDb, initDb } from '../lib/db';

async function main() {
  await initDb();
  const db = getDb();
  console.log('--- INICIANDO LIMPIEZA DE BASE DE DATOS ---');

  try {
    await db.execute('DELETE FROM visitas');
    console.log('✓ Tabla "visitas" limpiada');

    await db.execute('DELETE FROM cambios_ip');
    console.log('✓ Tabla "cambios_ip" limpiada');

    await db.execute('DELETE FROM clientes');
    console.log('✓ Tabla "clientes" limpiada');

    await db.execute('DELETE FROM antenas_infraestructura');
    console.log('✓ Tabla "antenas_infraestructura" limpiada');

    await db.execute('DELETE FROM vlans');
    console.log('✓ Tabla "vlans" limpiada 100%');

    const users = await db.execute('SELECT id, nombre, email_o_usuario, rol, region_asignada FROM usuarios');
    console.log('\n--- USUARIOS MANTENIDOS EN LA BASE DE DATOS ---');
    console.table(users.rows);

    console.log('\n¡LIMPIEZA COMPLETADA CON ÉXITO! La base de datos contiene ÚNICAMENTE los usuarios de sistema y sus roles.');
  } catch (e) {
    console.error('Error durante la limpieza:', e);
  }
}

main();
