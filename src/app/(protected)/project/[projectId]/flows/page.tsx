import { Pencil, Save, Trash2, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const singularContributions = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  identification: "Contribuição Industrial --",
  type: "Industrial",
  segment: "T-12",
  initialValue: "2.5 L/s",
  finalValue: "3.2 L/s",
  status: "válido",
}));

export default function FlowsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-9">
      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Contribuições Singulares
          </CardTitle>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Vazões concentradas e contribuições específicas que afetam a rede. A
            vazão total de cada trecho será composta pelas contribuições difusas
            mais as concentradas.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <Input
            type="search"
            placeholder="Buscar por identificação, tipo, nó..."
            className="h-10 max-w-md bg-background"
          />

          <div className="overflow-hidden rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Identificação
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Tipo
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Nó/Trecho
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Valor Inicial
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Valor Final
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-12 w-24 px-4">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {singularContributions.map((contribution) => (
                  <TableRow
                    key={contribution.id}
                    className="h-16 hover:bg-muted/20"
                  >
                    <TableCell className="px-4 font-medium text-foreground">
                      {contribution.identification}
                    </TableCell>
                    <TableCell className="px-4 text-foreground">
                      {contribution.type}
                    </TableCell>
                    <TableCell className="px-4 text-foreground">
                      {contribution.segment}
                    </TableCell>
                    <TableCell className="px-4 text-foreground">
                      {contribution.initialValue}
                    </TableCell>
                    <TableCell className="px-4 text-foreground">
                      {contribution.finalValue}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className="rounded-full border-teal-300 bg-teal-50 px-2.5 text-xs font-semibold text-teal-600"
                      >
                        {contribution.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar contribuição"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Excluir contribuição"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">5 de 24 nós</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled>
                Anterior
              </Button>
              <Button type="button" variant="outline" disabled>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 flex-1 select-none items-center justify-center gap-2 rounded-lg border border-[#818cf8]/35 bg-[#818cf8] px-4 text-sm font-semibold text-white">
          <Save className="size-4 shrink-0" />
          Nenhuma alteração foi feita ainda.
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex h-12 items-center justify-center gap-2 rounded-lg px-8 font-semibold"
        >
          <Undo2 className="size-4" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
