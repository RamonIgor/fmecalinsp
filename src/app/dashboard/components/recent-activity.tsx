"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HardHat } from "lucide-react";
import { equipments, inspections } from "@/lib/data";

export function RecentActivity() {
    return (
        <Card>
           <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas inspeções finalizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspections.slice(0,3).map((inspection) => (
                <div key={inspection.id} className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <HardHat className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {equipments.find(e => e.id === inspection.equipmentId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Inspecionado por {inspection.inspectorName}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(inspection.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    )
}
