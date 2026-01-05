import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { equipments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Equipment } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function getStatusVariant(status: Equipment['status']) {
  switch (status) {
    case 'Operational':
      return 'default';
    case 'Requires Attention':
      return 'secondary';
    case 'Out of Service':
      return 'destructive';
    default:
      return 'outline';
  }
}

const placeholderImages = PlaceHolderImages.filter(p => p.id.startsWith('equipment-placeholder'));

export default function InspectorAppPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search equipment by TAG or name..." className="pl-10 h-12 text-lg" />
      </div>

      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold">Select Equipment</h2>
        {equipments.map((equipment, index) => {
          const image = placeholderImages[index % placeholderImages.length];
          return (
            <Link href={`/app/inspection/${equipment.id}`} key={equipment.id}>
              <Card className="hover:bg-secondary/50 transition-colors flex overflow-hidden">
                <div className="w-1/3 relative">
                    {image && (
                        <Image 
                            src={image.imageUrl}
                            alt={equipment.name}
                            width={200}
                            height={133}
                            className="object-cover h-full w-full"
                            data-ai-hint={image.imageHint}
                        />
                    )}
                </div>
                <div className="flex-1">
                  <CardHeader className="p-3">
                    <CardTitle className="text-base font-bold">{equipment.tag}</CardTitle>
                    <p className="text-sm text-muted-foreground">{equipment.name}</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Badge variant={getStatusVariant(equipment.status)}>{equipment.status}</Badge>
                  </CardContent>
                </div>
                <div className="flex items-center justify-center px-3">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
