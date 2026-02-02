"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { offlineDB, savePendingInspection } from "@/lib/offline";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Database } from "lucide-react";

/**
 * PÁGINA DE TESTE - Cole em /app/test-offline/page.tsx
 */
export default function TestOfflinePage() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, message]);
    toast({
      description: message,
      duration: 3000,
    });
  };

  const testIndexedDB = async () => {
    setTestResults([]);
    
    try {
      // Teste 1: IndexedDB disponível?
      if (!window.indexedDB) {
        addResult("❌ IndexedDB NÃO está disponível neste navegador!");
        setIsSupported(false);
        return;
      }
      addResult("✅ IndexedDB está disponível");
      setIsSupported(true);

      // Teste 2: Abrir o banco
      try {
        await offlineDB.open();
        addResult("✅ Banco de dados aberto com sucesso");
      } catch (err: any) {
        addResult(`❌ Erro ao abrir banco: ${err.message}`);
        return;
      }

      // Teste 3: Salvar dados de teste
      const testInspection = {
        workOrderId: "TEST-WO-123",
        equipmentId: "TEST-EQUIP-456",
        inspectorId: "TEST-INSPECTOR-789",
        inspectorName: "Teste Inspector",
        date: new Date().toISOString(),
        items: [
          {
            questionId: "q1",
            questionText: "Teste Pergunta 1",
            answer: "Conforme",
            observation: "Teste de observação",
          }
        ],
        signatureUrl: null,
      };

      try {
        const result = await savePendingInspection(testInspection);
        addResult(`✅ Inspeção teste salva! LocalId: ${result.localId}`);
      } catch (err: any) {
        addResult(`❌ Erro ao salvar: ${err.message}`);
        return;
      }

      // Teste 4: Ler dados salvos
      try {
        const allPending = await offlineDB.pendingInspections.toArray();
        addResult(`✅ Total de inspeções pendentes: ${allPending.length}`);
        
        if (allPending.length > 0) {
          const last = allPending[allPending.length - 1];
          addResult(`✅ Última inspeção: WO ${last.workOrderId}`);
        }
      } catch (err: any) {
        addResult(`❌ Erro ao ler dados: ${err.message}`);
        return;
      }

      // Teste 5: Deletar dados de teste
      try {
        const allPending = await offlineDB.pendingInspections.toArray();
        const testItem = allPending.find(i => i.workOrderId === "TEST-WO-123");
        
        if (testItem && testItem.localId) {
          await offlineDB.pendingInspections.delete(testItem.localId);
          addResult(`✅ Dados de teste removidos com sucesso`);
        }
      } catch (err: any) {
        addResult(`❌ Erro ao deletar: ${err.message}`);
      }

      addResult("🎉 TODOS OS TESTES PASSARAM!");

    } catch (error: any) {
      addResult(`❌ ERRO GERAL: ${error.message}`);
      console.error("Erro no teste:", error);
    }
  };

  const clearAllPending = async () => {
    try {
      const count = await offlineDB.pendingInspections.count();
      await offlineDB.pendingInspections.clear();
      addResult(`✅ ${count} inspeções pendentes foram removidas`);
    } catch (err: any) {
      addResult(`❌ Erro ao limpar: ${err.message}`);
    }
  };

  const showPendingCount = async () => {
    try {
      const count = await offlineDB.pendingInspections.count();
      const all = await offlineDB.pendingInspections.toArray();
      
      addResult(`📊 Total pendente: ${count}`);
      
      if (all.length > 0) {
        all.forEach((inspection, index) => {
          addResult(`${index + 1}. WO: ${inspection.workOrderId}, Items: ${inspection.items?.length || 0}`);
        });
      }
    } catch (err: any) {
      addResult(`❌ Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Teste de IndexedDB - Modo Offline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupported === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>IndexedDB não suportado</AlertTitle>
              <AlertDescription>
                Seu navegador não suporta IndexedDB. O modo offline não funcionará.
              </AlertDescription>
            </Alert>
          )}

          {isSupported === true && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>IndexedDB Suportado</AlertTitle>
              <AlertDescription>
                Seu navegador suporta armazenamento offline!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button onClick={testIndexedDB} className="w-full" size="lg">
              🧪 Executar Teste Completo
            </Button>
            
            <Button onClick={showPendingCount} variant="outline" className="w-full">
              📊 Mostrar Inspeções Pendentes
            </Button>
            
            <Button onClick={clearAllPending} variant="destructive" className="w-full">
              🗑️ Limpar Todas as Pendentes
            </Button>
          </div>

          {testResults.length > 0 && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Resultados dos Testes:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        result.includes('✅') || result.includes('🎉')
                          ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                          : result.includes('❌')
                          ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                          : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>📱 Instruções para Teste no Celular</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Clique em "Executar Teste Completo"</p>
          <p>2. Leia os resultados na tela</p>
          <p>3. Se todos tiverem ✅, o IndexedDB está funcionando</p>
          <p>4. Se aparecer ❌, tire print e me envie</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}