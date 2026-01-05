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
  email: string;
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

export const equipments: Equipment[] = [
  { id: 'equip-1', tag: 'PR-001', name: 'Ponte Rolante 10T', sector: 'Produção A', lastInspection: '2024-06-15', status: 'Operacional', components: [{id: 'comp-1', name: 'Estrutura Principal'}, {id: 'comp-2', name: 'Carro de Elevação'}] },
  { id: 'equip-2', tag: 'PR-002', name: 'Ponte Rolante 5T', sector: 'Produção B', lastInspection: '2024-05-20', status: 'Requer Atenção', components: [] },
  { id: 'equip-3', tag: 'PR-003', name: 'Ponte Rolante 20T', sector: 'Estocagem', lastInspection: '2024-07-01', status: 'Operacional', components: [] },
  { id: 'equip-4', tag: 'PR-004', name: 'Ponte Rolante 5T', sector: 'Manutenção', lastInspection: '2023-12-10', status: 'Fora de Serviço', components: [] },
  { id: 'equip-5', tag: 'GAN-001', name: 'Pórtico 15T', sector: 'Pátio Externo', lastInspection: '2024-07-05', status: 'Operacional', components: [] },
];

export const inspectors: Inspector[] = [
  { id: 'insp-1', name: 'João da Silva', email: 'joao.silva@example.com' },
  { id: 'insp-2', name: 'Maria Oliveira', email: 'maria.oliveira@example.com' },
  { id: 'insp-3', name: 'Carlos Pereira', email: 'carlos.pereira@example.com' },
];

export const checklists: Checklist[] = [
  {
    id: 'cl-nr11',
    name: 'NR-11 Inspeção de Segurança',
    questions: [
      { id: 'q1', category: 'Estrutura', text: 'Verificar trincas, corrosão ou deformações na estrutura principal.' },
      { id: 'q2', category: 'Estrutura', text: 'Inspecionar a condição dos parafusos e rebites de fixação.' },
      { id: 'q3', category: 'Movimentação', text: 'Testar o funcionamento dos freios de translação da ponte e do carro.' },
      { id: 'q4', category: 'Movimentação', text: 'Verificar a lubrificação das rodas e redutores.' },
      { id: 'q5', category: 'Içamento', text: 'Inspecionar cabo de aço quanto a desgaste, corrosão ou fios rompidos.' },
      { id: 'q6', category: 'Içamento', text: 'Verificar o funcionamento do limitador de altura (fim de curso).' },
      { id: 'q7', category: 'Içamento', text: 'Inspecionar gancho quanto a trincas, deformações e trava de segurança.' },
      { id: 'q8', category: 'Elétrica', text: 'Verificar estado dos cabos elétricos e isolamento.' },
      { id: 'q9', category: 'Elétrica', text: 'Testar o funcionamento da botoeira de comando e botão de emergência.' },
      { id: 'q10', category: 'Segurança', text: 'Verificar a presença e legibilidade das placas de capacidade.' },
      { id: 'q11', category: 'Segurança', text: 'Confirmar funcionamento do alarme sonoro e visual de movimento.' },
    ],
  },
];

export const inspections: Inspection[] = [
    {
        id: 'insp-001',
        equipmentId: 'equip-2',
        inspectorId: 'user-123',
        inspectorName: 'João Silva',
        date: '2024-05-20',
        status: 'Finalizado',
        items: [
            { questionId: 'q1', questionText: 'Verificar trincas, corrosão ou deformações na estrutura principal.', answer: 'Conforme', observation: '' },
            { questionId: 'q5', questionText: 'Inspecionar cabo de aço quanto a desgaste, corrosão ou fios rompidos.', answer: 'Não Conforme', observation: 'Desgaste acentuado no cabo principal, recomendada a troca imediata.', photoUrl: 'https://picsum.photos/seed/106/400/400' },
            { questionId: 'q9', questionText: 'Testar o funcionamento da botoeira de comando e botão de emergência.', answer: 'Conforme', observation: 'Funcionamento normal.' }
        ],
        signatureUrl: '/signature-placeholder.png'
    },
    {
        id: 'insp-002',
        equipmentId: 'equip-3',
        inspectorId: 'user-124',
        inspectorName: 'Maria Oliveira',
        date: '2024-07-01',
        status: 'Finalizado',
        items: [
            { questionId: 'q1', questionText: 'Verificar trincas, corrosão ou deformações na estrutura principal.', answer: 'Conforme', observation: 'Tudo OK.' },
            { questionId: 'q3', questionText: 'Testar o funcionamento dos freios de translação da ponte e do carro.', answer: 'Conforme', observation: '' },
            { questionId: 'q7', questionText: 'Inspecionar gancho quanto a trincas, deformações e trava de segurança.', answer: 'Conforme', observation: '' },
        ],
        signatureUrl: '/signature-placeholder.png'
    }
];
