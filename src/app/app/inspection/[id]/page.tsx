import { equipments, checklists } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, FileSignature, Send } from 'lucide-react';
import { SignaturePad } from './components/signature-pad';
import { SaveInspectionButton } from './components/save-inspection-button';

// This is a server component to fetch initial data
export default function InspectionPage({ params }: { params: { id: string } }) {
  const equipment = equipments.find(e => e.id === params.id);
  const checklist = checklists.find(c => c.id === 'cl-nr11'); // Assuming NR-11 for all

  if (!equipment || !checklist) {
    return <div>Equipamento ou Checklist não encontrado.</div>;
  }

  const groupedQuestions = checklist.questions.reduce((acc, q) => {
    (acc[q.category] = acc[q.category] || []).push(q);
    return acc;
  }, {} as Record<string, typeof checklist.questions>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Inspecionando: {equipment.name} ({equipment.tag})</CardTitle>
        </CardHeader>
      </Card>
      
      <Accordion type="multiple" defaultValue={Object.keys(groupedQuestions)} className="w-full space-y-4">
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
                    <RadioGroup className="flex space-x-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Conforme" id={`${question.id}-conforme`} />
                        <Label htmlFor={`${question.id}-conforme`}>Conforme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Não Conforme" id={`${question.id}-nao-conforme`} />
                        <Label htmlFor={`${question.id}-nao-conforme`}>Não Conforme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NA" id={`${question.id}-na`} />
                        <Label htmlFor={`${question.id}-na`}>NA</Label>
                      </div>
                    </RadioGroup>
                    <Textarea placeholder="Observações..." />
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
          <CardTitle className="flex items-center gap-2"><FileSignature/> Assinatura do Inspetor</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad />
        </CardContent>
      </Card>

      <SaveInspectionButton />
    </div>
  );
}
