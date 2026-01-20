import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type AudioDebugStats = {
  mimeType: string | null;
  chunks: number;
  totalBytes: number;
  blobSize: number | null;
  durationMs: number | null;
  base64Length: number | null;
  trackLabel?: string | null;
  trackSettings?: Record<string, unknown> | null;
  error?: string | null;
};

export const AudioDebugPanel: React.FC<{ stats: AudioDebugStats }> = ({ stats }) => {
  if (!import.meta.env.DEV) return null;

  const durationSec = typeof stats.durationMs === 'number' ? (stats.durationMs / 1000).toFixed(2) : '—';
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <Card className="border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Audio</CardTitle>
          <Badge variant="outline" className="text-xs">
            DEV
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="font-medium text-foreground">mimeType</div>
            <div className="break-all">{stats.mimeType ?? '—'}</div>
          </div>
          <div>
            <div className="font-medium text-foreground">durée</div>
            <div>{durationSec}s</div>
          </div>
          <div>
            <div className="font-medium text-foreground">chunks</div>
            <div>{stats.chunks}</div>
          </div>
          <div>
            <div className="font-medium text-foreground">taille</div>
            <div>
              {typeof stats.blobSize === 'number' ? kb(stats.blobSize) : '—'}
              {stats.totalBytes ? ` (chunks: ${kb(stats.totalBytes)})` : ''}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">base64</div>
            <div>{stats.base64Length ? `${stats.base64Length} chars` : '—'}</div>
          </div>
          <div>
            <div className="font-medium text-foreground">micro</div>
            <div className="break-all">{stats.trackLabel ?? '—'}</div>
          </div>
        </div>

        {stats.error && (
          <div className="p-2 rounded-md bg-destructive/10 text-destructive">
            {stats.error}
          </div>
        )}

        {stats.trackSettings && (
          <details className="rounded-md bg-muted p-2">
            <summary className="cursor-pointer text-foreground">track settings</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(stats.trackSettings, null, 2)}</pre>
          </details>
        )}

        <details className="rounded-md bg-muted p-2">
          <summary className="cursor-pointer text-foreground">userAgent</summary>
          <div className="mt-2 break-all">{navigator.userAgent}</div>
        </details>
      </CardContent>
    </Card>
  );
};
