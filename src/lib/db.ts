import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    dbClient = createClient({
      url,
      authToken,
    });
  }
  return dbClient;
}

export async function initDb() {
  const db = getDb();

  // Crear Tabla de Usuarios y Roles
  await db.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email_o_usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('SUPERADMIN', 'SOPORTE', 'TECNICO')),
      region_asignada TEXT,
      especialidad TEXT CHECK(especialidad IN ('Antena', 'Fibra', 'Ambos')),
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Crear Tabla de Clientes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      ip TEXT,
      tipo_servicio TEXT NOT NULL,
      plan TEXT,
      region TEXT NOT NULL,
      direccion TEXT,
      estado TEXT DEFAULT 'Activo'
    );
  `);

  // Crear Tabla de Visitas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS visitas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tecnico_id INTEGER,
      creado_por_id INTEGER NOT NULL,
      estado_visita TEXT DEFAULT 'Pendiente' CHECK(estado_visita IN ('Pendiente', 'En Proceso', 'Completada', 'Cancelada')),
      prioridad TEXT DEFAULT 'Normal' CHECK(prioridad IN ('Baja', 'Normal', 'Urgente')),
      fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_completado DATETIME,
      motivo_reporte TEXT NOT NULL,
      diagnostico_tecnico TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id),
      FOREIGN KEY (tecnico_id) REFERENCES usuarios (id),
      FOREIGN KEY (creado_por_id) REFERENCES usuarios (id)
    );
  `);

  // Crear Tabla de Registro de Cambios de IP y AP en Campo (Bitácora WispHub)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cambios_ip (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      cliente_nombre TEXT NOT NULL,
      region TEXT NOT NULL,
      ip_anterior TEXT,
      ip_nueva TEXT NOT NULL,
      ap_anterior TEXT,
      ap_nuevo TEXT,
      motivo_notas TEXT,
      registrado_por TEXT NOT NULL,
      sincronizado_wisphub INTEGER DEFAULT 0,
      fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    );
  `);

  // Crear Tabla de Inventario de Antenas y APs (Topología de Red)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS antenas_infraestructura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_ap TEXT NOT NULL,
      ip_gestion TEXT NOT NULL,
      region TEXT NOT NULL,
      modelo_equipo TEXT DEFAULT 'Ubiquiti Rocket AC',
      usuario_acceso TEXT DEFAULT 'admin',
      password_acceso TEXT DEFAULT '',
      conectado_a TEXT DEFAULT 'Router Principal',
      estado TEXT DEFAULT 'En Línea',
      notas TEXT DEFAULT '',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Verificar si existe el usuario SUPERADMIN por defecto
  const existingAdmin = await db.execute({
    sql: 'SELECT id FROM usuarios WHERE email_o_usuario = ?',
    args: ['admin'],
  });

  if (existingAdmin.rows.length === 0) {
    const hashedPass = await bcrypt.hash('admin123', 10);
    await db.execute({
      sql: `INSERT INTO usuarios (nombre, email_o_usuario, password_hash, rol, region_asignada, especialidad) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['Super Administrador', 'admin', hashedPass, 'SUPERADMIN', 'Todas', 'Ambos'],
    });

    // Agregar algunos usuarios de prueba por defecto si la base de datos es nueva
    const hashedTech1 = await bcrypt.hash('tecnico123', 10);
    await db.execute({
      sql: `INSERT INTO usuarios (nombre, email_o_usuario, password_hash, rol, region_asignada, especialidad) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['Juan Pérez (Técnico Actopan)', 'tecnico_actopan', hashedTech1, 'TECNICO', 'RB-OLT-Actopan', 'Ambos'],
    });

    const hashedTech2 = await bcrypt.hash('tecnico123', 10);
    await db.execute({
      sql: `INSERT INTO usuarios (nombre, email_o_usuario, password_hash, rol, region_asignada, especialidad) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['Carlos López (Técnico Antenas)', 'tecnico_antenas', hashedTech2, 'TECNICO', 'RB-Rinkon', 'Antena'],
    });

    const hashedSupport = await bcrypt.hash('soporte123', 10);
    await db.execute({
      sql: `INSERT INTO usuarios (nombre, email_o_usuario, password_hash, rol, region_asignada, especialidad) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['María Rodríguez (Soporte)', 'soporte', hashedSupport, 'SOPORTE', 'Todas', 'Ambos'],
    });

    // Agregar clientes de demostración si está vacía
    const clientCheck = await db.execute('SELECT COUNT(*) as count FROM clientes');
    if (Number(clientCheck.rows[0].count) === 0) {
      await db.execute({
        sql: `INSERT INTO clientes (nombre, ip, tipo_servicio, plan, region, direccion, estado) VALUES
          ('Ferretería El Sol', '192.168.10.45', 'Antena', 'Plan 10M Antena', 'RB-Rinkon', 'Av. Hidalgo 102, Rincón', 'Activo'),
          ('Clínica Actopan', '192.168.20.12', 'Fibra', 'Plan 50M Fibra', 'RB-OLT-Actopan', 'Calle Juárez 45, Actopan', 'Activo'),
          ('Hotel Real', '192.168.20.88', 'Fibra', 'Plan 100M Fibra Dedicated', 'RB-OLT-Actopan', 'Blvd. Principal 500, Actopan', 'Activo'),
          ('Tienda La Bendición', '192.168.10.19', 'Antena', 'Plan 5M Antena', 'RB-Rinkon', 'Calle 5 de Mayo 12, Rincón', 'Activo')`,
        args: [],
      });

      // Agregar visitas de demostración
      await db.execute({
        sql: `INSERT INTO visitas (cliente_id, tecnico_id, creado_por_id, estado_visita, prioridad, motivo_reporte) VALUES
          (1, 3, 4, 'Pendiente', 'Urgente', 'Antena desalineada tras fuertes vientos. Cliente sin servicio.'),
          (2, 2, 4, 'En Proceso', 'Normal', 'Revisión de Atenuación en Roseta óptima. Pérdida intermitente.'),
          (4, 3, 4, 'Pendiente', 'Normal', 'Cambio de contraseña de Router WiFi')`,
        args: [],
      });
    }
  }
}
