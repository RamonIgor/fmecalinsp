'use client';

import Dexie, { type Table } from 'dexie';
import { type Inspection } from './data';
import { type Firestore, collection, doc, writeBatch } from 'firebase/firestore';

// We store the inspection data, but omit properties that are generated upon sync.
export type OfflineInspection = Omit<Inspection, 'id' | 'status'> & {
  localId?: number; // Dexie's auto-incrementing primary key
};

export class OfflineDB extends Dexie {
  pendingInspections!: Table<OfflineInspection, number>; 

  constructor() {
    super('FmecalOfflineDB');
    this.version(1).stores({
      pendingInspections: '++localId,workOrderId',
    });
  }
}

export const offlineDB = new OfflineDB();

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
