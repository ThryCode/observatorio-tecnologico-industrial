import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Users, Lightbulb } from 'lucide-react';

export default function GraphAnalytics() {
  const [nodeId, setNodeId] = useState('');
  const [k, setK] = useState(5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analíticas del Grafo</h2>
        <p className="text-muted-foreground">PageRank, detección de comunidades y kNN</p>
      </div>

      <Tabs defaultValue="pagerank">
        <TabsList>
          <TabsTrigger value="pagerank" className="gap-2"><Network className="h-4 w-4" />PageRank</TabsTrigger>
          <TabsTrigger value="community" className="gap-2"><Users className="h-4 w-4" />Comunidades</TabsTrigger>
          <TabsTrigger value="knn" className="gap-2"><Lightbulb className="h-4 w-4" />kNN</TabsTrigger>
        </TabsList>

        <TabsContent value="pagerank">
          <Card>
            <CardHeader><CardTitle>PageRank - Importancia de Nodos</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Calcula la importancia relativa de cada nodo en el grafo de conocimiento.
              </p>
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Conecte Neo4j para ejecutar PageRank</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community">
          <Card>
            <CardHeader><CardTitle>Detección de Comunidades</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Identifica clusters de nodos fuertemente conectados.
              </p>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Conecte Neo4j para detectar comunidades</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knn">
          <Card>
            <CardHeader><CardTitle>k-Nearest Neighbors</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Encuentra los nodos más similares a uno dado.
              </p>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="ID del nodo"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="k"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value) || 5)}
                  className="w-24"
                />
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingrese un ID de nodo y conecte Neo4j</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
