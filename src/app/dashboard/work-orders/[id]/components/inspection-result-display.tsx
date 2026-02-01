"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Inspection } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, CircleSlash, FileSignature, Camera } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const AnswerIcon = ({ answer }: { answer: string }) => {
  switch (answer) {
    case "Conforme":
      return <CheckCircle2 className="h-5 w-5 text-white fill-green-500" />;
    case "Não Conforme":
      return <XCircle className="h-5 w-5 text-white" />;
    case "NA":
      return <CircleSlash className="h-5 w-5 text-white" />;
    default:
      return null;
  }
};

export function InspectionResultDisplay({ inspection }: { inspection: Inspection }) {
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => { setClientReady(true); }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados da Inspeção</CardTitle>
        <CardDescription>
          Relatório preenchido por {inspection.inspectorName} em{" "}
          {clientReady ? new Date(inspection.date).toLocaleString("pt-BR") : "..."}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4 text-lg">Itens Verificados</h3>
          <div className="space-y-4">
            {inspection.items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.questionText}</p>
                    <Badge variant={item.answer === 'Conforme' ? 'default' : item.answer === 'Não Conforme' ? 'destructive' : 'secondary'} className="flex items-center gap-2">
                        <AnswerIcon answer={item.answer} />
                        <span>{item.answer}</span>
                    </Badge>
                </div>
                {item.observation && (
                    <p className="text-sm text-muted-foreground pl-2 border-l-2 ml-1">
                        <strong>Obs:</strong> {item.observation}
                    </p>
                )}
                 {item.photoUrls && item.photoUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Camera size={16}/> Fotografia(s) Anexada(s)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {item.photoUrls.map((url, index) => (
                         <div key={index} className="relative aspect-video w-full rounded-md overflow-hidden border">
                           <Image src={url} alt={`Foto ${index + 1} para o item "${item.questionText}"`} fill className="object-cover"/>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {inspection.signatureUrl && (
          <div>
            <h3 className="font-semibold mb-2 text-lg flex items-center gap-2"><FileSignature /> Assinatura do Inspetor</h3>
            <div className="p-4 bg-muted rounded-lg flex justify-center">
              <Image
                src={inspection.signatureUrl}
                alt="Assinatura do Inspetor"
                width={300}
                height={150}
                className="bg-white rounded-md shadow-inner"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
