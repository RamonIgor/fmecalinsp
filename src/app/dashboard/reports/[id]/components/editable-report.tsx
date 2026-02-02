'use client';

import React from 'react';
import {
  type Inspection,
  type WorkOrder,
  type Equipment,
  type Client,
} from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Logo from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Component to render a badge for the inspection item status
const StatusBadge = ({ answer }: { answer: Inspection['items'][0]['answer'] }) => {
    switch (answer) {
        case 'Conforme':
            return <Badge variant="default" className="bg-status-green text-white">Conforme</Badge>;
        case 'Não Conforme':
            return <Badge variant="destructive">Não Conforme</Badge>;
        case 'NA':
            return <Badge variant="secondary">N/A</Badge>;
        default:
            return null;
    }
};

interface EditableReportProps {
  inspection: Inspection;
  workOrder: WorkOrder;
  equipment: Equipment;
  client: Client;
}

export function EditableReport({ inspection, workOrder, equipment, client }: EditableReportProps) {

  const nonConformingItems = inspection.items.filter(item => item.answer === 'Não Conforme');
  const conformingItems = inspection.items.filter(item => item.answer === 'Conforme');
  const naItems = inspection.items.filter(item => item.answer === 'NA');

  const itemsWithPhotos = inspection.items.filter(item => item.photoUrls && item.photoUrls.length > 0);
  
  let sectionCounter = 1;

  return (
    <Card className="report-card font-sans">
      <CardContent className="p-0 report-content">
        <div 
          contentEditable="true" 
          suppressContentEditableWarning={true} 
          className="p-8 md:p-12 print-content bg-white text-black rounded-lg outline-none ring-2 ring-dashed ring-yellow-400/80 focus:ring-primary focus:ring-2 print:ring-0 print:shadow-none"
        >
          {/* Report Header */}
          <header className="flex items-start justify-between mb-8 report-header">
            <div className="flex items-center gap-4">
              <Logo className="h-16 w-16" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">F.Mecal Insp.</h1>
                <p className="text-gray-600">Relatório Técnico de Inspeção</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p><span className="font-bold">OS:</span> {workOrder.displayId}</p>
              <p><span className="font-bold">Data:</span> {new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
            </div>
          </header>

          <main className="space-y-8">
            {/* Section 1: Client and Equipment Data */}
            <section>
              <h2 className="text-lg font-bold border-b pb-2 mb-4">{sectionCounter++}. DADOS DO CLIENTE E EQUIPAMENTO</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="font-semibold text-gray-600">CLIENTE:</span> {client.name}</div>
                <div><span className="font-semibold text-gray-600">EQUIPAMENTO:</span> {equipment.name}</div>
                <div><span className="font-semibold text-gray-600">TAG:</span> {equipment.tag}</div>
                <div><span className="font-semibold text-gray-600">SETOR:</span> {equipment.sector}</div>
                 <div><span className="font-semibold text-gray-600">INSPETOR:</span> {inspection.inspectorName}</div>
              </div>
            </section>
            
            {/* Section 2: Inspection Results */}
            <section>
              <h2 className="text-lg font-bold border-b pb-2 mb-4">{sectionCounter++}. RESULTADOS DA INSPEÇÃO</h2>

              {nonConformingItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-red-600 mb-2">ITENS NÃO CONFORMES (REQUEREM AÇÃO)</h3>
                  <table className="w-full text-sm border-collapse">
                     <thead>
                        <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Item</th>
                            <th className="text-left p-2 font-semibold">Observação</th>
                        </tr>
                     </thead>
                     <tbody>
                        {nonConformingItems.map((item, index) => (
                            <tr key={`nc-${index}`} className="border-b">
                                <td className="p-2 align-top">{item.questionText}</td>
                                <td className="p-2 align-top text-gray-700">{item.observation || 'Nenhuma'}</td>
                            </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
              )}

              {conformingItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-green-600 mb-2">ITENS CONFORMES</h3>
                   <table className="w-full text-sm border-collapse">
                     <thead>
                        <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Item</th>
                            <th className="text-left p-2 font-semibold">Observação</th>
                        </tr>
                     </thead>
                     <tbody>
                        {conformingItems.map((item, index) => (
                            <tr key={`c-${index}`} className="border-b">
                                <td className="p-2 align-top">{item.questionText}</td>
                                <td className="p-2 align-top text-gray-700">{item.observation || 'Nenhuma'}</td>
                            </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
              )}

              {naItems.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-600 mb-2">ITENS NÃO APLICÁVEIS (N/A)</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {naItems.map((item, index) => (
                        <li key={`na-${index}`}>{item.questionText}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

             {/* Section 3: Photographic Registry */}
            {itemsWithPhotos.length > 0 && (
                <section className="report-section-break">
                    <h2 className="text-lg font-bold border-b pb-2 mb-4">{sectionCounter++}. REGISTRO FOTOGRÁFICO</h2>
                    <div className="space-y-6">
                        {itemsWithPhotos.map((item, index) => (
                            <div key={`photo-${index}`}>
                                <h4 className="font-semibold text-sm mb-2">{item.questionText} <span className="text-gray-500 font-normal">- {item.answer}</span></h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {item.photoUrls?.map((url, pIndex) => (
                                        <div key={pIndex} className="border p-1 rounded-md bg-gray-100">
                                            <Image src={url} alt={`Foto para ${item.questionText}`} width={400} height={300} className="w-full h-auto object-contain rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}


            {/* Section 4: Conclusion */}
            <section className="report-section-break">
                <h2 className="text-lg font-bold border-b pb-2 mb-4">{sectionCounter++}. OBSERVAÇÕES E CONCLUSÃO</h2>
                <div 
                    className="prose prose-sm max-w-none mt-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md print:bg-transparent print:border-none print:p-0"
                >
                  <h4>Recomendações</h4>
                  <p>Com base nos itens listados como "Não Conformes", recomenda-se o planejamento de manutenção corretiva para os pontos críticos identificados.</p>
                  
                  <h4>Observações Finais</h4>
                  <p>[Clique aqui para adicionar suas observações finais, parecer técnico ou recomendações adicionais.]</p>
              </div>
            </section>
          </main>
          
          {/* Footer with Signature */}
          <footer className="mt-16 text-center report-footer">
            {inspection.signatureUrl && (
                <div className="inline-block">
                    <Image
                    src={inspection.signatureUrl}
                    alt="Assinatura do Inspetor"
                    width={250}
                    height={125}
                    className="mx-auto"
                    />
                    <div className="border-t-2 border-gray-400 mt-2 pt-2">
                        <p className="font-semibold">{inspection.inspectorName}</p>
                        <p className="text-sm text-gray-500">Inspetor Responsável</p>
                    </div>
                </div>
            )}
          </footer>
        </div>
      </CardContent>
    </Card>
  );
}
