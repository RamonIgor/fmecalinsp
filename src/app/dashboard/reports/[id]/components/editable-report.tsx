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

interface EditableReportProps {
  inspection: Inspection;
  workOrder: WorkOrder;
  equipment: Equipment;
  client: Client;
}

function generateReportMarkdown(
  inspection: Inspection,
  workOrder: WorkOrder,
  equipment: Equipment,
  client: Client
): string {
  const inspectionDate = new Date(inspection.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const scheduledDate = workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

  let report = `
# RELATÓRIO DE INSPEÇÃO DE SEGURANÇA

**Número da OS:** ${workOrder.displayId || 'N/A'}
**Data da Inspeção:** ${inspectionDate}

---

## 1. DADOS DO CLIENTE E EQUIPAMENTO

| Cliente | Equipamento | TAG | Setor |
|---|---|---|---|
| ${client.name} | ${equipment.name} | ${equipment.tag} | ${equipment.sector} |

---

## 2. RESULTADOS DA INSPEÇÃO

Abaixo estão os resultados detalhados da inspeção realizada por **${inspection.inspectorName}**.

`;

  const itemsByConformity = inspection.items.reduce((acc, item) => {
    (acc[item.answer] = acc[item.answer] || []).push(item);
    return acc;
  }, {} as Record<string, typeof inspection.items>);

  if (itemsByConformity['Não Conforme']?.length > 0) {
    report += `
### ITENS NÃO CONFORMES (REQUEREM AÇÃO)

| Item | Observação |
|---|---|
`;
    itemsByConformity['Não Conforme'].forEach(item => {
      report += `| ${item.questionText} | ${item.observation || 'Nenhuma'} |\n`;
    });
  }

  if (itemsByConformity['Conforme']?.length > 0) {
    report += `
### ITENS CONFORMES

| Item | Observação |
|---|---|
`;
    itemsByConformity['Conforme'].forEach(item => {
      report += `| ${item.questionText} | ${item.observation || 'Nenhuma'} |\n`;
    });
  }
  
    if (itemsByConformity['NA']?.length > 0) {
    report += `
### ITENS NÃO APLICÁVEIS

| Item |
|---|
`;
    itemsByConformity['NA'].forEach(item => {
      report += `| ${item.questionText} |\n`;
    });
  }

  report += `
---

## 3. OBSERVAÇÕES GERAIS

[Insira aqui quaisquer observações ou recomendações gerais sobre a inspeção.]

---

## 4. CONCLUSÃO

A inspeção foi concluída na data supracitada, e as seguintes ações são recomendadas:
- Para itens **Não Conformes**: Planejar manutenção corretiva imediata.
- Para itens **Conformes**: Manter plano de manutenção preventiva.

A F.Mecal Insp. agradece a confiança e se coloca à disposição para quaisquer esclarecimentos.

---

**Assinado por:**

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
          <header className="flex items-center justify-between mb-8">
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
          
          <footer className="mt-12 text-center">
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
