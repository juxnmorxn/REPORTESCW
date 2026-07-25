import { createClient } from '@libsql/client';
import fs from 'fs';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

async function cleanDb() {
  const url = envVars.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = envVars.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;

  console.log('Connecting to database:', url);
  const db = createClient({ url, authToken });

  console.log('Cleaning table "visitas"...');
  await db.execute('DELETE FROM visitas');

  console.log('Cleaning table "clientes"...');
  await db.execute('DELETE FROM clientes');

  const countVisitas = await db.execute('SELECT COUNT(*) as count FROM visitas');
  const countClientes = await db.execute('SELECT COUNT(*) as count FROM clientes');
  const countUsuarios = await db.execute('SELECT COUNT(*) as count FROM usuarios');

  console.log('--- CLEANUP COMPLETE ---');
  console.log('Remaining Visitas:', countVisitas.rows[0].count);
  console.log('Remaining Clientes:', countClientes.rows[0].count);
  console.log('Remaining Usuarios:', countUsuarios.rows[0].count);
}

cleanDb().catch((err) => {
  console.error('Error cleaning DB:', err);
  process.exit(1);
});
