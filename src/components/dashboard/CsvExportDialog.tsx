import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table2 } from 'lucide-react';
import { getSurahName } from '@/lib/progressInsights';

export interface CsvFilters {
  /** Days back from now; 0 = all time. */
  periodDays: number;
  /** Surah number, or 0 for all surahs. */
  surahNumber: number;
  /** Severity value, or 'all'. */
  severity: string;
  /** Resolution status filter. */
  status: 'all' | 'pending' | 'resolved';
}

export const defaultCsvFilters: CsvFilters = {
  periodDays: 0,
  surahNumber: 0,
  severity: 'all',
  status: 'all',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Surah numbers present in the user's corrections. */
  availableSurahs: number[];
  /** Severity values present in the user's corrections. */
  availableSeverities: string[];
  /** Number of rows that would be exported with the current filters. */
  matchCount: number;
  filters: CsvFilters;
  onFiltersChange: (filters: CsvFilters) => void;
  onExport: () => void;
}

const PERIODS: { value: number; label: string }[] = [
  { value: 0, label: 'Tout l’historique' },
  { value: 7, label: '7 derniers jours' },
  { value: 30, label: '30 derniers jours' },
  { value: 90, label: '3 derniers mois' },
  { value: 365, label: '12 derniers mois' },
];

const severityLabels: Record<string, string> = {
  critical: 'Critique',
  major: 'Majeure',
  minor: 'Mineure',
};

/** Filter dialog for the dashboard corrections CSV export (period, surah, severity). */
export const CsvExportDialog = ({
  open,
  onOpenChange,
  availableSurahs,
  availableSeverities,
  matchCount,
  filters,
  onFiltersChange,
  onExport,
}: Props) => {
  const surahOptions = useMemo(
    () => [...availableSurahs].sort((a, b) => a - b),
    [availableSurahs],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter mes corrections (CSV)</DialogTitle>
          <DialogDescription>
            Choisissez la période, la sourate et la gravité à inclure dans le fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Période</Label>
            <Select
              value={String(filters.periodDays)}
              onValueChange={(v) => onFiltersChange({ ...filters, periodDays: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sourate</Label>
            <Select
              value={String(filters.surahNumber)}
              onValueChange={(v) => onFiltersChange({ ...filters, surahNumber: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="0">Toutes les sourates</SelectItem>
                {surahOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}. {getSurahName(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Gravité</Label>
            <Select
              value={filters.severity}
              onValueChange={(v) => onFiltersChange({ ...filters, severity: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les gravités</SelectItem>
                {availableSeverities.map((s) => (
                  <SelectItem key={s} value={s}>{severityLabels[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFiltersChange({ ...filters, status: v as CsvFilters['status'] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="pending">À corriger</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {matchCount} correction{matchCount > 1 ? 's' : ''} correspond
            {matchCount > 1 ? 'ent' : ''} à ces filtres.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onFiltersChange(defaultCsvFilters)}>
            Réinitialiser
          </Button>
          <Button onClick={onExport} disabled={matchCount === 0}>
            <Table2 className="h-4 w-4 mr-1.5" /> Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};