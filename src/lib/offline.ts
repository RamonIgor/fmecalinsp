'use client';

import Dexie, { type Table } from 'dexie';
import { type Inspection, type WorkOrder, type Equipment, type Client, type EquipmentComponent } from './data';
import { type Firestore, collection, doc, writeBatch, getDoc, getDocs } from 'firebase/firestore';

// We store the inspection data, but omit properties that are generated upon sync.
export type OfflineInspection = Omit<Inspection, 'id' | 'status'> & {
  localId?: number; // Dexie's auto-incrementing primary key
};

// Add equipmentId to the component type for local storage
export type OfflineComponent = EquipmentComponent & { equipmentId: string };

export class OfflineDB extends Dexie {
  pendingInspections!: Table<OfflineInspection, number>;
  workOrders!: Table<WorkOrder, string>;
  equipment!: Table<Equipment, string>;
  clients!: Table<Client, string>;
  components!: Table<OfflineComponent, string>;


  constructor() {
    super('FmecalOfflineDB');
    this.version(3).stores({
      pendingInspections: '++localId, workOrderId, inspectorId',
      workOrders: 'id, inspectorId, status', // Use firestore ID as primary key
      equipment: 'id, clientId',
      clients: 'id',
      components: 'id, equipmentId',
    });
  }
}

export const offlineDB = new OfflineDB();


/**
 * Fetches all data related to the given work orders and caches it in IndexedDB.
 * @param firestore The Firestore instance.
 * @param workOrders The list of work orders to cache.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) return;

    const equipmentIds = [...new Set(workOrders.map(wo => wo.equipmentId))];
    const clientIds = [...new Set(workOrders.map(wo => wo.clientId))];

    const equipmentPromises = equipmentIds.map(id => getDoc(doc(firestore, 'equipment', id)));
    const clientPromises = clientIds.map(id => getDoc(doc(firestore, 'clients', id)));
    
    const equipmentSnapshots = await Promise.all(equipmentPromises);
    const clientSnapshots = await Promise.all(clientPromises);

    const equipments = equipmentSnapshots.map(snap => ({ id: snap.id, ...snap.data() } as Equipment)).filter(e => e.name);
    const clients = clientSnapshots.map(snap => ({ id: snap.id, ...snap.data() } as Client)).filter(c => c.name);

    // Fetch all components collections in parallel to improve performance
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
 * @param firestore The Firestore instance.
 * @returns An object with the count of synced and failed inspections.
 */
export async function syncWithFirestore(firestore: Firestore) {
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

      // 1. Create a new inspection document ref to get a unique ID
      const inspectionRef = doc(collection(firestore, "inspections"));
      
      // 2. Prepare the final inspection data with the new ID and final status
      const finalInspectionData: Inspection = {
        ...inspection,
        id: inspectionRef.id,
        status: 'Finalizado'
      };
      batch.set(inspectionRef, finalInspectionData);

      // 3. Update the corresponding work order status to 'Concluída'
      const workOrderRef = doc(firestore, "workOrders", inspection.workOrderId);
      batch.update(workOrderRef, { status: "Concluída" });
      
      // 4. Commit the batch transaction to Firestore
      await batch.commit();

      // 5. If sync is successful, remove the inspection from the local offline DB
      await offlineDB.pendingInspections.delete(inspection.localId);
      synced++;
      console.log(`[Sync] Successfully synced and removed inspection for WO: ${inspection.workOrderId}`);

    } catch (error) {
      console.error(`[Sync] Failed to sync inspection for WO: ${inspection.workOrderId}`, error);
      failed++;
      // We don't delete from local DB if sync fails, so it can be retried.
    }
  }

  console.log(`[Sync] Finished. Synced: ${synced}, Failed: ${failed}`);
  return { synced, failed };
}
