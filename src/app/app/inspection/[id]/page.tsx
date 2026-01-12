'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, FileSignature, Loader2 } from 'lucide-react';
import { SignaturePad } from './components/signature-pad';
import { SaveInspectionButton } from './components/save-inspection-button';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Equipment, Checklist, ChecklistQuestion, InspectionItem, WorkOrder } from '@/lib/data';
import React, { useState } from 'react';

// Mock checklist data until it's moved to Firestore
const MOCK_CHECKLIST_ID = 'cl-nr11';
const MOCK_CHECKLISTS: Checklist[] = [
    {
        id: 'cl-nr11',
        name: 'NR-11 Pontes Rolantes',
        questions: [
            { id: 'q1', category: 'Estrutura', text: 'Verificar trincas, amassados ou corrosão na estrutura principal.' },
            { id: 'q2', category: 'Estrutura', text: 'Inspecionar parafusos e fixações da viga.' },
            { id: 'q3', category: 'Carro/Trolley', text: 'Verificar rodas, eixos e rolamentos do carro.' },
            { id: 'q4', category: 'Sistema de Elevação', text: 'Inspecionar cabo de aço ou corrente (desgaste, corrosão, arames rompidos).' },
            { id: 'q5', category: 'Sistema de Elevação', text: 'Verificar funcionamento do gancho e trava de segurança.' },
            { id: 'q6', category: 'Sistema Elétrico', text: 'Inspecionar botoeira de comando e cabos de alimentação.' },
        ]
    }
];


export default function InspectionPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const workOrderId = React.use(params).id;

  // State to hold all form data
  const [inspectionItems, setInspectionItems] = useState<Record<string, InspectionItem>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const workOrderRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'workOrders', workOrderId) : null),
    [firestore, workOrderId]
  );
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useDoc<WorkOrder>(workOrderRef);

  const equipmentId = workOrder?.equipmentId;
  const equipmentRef = useMemoFirebase(
    () => (firestore && equipmentId ? doc(firestore, 'equipment', equipmentId) : null),
    [firestore, equipmentId]
  );
  const { data: equipment, isLoading: isLoadingEquipment } = useDoc<Equipment>(equipmentRef);
  
  const checklist = MOCK_CHECKLISTS.find(c => c.id === MOCK_CHECKLIST_ID);

  const handleItemChange = (questionId: string, questionText: string, field: 'answer' | 'observation', value: string) => {
    setInspectionItems(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        questionText,
        [field]: value,
      } as InspectionItem,
    }));
  };

  if (isLoadingWorkOrder || isLoadingEquipment) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workOrder || !equipment || !checklist) {
    return <div>Ordem de Serviço, Equipamento ou Checklist não encontrado.</div>;
  }

  const groupedQuestions = checklist.questions.reduce(
    (acc, q) => {
      (acc[q.category] = acc[q.category] || []).push(q);
      return acc;
    },
    {} as Record<string, ChecklistQuestion[]>
  );
  
  const finalInspectionData = {
    workOrderId: workOrderId,
    equipmentId: equipment.id,
    inspectorId: user?.uid ?? '',
    inspectorName: user?.displayName ?? 'N/A',
    date: new Date().toISOString(),
    status: 'Finalizado',
    items: Object.values(inspectionItems).filter(item => item.answer), // Only include answered questions
    signatureUrl: signatureDataUrl,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Inspecionando: {equipment.name} ({equipment.tag})
          </CardTitle>
        </CardHeader>
      </Card>

      <Accordion
        type="multiple"
        defaultValue={Object.keys(groupedQuestions)}
        className="w-full space-y-4"
      >
        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <Card key={category} className="overflow-hidden">
            <AccordionItem value={category} className="border-b-0">
              <AccordionTrigger className="bg-muted px-4 py-3 text-lg font-bold">
                {category}
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-6">
                {questions.map((question) => (
                  <div key={question.id} className="p-4 rounded-lg border">
                    <p className="font-semibold mb-4">{question.text}</p>
                    <RadioGroup 
                      className="flex space-x-4 mb-4"
                      onValueChange={(value) => handleItemChange(question.id, question.text, 'answer', value)}
                      value={inspectionItems[question.id]?.answer}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="Conforme"
                          id={`${question.id}-conforme`}
                        />
                        <Label htmlFor={`${question.id}-conforme`}>Conforme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="Não Conforme"
                          id={`${question.id}-nao-conforme`}
                        />
                        <Label htmlFor={`${question.id}-nao-conforme`}>
                          Não Conforme
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NA" id={`${question.id}-na`} />
                        <Label htmlFor={`${question.id}-na`}>NA</Label>
                      </div>
                    </RadioGroup>
                    <Textarea 
                      placeholder="Observações..." 
                      onChange={(e) => handleItemChange(question.id, question.text, 'observation', e.target.value)}
                      value={inspectionItems[question.id]?.observation || ''}
                    />
                    <Button variant="outline" className="mt-4 w-full">
                      <Camera className="mr-2 h-4 w-4" /> Anexar Foto
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature /> Assinatura do Inspetor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad onSignatureEnd={setSignatureDataUrl} />
        </CardContent>
      </Card>

      <SaveInspectionButton inspectionData={finalInspectionData} />
    </div>
  );
}
