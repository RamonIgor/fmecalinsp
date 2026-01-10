// This file now only contains type definitions.
// The mock data has been removed as we are now using Firestore.

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
  components: EquipmentComponent[];
};

export type Inspector = {
  id: string;
  name: string;
  phone: string;
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
  photoUrl?: string;
};

export type Inspection = {
  id: string;
  equipmentId: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  status: 'Pendente' | 'Sincronizado' | 'Finalizado';
  items: InspectionItem[];
  signatureUrl?: string;
};
