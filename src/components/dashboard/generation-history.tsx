import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileCode2, Puzzle, History } from 'lucide-react'
import type { DbGeneration } from '@/lib/types/database'

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function truncate(str: string | null, maxLen = 60) {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

export function GenerationHistoryTable({ generations }: { generations: DbGeneration[] }) {
  return (
    <Card className="glass-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          Storico Generazioni
        </CardTitle>
        <CardDescription>Le ultime generazioni AI del tuo account.</CardDescription>
      </CardHeader>
      <CardContent>
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nessuna generazione ancora.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Usa il Plugin o Config Generator per iniziare!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium w-24">Tipo</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Prompt</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium w-20 text-right">Crediti</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium w-36 text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generations.map((gen) => (
                  <TableRow key={gen.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          gen.type === 'plugin'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary text-muted-foreground'
                        }
                      >
                        {gen.type === 'plugin' ? (
                          <Puzzle className="mr-1 h-3 w-3 inline" />
                        ) : (
                          <FileCode2 className="mr-1 h-3 w-3 inline" />
                        )}
                        {gen.type === 'plugin' ? 'Plugin' : 'Config'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {truncate(gen.prompt)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      <span className="text-primary">-{gen.credits_used}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(gen.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
