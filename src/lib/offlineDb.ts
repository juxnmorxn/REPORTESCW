// Helper para manejo de Almacenamiento Offline en Navegador usando IndexedDB

const DB_NAME = 'ISPOfflineDB';
const DB_VERSION = 1;

export interface OfflineAction {
  id?: number;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  timestamp: number;
  descripcion: string;
}

let dbInstance: IDBDatabase | null = null;

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      // Store para Clientes en Caché
      if (!db.objectStoreNames.contains('clientes')) {
        db.createObjectStore('clientes', { keyPath: 'id' });
      }

      // Store para Visitas en Caché
      if (!db.objectStoreNames.contains('visitas')) {
        db.createObjectStore('visitas', { keyPath: 'id' });
      }

      // Store para Cola de Acciones Pendientes sin internet
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event);
      reject(event);
    };
  });
}

// Guardar clientes en memoria local
export async function cacheCustomersLocally(customers: any[]) {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('clientes', 'readwrite');
    const store = tx.objectStore('clientes');
    customers.forEach((c) => store.put(c));
  } catch (err) {
    console.error('Error guardando clientes offline:', err);
  }
}

// Obtener clientes desde caché local cuando no hay señal
export async function getLocalCachedCustomers(): Promise<any[]> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('clientes', 'readonly');
    const store = tx.objectStore('clientes');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

// Agregar acción realizada en campo a la cola sin internet
export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    await store.add({
      ...action,
      timestamp: Date.now(),
    });
    console.log('⚡ Acción guardada en cola offline:', action.descripcion);
  } catch (err) {
    console.error('Error al encolar acción offline:', err);
  }
}

// Obtener la cola de acciones pendientes
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

// Vaciar y sincronizar todas las acciones pendientes cuando regresa el internet
export async function processOfflineQueue(onStatusChange?: (msg: string) => void): Promise<number> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return 0;

  let processedCount = 0;
  const db = await openOfflineDb();

  for (const item of queue) {
    try {
      if (onStatusChange) onStatusChange(`Sincronizando: ${item.descripcion}...`);
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (res.ok) {
        // Borrar de la cola offline
        const tx = db.transaction('offline_queue', 'readwrite');
        const store = tx.objectStore('offline_queue');
        if (item.id) store.delete(item.id);
        processedCount++;
      }
    } catch (err) {
      console.error('Error sincronizando acción offline:', item.descripcion, err);
    }
  }

  return processedCount;
}
