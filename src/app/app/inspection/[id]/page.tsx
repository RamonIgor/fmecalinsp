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
import { Camera, FileSignature, Loader2, Trash2 } from 'lucide-react';
import { SignaturePad } from './components/signature-pad';
import { SaveInspectionButton } from './components/save-inspection-button';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Equipment, EquipmentComponent, InspectionItem, WorkOrder } from '@/lib/data';
import React, { useState, useMemo } from 'react';
import { CameraCaptureDialog } from './components/camera-capture-dialog';
import Image from 'next/image';


export default function InspectionPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const workOrderId = React.use(params).id;

  // State to hold all form data
  const [inspectionItems, setInspectionItems] = useState<Record<string, Partial<InspectionItem>>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);

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

  const componentsRef = useMemoFirebase(
    () => (firestore && equipmentId ? collection(firestore, 'equipment', equipmentId, 'components') : null),
    [firestore, equipmentId]
  );
  const { data: components, isLoading: isLoadingComponents } = useCollection<EquipmentComponent>(componentsRef);
  

  const handleItemChange = (componentId: string, componentName: string, field: 'answer' | 'observation', value: string) => {
    setInspectionItems(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        questionId: componentId,
        questionText: componentName,
        [field]: value,
      },
    }));
  };
  
  const handleAttachPhotoClick = (componentId: string) => {
    setActiveComponentId(componentId);
    setIsCameraOpen(true);
  };

  const handlePhotoCaptured = (dataUrl: string) => {
    if (activeComponentId) {
        const componentName = components?.find(c => c.id === activeComponentId)?.name || '';
        setInspectionItems(prev => {
            const currentItem = prev[activeComponentId] || {};
            const currentPhotos = currentItem.photoUrls || [];
            
            return {
                ...prev,
                [activeComponentId]: {
                    ...currentItem,
                    questionId: activeComponentId,
                    questionText: componentName,
                    photoUrls: [...currentPhotos, dataUrl]
                }
            };
        });
    }
    setActiveComponentId(null);
  };
  
  const handleRemovePhoto = (componentId: string, photoIndex: number) => {
    setInspectionItems(prev => {
        const itemToUpdate = prev[componentId];
        if (itemToUpdate && itemToUpdate.photoUrls) {
            const newPhotos = [...itemToUpdate.photoUrls];
            newPhotos.splice(photoIndex, 1);
            return {
                ...prev,
                [componentId]: {
                    ...itemToUpdate,
                    photoUrls: newPhotos,
                }
            };
        }
        return prev;
    });
  };

  const isLoading = isLoadingWorkOrder || isLoadingEquipment || isLoadingComponents;

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workOrder || !equipment || !components) {
    return <div>Ordem de Serviço, Equipamento ou Componentes não encontrados.</div>;
  }

  const groupedComponents = components.reduce(
    (acc, component) => {
      const [category] = component.name.split(':');
      const cleanCategory = category.trim();
      (acc[cleanCategory] = acc[cleanCategory] || []).push(component);
      return acc;
    },
    {} as Record<string, EquipmentComponent[]>
  );
  
  const finalInspectionData = {
    workOrderId: workOrderId,
    equipmentId: equipment.id,
    inspectorId: user?.uid ?? '',
    inspectorName: user?.displayName ?? 'N/A',
    date: new Date().toISOString(),
    status: 'Finalizado',
    items: Object.values(inspectionItems).filter(item => item.answer) as InspectionItem[], // Only include answered items
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
        defaultValue={Object.keys(groupedComponents)}
        className="w-full space-y-4"
      >
        {Object.entries(groupedComponents).map(([category, componentList]) => (
          <Card key={category} className="overflow-hidden">
            <AccordionItem value={category} className="border-b-0">
              <AccordionTrigger className="bg-muted px-4 py-3 text-lg font-bold">
                {category}
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-6">
                {componentList.map((component) => {
                  const photoUrls = inspectionItems[component.id]?.photoUrls || [];
                  const displayName = component.name.includes(':') ? component.name.split(':')[1].trim() : component.name;

                  return (
                    <div key={component.id} className="p-4 rounded-lg border">
                      <p className="font-semibold mb-4">{displayName}</p>
                      <RadioGroup 
                        className="flex space-x-4 mb-4"
                        onValueChange={(value) => handleItemChange(component.id, component.name, 'answer', value)}
                        value={inspectionItems[component.id]?.answer}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Conforme"
                            id={`${component.id}-conforme`}
                          />
                          <Label htmlFor={`${component.id}-conforme`}>Conforme</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Não Conforme"
                            id={`${component.id}-nao-conforme`}
                          />
                          <Label htmlFor={`${component.id}-nao-conforme`}>
                            Não Conforme
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NA" id={`${component.id}-na`} />
                          <Label htmlFor={`${component.id}-na`}>NA</Label>
                        </div>
                      </RadioGroup>
                      <Textarea 
                        placeholder="Observações..." 
                        onChange={(e) => handleItemChange(component.id, component.name, 'observation', e.target.value)}
                        value={inspectionItems[component.id]?.observation || ''}
                      />
                       <div className="mt-4 space-y-4">
                        {photoUrls.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {photoUrls.map((url, index) => (
                              <div key={index} className="relative group aspect-video rounded-md overflow-hidden border">
                                <Image src={url} alt={`Foto da inspeção ${index + 1}`} fill className="object-cover" />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={() => handleRemovePhoto(component.id, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remover foto</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleAttachPhotoClick(component.id)}
                        >
                            <Camera className="mr-2 h-4 w-4" /> 
                            {photoUrls.length > 0 ? 'Anexar Mais Fotos' : 'Anexar Foto'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
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

      <CameraCaptureDialog 
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onPhotoCapture={handlePhotoCaptured}
      />
    </div>
  );
}
