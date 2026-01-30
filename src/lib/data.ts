// This file now only contains type definitions.
// The mock data has been removed as we are now using Firestore.

export type WithId<T> = T & { id: string };

export type User = {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'inspector';
  photoURL?: string;
}

export type EquipmentComponent = {
  id: string;
  name: string;
};

export type Equipment = {
  id: string;
  tag: string;
  name: string;
  sector: string;
  lastInspection: string | null;
  status: 'Operacional' | 'Requer Atenção' | 'Fora de Serviço';
  components?: EquipmentComponent[]; // Optional because it's a subcollection
  clientId?: string; // Foreign key to clients
};

export type Inspector = {
  id: string;
  name: string;
  phone: string;
  userId?: string;
};

export type Client = {
    id: string;
    name: string;
    address: string;
};

export type ChecklistQuestion = {
  id: string;
  category: string;
  text: string;
};

export type Checklist = {
  id: string;
  name: string;
  questions: ChecklistQuestion[];
};

export type InspectionItem = {
  questionId: string;
  questionText: string;
  answer: 'Conforme' | 'Não Conforme' | 'NA';
  observation: string;
  photoUrls?: string[];
};

export type Inspection = {
  id:string;
  workOrderId: string;
  equipmentId: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  status: 'Pendente' | 'Sincronizado' | 'Finalizado';
  items: InspectionItem[];
  signatureUrl?: string | null;
};

export type WorkOrder = {
  id: string;
  displayId?: string;
  clientId: string;
  equipmentId: string;
  inspectorId: string;
  scheduledDate?: string;
  createdAt?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  notes?: string;
}
