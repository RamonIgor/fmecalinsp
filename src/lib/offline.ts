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
 * Garante que o banco de dados está aberto antes de qualquer operação.
 */
async function ensureDBOpen(): Promise<void> {
  if (offlineDB.isOpen()) return;
  
  try {
    await offlineDB.open();
  } catch (err: any) {
    console.error('[OfflineDB] Erro crítico ao abrir banco:', err);
    throw new Error(
      `Erro no armazenamento local: ${err.message || 'Desconhecido'}. ` +
      'Tente fechar abas anônimas ou liberar espaço no navegador.'
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
      
      if (!inspection.workOrderId || !inspection.equipmentId) {
        throw new Error('Dados incompletos: IDs da OS ou Equipamento ausentes.');
      }

      const localId = await offlineDB.pendingInspections.add(inspection);
      console.log('[OfflineDB] Sucesso ao salvar inspeção local:', localId);
      return { localId };
    } catch (e: any) {
        console.error("[OfflineDB] Erro ao salvar inspeção:", e);
        throw new Error(`Erro ao salvar no dispositivo: ${e.message || 'Erro de banco de dados'}`);
    }
}

/**
 * Retorna todas as inspeções pendentes.
 */
export async function getAllPendingInspections(): Promise<OfflineInspection[]> {
    try {
      await ensureDBOpen();
      return await offlineDB.pendingInspections.toArray();
    } catch (e) {
      return [];
    }
}

/**
 * Remove uma inspeção pendente após sincronização.
 */
export async function removePendingInspection(localId: number): Promise<void> {
    try {
      await ensureDBOpen();
      await offlineDB.pendingInspections.delete(localId);
    } catch(e) {
      console.error(`[OfflineDB] Erro ao remover localId ${localId}`, e);
    }
}

/**
 * Baixa e armazena todos os dados necessários para realizar as inspeções offline.
 */
export async function cacheDataForOffline(firestore: Firestore, workOrders: WorkOrder[]) {
    if (!workOrders || workOrders.length === 0) return;

    await ensureDBOpen();

    // Filtrar apenas OS que tem IDs válidos para evitar erros de busca
    const validWos = workOrders.filter(wo => wo.equipmentId && wo.clientId);
    
    const equipmentIds = [...new Set(validWos.map(wo => wo.equipmentId))];
    const clientIds = [...new Set(validWos.map(wo => wo.clientId))];

    try {
      // Buscar dados do Firestore com tratamento de erro individual
      const equipmentPromises = equipmentIds.map(id => 
        getDoc(doc(firestore, 'equipment', id)).catch(() => null)
      );
      const clientPromises = clientIds.map(id => 
        getDoc(doc(firestore, 'clients', id)).catch(() => null)
      );
      
      const [equipSnaps, clientSnaps] = await Promise.all([
        Promise.all(equipmentPromises),
        Promise.all(clientPromises)
      ]);

      const equipments = equipSnaps
          .filter(s => s && s.exists())
          .map(s => ({ id: s!.id, ...s!.data() } as Equipment));
      
      const clients = clientSnaps
          .filter(s => s && s.exists())
          .map(s => ({ id: s!.id, ...s!.data() } as Client));

      // Buscar componentes apenas para os equipamentos encontrados
      const components: OfflineComponent[] = [];
      for (const equip of equipments) {
          try {
              const compSnap = await getDocs(collection(firestore, 'equipment', equip.id, 'components'));
              compSnap.docs.forEach(d => {
                  components.push({
                      ...(d.data() as EquipmentComponent),
                      id: d.id,
                      equipmentId: equip.id
                  });
              });
          } catch (e) {
              console.warn(`[OfflineDB] Pulei componentes do equip ${equip.id} devido a erro.`);
          }
      }

      // Salva tudo de uma vez
      await offlineDB.transaction('rw', [
          offlineDB.workOrders, 
          offlineDB.equipment, 
          offlineDB.clients, 
          offlineDB.components
      ], async () => {
          await offlineDB.workOrders.bulkPut(validWos);
          if (equipments.length > 0) await offlineDB.equipment.bulkPut(equipments);
          if (clients.length > 0) await offlineDB.clients.bulkPut(clients);
          if (components.length > 0) await offlineDB.components.bulkPut(components);
      });

      console.log('[OfflineDB] Cache concluído com sucesso!');
    } catch (error: any) {
      console.error('[OfflineDB] Erro no cache:', error);
      throw new Error(`Falha no download: ${error.message || 'Erro de rede ou permissão.'}`);
    }
}

/**
 * Sincroniza inspeções do banco local para o Firestore.
 */
export async function syncWithFirestore(firestore: Firestore) {
  const pending = await getAllPendingInspections();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const inspection of pending) {
    if (!inspection.localId) continue;
    
    try {
      const batch = writeBatch(firestore);
      const inspectionRef = doc(collection(firestore, "inspections"));
      
      const finalData: Inspection = {
        ...inspection,
        id: inspectionRef.id,
        status: 'Finalizado'
      };
      
      batch.set(inspectionRef, finalData);
      batch.update(doc(firestore, "workOrders", inspection.workOrderId), { status: "Concluída" });
      
      await batch.commit();
      await removePendingInspection(inspection.localId);
      synced++;
    } catch (error) {
      console.error(`[Sync] Falha na WO ${inspection.workOrderId}:`, error);
      failed++;
    }
  }

  return { synced, failed };
}
