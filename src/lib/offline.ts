'use client';

import Dexie, { type Table } from 'dexie';
import { type Inspection, type WorkOrder, type Equipment, type Client, type EquipmentComponent } from './data';
import { type Firestore, collection, doc, writeBatch, getDoc, getDocs } from 'firebase/firestore';

export type OfflineInspection = Omit<Inspection, 'id' | 'status'> & {
  localId?: number;
};

export type OfflineComponent = EquipmentComponent & { equipmentId: string };

class OfflineDB extends Dexie {
  pendingInspections!: Table<OfflineInspection, number>;
  workOrders!: Table<WorkOrder, string>;
  equipment!: Table<Equipment, string>;
  clients!: Table<Client, string>;
  components!: Table<OfflineComponent, string>;

  constructor() {
    super('FmecalOfflineDB');
    this.version(3).stores({
      pendingInspections: '++localId, workOrderId, inspectorId',
      workOrders: 'id, inspectorId, status',
      equipment: 'id, clientId',
      clients: 'id',
      components: 'id, equipmentId',
    });
  }
}

// Create and export the singleton instance immediately.
// The 'use client' directive ensures this only happens on the client.
export const offlineDB = new OfflineDB();


/**
 * Ensures the database is open before performing any operation.
 * Dexie auto-opens on first query, but explicit open is safer for writes.
 */
async function ensureDBOpen(): Promise<void> {
  if (offlineDB.isOpen()) {
    return;
  }
  try {
    // db.open() is idempotent and will only open if it's not already open.
    await offlineDB.open();
  } catch (err) {
    console.error('[OfflineDB] Falha ao abrir o banco de dados.', err);
    throw new Error(
      'Não foi possível abrir o armazenamento local. ' +
      'Verifique se o seu navegador permite armazenamento offline para este site (especialmente em modo anônimo).'
    );
  }
}


// ─── FALLBACK: localStorage quando IndexedDB não está disponível ───

const FALLBACK_KEY = 'cranecheck_pending_inspections';

function getFallbackInspections(): OfflineInspection[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackInspections(inspections: OfflineInspection[]): void {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(inspections));
}

/**
 * Testa se o IndexedDB está disponível no dispositivo atual.
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('__cranecheck_test__', 1);
      req.onupgradeneeded = () => { /* cria banco vazio */ };
      req.onsuccess = () => {
        req.result.close();
        indexedDB.deleteDatabase('__cranecheck_test__');
        resolve(true);
      };
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Salva uma inspeção pendente, usando IndexedDB quando possível
 * ou localStorage como fallback.
 */
export async function savePendingInspection(
  inspection: Omit<OfflineInspection, 'localId'>
): Promise<{ savedIn: 'indexeddb' | 'localstorage'; localId?: number }> {
  const indexedDBAvailable = await isIndexedDBAvailable();

  if (indexedDBAvailable) {
    try {
      await ensureDBOpen();
      const localId = await offlineDB.pendingInspections.add(inspection);
      return { savedIn: 'indexeddb', localId };
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            throw new Error('Armazenamento offline cheio. Por favor, sincronize os dados pendentes para liberar espaço.');
        }
        console.error("Falha ao salvar no IndexedDB:", e);
        throw new Error(`Falha ao salvar no banco de dados local: ${e.message || 'Erro desconhecido'}`);
    }
  }

  // Fallback para localStorage
  try {
    const inspections = getFallbackInspections();
    const newInspection: OfflineInspection = {
      ...inspection,
      localId: Date.now(),
    };
    inspections.push(newInspection);
    saveFallbackInspections(inspections);
    return { savedIn: 'localstorage', localId: newInspection.localId };
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('Armazenamento local (localStorage) está cheio, possivelmente devido a muitas fotos. Sincronize os dados pendentes.');
    }
    throw e; // Re-throw other localStorage errors
  }
}

/**
 * Retorna todas as inspeções pendentes, tanto do IndexedDB quanto do localStorage.
 */
export async function getAllPendingInspections(): Promise<OfflineInspection[]> {
  let fromIndexedDB: OfflineInspection[] = [];
  const fromLocalStorage: OfflineInspection[] = getFallbackInspections();

  const indexedDBAvailable = await isIndexedDBAvailable();

  if (indexedDBAvailable) {
    try {
      await ensureDBOpen();
      fromIndexedDB = await offlineDB.pendingInspections.toArray();
    } catch {
      // se falhar, segue com vazio
    }
  }

  return [...fromIndexedDB, ...fromLocalStorage];
}

/**
 * Remove uma inspeção pendente após sincronização bem-sucedida.
 */
export async function removePendingInspection(localId: number): Promise<void> {
  const indexedDBAvailable = await isIndexedDBAvailable();

  // Tenta remover do IndexedDB
  if (indexedDBAvailable) {
    try {
      await ensureDBOpen();
      await offlineDB.pendingInspections.delete(localId);
    } catch {
      // se falhar, tenta pelo localStorage mesmo assim
    }
  }

  // Tenta remover do localStorage (cobre o caso do fallback)
  const inspections = getFallbackInspections();
  const filtered = inspections.filter(i => i.localId !== localId);
  if (filtered.length !== inspections.length) {
    saveFallbackInspections(filtered);
  }
}


/**
 * Fetches all data related to the given work orders and caches it in IndexedDB.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) return;

    await ensureDBOpen();

    const equipmentIds = [...new Set(workOrders.map(wo => wo.equipmentId))].filter(id => !!id);
    const clientIds = [...new Set(workOrders.map(wo => wo.clientId))].filter(id => !!id);

    const equipmentPromises = equipmentIds.map(id => getDoc(doc(firestore, 'equipment', id)));
    const clientPromises = clientIds.map(id => getDoc(doc(firestore, 'clients', id)));
    
    const equipmentSnapshots = await Promise.all(equipmentPromises);
    const clientSnapshots = await Promise.all(clientPromises);

    const equipments = equipmentSnapshots
        .filter(snap => snap.exists())
        .map(snap => ({ id: snap.id, ...snap.data() } as Equipment));
    
    const clients = clientSnapshots
        .filter(snap => snap.exists())
        .map(snap => ({ id: snap.id, ...snap.data() } as Client));

    const componentPromises = equipments.map(equip => {
        const componentsCollection = collection(firestore, 'equipment', equip.id, 'components');
        return getDocs(componentsCollection).then(snapshot => ({
            equipmentId: equip.id,
            docs: snapshot.docs,
        }));
    });

    const componentSnapshots = await Promise.all(componentPromises);

    const components = componentSnapshots.flatMap(snapshot => 
        snapshot.docs.map(d => ({
            ...(d.data() as EquipmentComponent),
            id: d.id,
            equipmentId: snapshot.equipmentId,
        }))
    );
    
    await offlineDB.transaction('rw', offlineDB.workOrders, offlineDB.equipment, offlineDB.clients, offlineDB.components, async () => {
        await offlineDB.workOrders.bulkPut(workOrders);
        await offlineDB.equipment.bulkPut(equipments);
        await offlineDB.clients.bulkPut(clients);
        await offlineDB.components.bulkPut(components);
    });
}


/**
 * Attempts to sync all pending inspections from IndexedDB and localStorage to Firestore.
 */
export async function syncWithFirestore(firestore: Firestore) {
  const pending = await getAllPendingInspections();

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Attempting to sync ${pending.length} inspections.`);

  let synced = 0;
  let failed = 0;

  for (const inspection of pending) {
    if (!inspection.localId) continue;
    
    try {
      await ensureDBOpen();
      const batch = writeBatch(firestore);

      const inspectionRef = doc(collection(firestore, "inspections"));
      
      const finalInspectionData: Inspection = {
        ...inspection,
        id: inspectionRef.id,
        status: 'Finalizado'
      };
      batch.set(inspectionRef, finalInspectionData);

      const workOrderRef = doc(firestore, "workOrders", inspection.workOrderId);
      batch.update(workOrderRef, { status: "Concluída" });
      
      await batch.commit();

      // Remove de qualquer lugar onde esteja (IndexedDB ou localStorage)
      await removePendingInspection(inspection.localId);
      synced++;
      console.log(`[Sync] Successfully synced and removed inspection for WO: ${inspection.workOrderId}`);

    } catch (error) {
      console.error(`[Sync] Failed to sync inspection for WO: ${inspection.workOrderId}`, error);
      failed++;
    }
  }

  console.log(`[Sync] Finished. Synced: ${synced}, Failed: ${failed}`);
  return { synced, failed };
}
