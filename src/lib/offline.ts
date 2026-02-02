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
      
      // Validação básica dos dados
      if (!inspection.workOrderId || !inspection.equipmentId || !inspection.inspectorId) {
        throw new Error('Dados obrigatórios da inspeção estão faltando.');
      }

      if (!inspection.items || inspection.items.length === 0) {
        throw new Error('A inspeção deve conter ao menos um item respondido.');
      }

      const localId = await offlineDB.pendingInspections.add(inspection);
      console.log('[OfflineDB] Inspeção salva localmente com ID:', localId);
      return { localId };
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            throw new Error('Armazenamento offline cheio. Por favor, sincronize os dados pendentes para liberar espaço.');
        }
        console.error("[OfflineDB] Falha ao salvar no IndexedDB:", e);
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
    } catch (e) {
      console.error('[OfflineDB] Erro ao buscar inspeções pendentes:', e);
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
      console.log('[OfflineDB] Inspeção pendente removida:', localId);
    } catch(e) {
      console.error(`[OfflineDB] Falha ao remover inspeção pendente com localId ${localId}`, e);
    }
}


/**
 * Fetches all data related to the given work orders and caches it in IndexedDB.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) {
      console.warn('[OfflineDB] Nenhuma ordem de serviço para cachear.');
      return;
    }

    await ensureDBOpen();

    const validWorkOrders = workOrders.filter(wo => wo.equipmentId && wo.clientId);
    
    if (validWorkOrders.length === 0) {
      throw new Error('Nenhuma ordem de serviço válida encontrada (faltam equipmentId ou clientId).');
    }

    console.log(`[OfflineDB] Cacheando dados de ${validWorkOrders.length} ordens de serviço...`);

    const equipmentIds = [...new Set(validWorkOrders.map(wo => wo.equipmentId))];
    const clientIds = [...new Set(validWorkOrders.map(wo => wo.clientId))];

    try {
      // Buscar equipamentos
      const equipmentPromises = equipmentIds.map(id => 
        getDoc(doc(firestore, 'equipment', id))
          .catch(err => {
            console.error(`[OfflineDB] Erro ao buscar equipamento ${id}:`, err);
            return null;
          })
      );
      
      // Buscar clientes
      const clientPromises = clientIds.map(id => 
        getDoc(doc(firestore, 'clients', id))
          .catch(err => {
            console.error(`[OfflineDB] Erro ao buscar cliente ${id}:`, err);
            return null;
          })
      );
      
      const equipmentSnapshots = (await Promise.all(equipmentPromises)).filter(snap => snap !== null);
      const clientSnapshots = (await Promise.all(clientPromises)).filter(snap => snap !== null);

      const equipments = equipmentSnapshots
          .filter(snap => snap!.exists())
          .map(snap => ({ id: snap!.id, ...snap!.data() } as Equipment));
      
      const clients = clientSnapshots
          .filter(snap => snap!.exists())
          .map(snap => ({ id: snap!.id, ...snap!.data() } as Client));

      console.log(`[OfflineDB] Equipamentos encontrados: ${equipments.length}`);
      console.log(`[OfflineDB] Clientes encontrados: ${clients.length}`);

      // Buscar componentes
      const componentPromises = equipments.map(equip => {
          const componentsCollection = collection(firestore, 'equipment', equip.id, 'components');
          return getDocs(componentsCollection)
            .then(snapshot => ({
              equipmentId: equip.id,
              docs: snapshot.docs,
            }))
            .catch(err => {
              console.error(`[OfflineDB] Erro ao buscar componentes do equipamento ${equip.id}:`, err);
              return { equipmentId: equip.id, docs: [] };
            });
      });

      const componentSnapshots = await Promise.all(componentPromises);

      const components = componentSnapshots.flatMap(snapshot => 
          snapshot.docs.map(d => ({
              ...(d.data() as EquipmentComponent),
              id: d.id,
              equipmentId: snapshot.equipmentId,
          }))
      );

      console.log(`[OfflineDB] Componentes encontrados: ${components.length}`);
      
      // Salvar tudo no IndexedDB em uma transação
      await offlineDB.transaction('rw', offlineDB.workOrders, offlineDB.equipment, offlineDB.clients, offlineDB.components, async () => {
          await offlineDB.workOrders.bulkPut(validWorkOrders);
          await offlineDB.equipment.bulkPut(equipments);
          await offlineDB.clients.bulkPut(clients);
          await offlineDB.components.bulkPut(components);
      });

      console.log('[OfflineDB] Dados cacheados com sucesso!');
    } catch (error) {
      console.error('[OfflineDB] Erro ao cachear dados:', error);
      throw new Error('Falha ao baixar dados para modo offline. Verifique sua conexão e tente novamente.');
    }
}


/**
 * Attempts to sync all pending inspections from IndexedDB to Firestore.
 */
export async function syncWithFirestore(firestore: Firestore) {
  const pending = await getAllPendingInspections();

  if (pending.length === 0) {
    console.log('[Sync] Nenhuma inspeção pendente para sincronizar.');
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Tentando sincronizar ${pending.length} inspeções.`);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const inspection of pending) {
    if (!inspection.localId) {
      console.warn('[Sync] Inspeção sem localId, pulando...');
      continue;
    }
    
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
      console.log(`[Sync] Inspeção sincronizada com sucesso: WO ${inspection.workOrderId}`);

    } catch (error: any) {
      console.error(`[Sync] Falha ao sincronizar inspeção para WO: ${inspection.workOrderId}`, error);
      errors.push(`WO ${inspection.workOrderId}: ${error.message}`);
      failed++;
    }
  }

  console.log(`[Sync] Finalizado. Sincronizados: ${synced}, Falhas: ${failed}`);
  
  if (errors.length > 0) {
    console.error('[Sync] Erros detalhados:', errors);
  }

  return { synced, failed };
}