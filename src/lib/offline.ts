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

export const offlineDB = new OfflineDB();

/**
 * Ensures the database is open before performing any operation.
 */
async function ensureDBOpen(): Promise<void> {
  if (offlineDB.isOpen()) {
    return;
  }
  try {
    await offlineDB.open();
  } catch (err) {
    console.error('[OfflineDB] Falha ao abrir o banco de dados.', err);
    throw new Error(
      'Não foi possível abrir o armazenamento local. ' +
      'Verifique se o seu navegador permite armazenamento offline para este site (especialmente em modo anônimo).'
    );
  }
}

/**
 * Salva uma inspeção pendente no IndexedDB.
 */
export async function savePendingInspection(
  inspection: Omit<OfflineInspection, 'localId'>
): Promise<{ localId?: number }> {
    try {
      await ensureDBOpen();
      const localId = await offlineDB.pendingInspections.add(inspection);
      return { localId };
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            throw new Error('Armazenamento offline cheio. Por favor, sincronize os dados pendentes para liberar espaço.');
        }
        console.error("Falha ao salvar no IndexedDB:", e);
        throw new Error(`Falha ao salvar no banco de dados local: ${e.message || 'Erro desconhecido'}`);
    }
}

/**
 * Retorna todas as inspeções pendentes do IndexedDB.
 */
export async function getAllPendingInspections(): Promise<OfflineInspection[]> {
    try {
      await ensureDBOpen();
      return await offlineDB.pendingInspections.toArray();
    } catch {
      return [];
    }
}

/**
 * Remove uma inspeção pendente após sincronização bem-sucedida.
 */
export async function removePendingInspection(localId: number): Promise<void> {
    try {
      await ensureDBOpen();
      await offlineDB.pendingInspections.delete(localId);
    } catch(e) {
      console.error(`Failed to remove pending inspection with localId ${localId}`, e);
    }
}


/**
 * Fetches all data related to the given work orders and caches it in IndexedDB.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) return;

    await ensureDBOpen();

    const validWorkOrders = workOrders.filter(wo => wo.equipmentId && wo.clientId);

    const equipmentIds = [...new Set(validWorkOrders.map(wo => wo.equipmentId))];
    const clientIds = [...new Set(validWorkOrders.map(wo => wo.clientId))];

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
        await offlineDB.workOrders.bulkPut(validWorkOrders);
        await offlineDB.equipment.bulkPut(equipments);
        await offlineDB.clients.bulkPut(clients);
        await offlineDB.components.bulkPut(components);
    });
}


/**
 * Attempts to sync all pending inspections from IndexedDB to Firestore.
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
