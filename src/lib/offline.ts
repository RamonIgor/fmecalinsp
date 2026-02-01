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

// ─── Instância lazy: só cria quando chamado pela primeira vez ───
let _db: OfflineDB | null = null;

export function getOfflineDB(): OfflineDB {
  if (!_db) {
    _db = new OfflineDB();
  }
  return _db;
}

// Mantém compatibilidade com código existente que usa `offlineDB` diretamente
export const offlineDB = new Proxy({} as OfflineDB, {
  get(_target, prop) {
    return (getOfflineDB() as any)[prop];
  }
});


// ─── Função que testa e garante que o DB está aberto antes de usar ───
export async function ensureDBOpen(): Promise<OfflineDB> {
  const db = getOfflineDB();
  
  if (db.isOpen()) return db;

  try {
    await db.open();
    return db;
  } catch (err) {
    // Se falhou, tenta fechar e reabrir uma vez
    console.warn('[OfflineDB] Primeira tentativa falhou, tentando reabrir...', err);
    db.close();
    
    // Pequeno delay para garantir que o recurso foi liberado
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      await db.open();
      return db;
    } catch (err2) {
      console.error('[OfflineDB] Falhou também na segunda tentativa.', err2);
      throw new Error(
        'Não foi possível abrir o armazenamento local. ' +
        'Verifique se o seu navegador permite armazenamento offline para este site.'
      );
    }
  }
}


/**
 * Fetches all data related to the given work orders and caches it in IndexedDB.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) return;

    // ── Garante que o DB está aberto antes de usar ──
    await ensureDBOpen();

    const equipmentIds = [...new Set(workOrders.map(wo => wo.equipmentId))];
    const clientIds = [...new Set(workOrders.map(wo => wo.clientId))];

    const equipmentPromises = equipmentIds.map(id => getDoc(doc(firestore, 'equipment', id)));
    const clientPromises = clientIds.map(id => getDoc(doc(firestore, 'clients', id)));
    
    const equipmentSnapshots = await Promise.all(equipmentPromises);
    const clientSnapshots = await Promise.all(clientPromises);

    const equipments = equipmentSnapshots.map(snap => ({ id: snap.id, ...snap.data() } as Equipment)).filter(e => e.name);
    const clients = clientSnapshots.map(snap => ({ id: snap.id, ...snap.data() } as Client)).filter(c => c.name);

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
 * Attempts to sync all pending inspections from IndexedDB to Firestore.
 */
export async function syncWithFirestore(firestore: Firestore) {
  // ── Garante que o DB está aberto antes de usar ──
  await ensureDBOpen();

  const pending = await offlineDB.pendingInspections.toArray();
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Attempting to sync ${pending.length} inspections.`);

  let synced = 0;
  let failed = 0;

  for (const inspection of pending) {
    if (!inspection.localId) continue;
    
    try {
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

      await offlineDB.pendingInspections.delete(inspection.localId);
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