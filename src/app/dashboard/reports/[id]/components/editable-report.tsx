'use client';

import React, { useState, useEffect } from 'react';
import {
  type Inspection,
  type WorkOrder,
  type Equipment,
  type Client,
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Logo from '@/components/logo';

function generateReportMarkdown(
  inspection: Inspection,
  workOrder: WorkOrder,
  equipment: Equipment,
  client: Client
): string {
  const inspectionDate = new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  
  const title = "RELATÓRIO TÉCNICO DE INSPEÇÃO DE SEGURANÇA";
  const separator = "=".repeat(70);

  let report = `
${separator}
${title.padStart(Math.floor((70 + title.length) / 2))}
${separator}

NÚMERO DA OS: ${workOrder.displayId || 'N/A'}
DATA DA INSPEÇÃO: ${inspectionDate}
INSPETOR RESPONSÁVEL: ${inspection.inspectorName}

----------------------------------------------------------------------
1. DADOS DO CLIENTE E EQUIPAMENTO
----------------------------------------------------------------------

    CLIENTE:     ${client.name}
    EQUIPAMENTO: ${equipment.name}
    TAG:         ${equipment.tag}
    SETOR:       ${equipment.sector}

----------------------------------------------------------------------
2. RESULTADOS DA INSPEÇÃO
----------------------------------------------------------------------
`;

  const itemsByConformity = inspection.items.reduce((acc, item) => {
    (acc[item.answer] = acc[item.answer] || []).push(item);
    return acc;
  }, {} as Record<string, typeof inspection.items>);

  if (itemsByConformity['Não Conforme']?.length > 0) {
    report += `
ITENS NÃO CONFORMES (REQUEREM AÇÃO)
-----------------------------------
`;
    itemsByConformity['Não Conforme'].forEach(item => {
      report += `
    ITEM:        ${item.questionText.replace(/:/g, ' -')}
    OBSERVAÇÃO:  ${item.observation || 'Nenhuma'}
    
`;
    });
  }

  if (itemsByConformity['Conforme']?.length > 0) {
    report += `
ITENS CONFORMES
---------------
`;
    itemsByConformity['Conforme'].forEach(item => {
      report += `
    ITEM:        ${item.questionText.replace(/:/g, ' -')}
    OBSERVAÇÃO:  ${item.observation || 'Nenhuma'}

`;
    });
  }
  
    if (itemsByConformity['NA']?.length > 0) {
    report += `
ITENS NÃO APLICÁVEIS
--------------------
`;
    itemsByConformity['NA'].forEach(item => {
      report += `
    ITEM:        ${item.questionText.replace(/:/g, ' -')}

`;
    });
  }

  report += `
----------------------------------------------------------------------
3. OBSERVAÇÕES GERAIS
----------------------------------------------------------------------

[Insira aqui quaisquer observações ou recomendações gerais sobre a inspeção.]

----------------------------------------------------------------------
4. CONCLUSÃO
----------------------------------------------------------------------

A inspeção foi concluída na data supracitada. Com base nos resultados, as seguintes ações são recomendadas:
- Para os itens listados como "Não Conformes", recomenda-se o planejamento de manutenção corretiva com a maior brevidade possível a fim de garantir a segurança e a operacionalidade do equipamento.
- Para os itens listados como "Conformes", recomenda-se a continuidade do plano de manutenção preventiva existente.

A F.Mecal Insp. agradece a confiança e se coloca à disposição para quaisquer esclarecimentos.


`;
  
  return report.trim();
}


export function EditableReport({ inspection, workOrder, equipment, client }: EditableReportProps) {
  const [reportContent, setReportContent] = useState('');

  useEffect(() => {
    const initialContent = generateReportMarkdown(inspection, workOrder, equipment, client);
    setReportContent(initialContent);
  }, [inspection, workOrder, equipment, client]);

  return (
    <Card className="report-card">
      <CardContent className="p-0">
        <div className="p-8 md:p-12 print-content">
          <header className="flex items-center justify-between mb-8 report-header">
            <div className="flex items-center gap-4">
              <Logo className="h-16 w-16" />
              <div>
                <h1 className="text-3xl font-bold">F.Mecal Insp.</h1>
                <p className="text-muted-foreground">Relatório Técnico de Inspeção</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">OS: ${workOrder.displayId}</p>
              <p className="text-sm text-muted-foreground">Data: ${new Date(inspection.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </header>
          
          <Textarea
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            className="w-full h-[80vh] min-h-[600px] p-4 border rounded-md font-mono text-sm leading-relaxed report-textarea"
            placeholder="Edite seu relatório aqui..."
          />
          
          <footer className="mt-12 text-center report-footer">
            {inspection.signatureUrl && (
                <div className="inline-block">
                    <Image
                    src={inspection.signatureUrl}
                    alt="Assinatura do Inspetor"
                    width={250}
                    height={125}
                    className="mx-auto"
                    />
                    <div className="border-t mt-2 pt-2">
                        <p className="font-semibold">{inspection.inspectorName}</p>
                        <p className="text-sm text-muted-foreground">Inspetor Responsável</p>
                    </div>
                </div>
            )}
          </footer>
        </div>
      </CardContent>
    </Card>
  );
}
