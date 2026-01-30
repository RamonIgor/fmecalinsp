"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePdfReport } from "@/ai/flows/generate-pdf-report";
import type { Inspection } from "@/lib/data";

export function ReportGenerator({ inspection }: { inspection: Inspection }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const inspectionData = JSON.stringify(inspection, null, 2);
      // In a real app, photos would be data URIs from storage.
      const photos = inspection.items
        .flatMap(item => item.photoUrls || [])
        .filter((url): url is string => !!url);

      const result = await generatePdfReport({ inspectionData, photos });

      if (result.pdfReport) {
        // Decode base64 and trigger download
        const byteCharacters = atob(result.pdfReport);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Relatorio_Inspecao_${inspection.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Relatório Gerado",
          description: "Seu relatório em PDF foi baixado.",
        });

      } else {
         throw new Error("Falha ao gerar o relatório em PDF a partir da IA.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Relatório",
        description: "Não foi possível gerar o relatório em PDF. Por favor, tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerateReport} disabled={loading} variant="outline" size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      Gerar Relatório
    </Button>
  );
}
