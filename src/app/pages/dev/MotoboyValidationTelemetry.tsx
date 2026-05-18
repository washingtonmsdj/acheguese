import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

import type {
  RideAuditEntry,
  ValidationLog,
  VerificationEntry,
} from './motoboyValidation.runtime';

type MotoboyValidationTelemetryProps = {
  selectedRideId: string | null;
  auditEntries: RideAuditEntry[];
  verificationEntries: VerificationEntry[];
  logs: ValidationLog[];
  onSelectedRideIdChange: (next: string | null) => void;
  onRefreshSelectedRideLogs: () => void | Promise<void>;
};

export function MotoboyValidationTelemetry({
  selectedRideId,
  auditEntries,
  verificationEntries,
  logs,
  onSelectedRideIdChange,
  onRefreshSelectedRideLogs,
}: MotoboyValidationTelemetryProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ride Audit And Verification</CardTitle>
          <CardDescription>
            {selectedRideId ? `Selected ride: ${selectedRideId}` : 'Select a ride to inspect operational audit.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={selectedRideId ?? ''}
              onChange={(event) => onSelectedRideIdChange(event.target.value || null)}
              placeholder="Ride ID for audit inspection"
            />
            <Button variant="outline" onClick={() => void onRefreshSelectedRideLogs()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">State Audit ({auditEntries.length})</h4>
            {auditEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit entries loaded.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {entry.fromState || 'null'} -&gt; {entry.toState || 'null'}
                      </span>
                      <span className="text-muted-foreground">
                        {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : 'no timestamp'}
                      </span>
                    </div>
                    {entry.reason && <p className="text-muted-foreground">{entry.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Operational Verification ({verificationEntries.length})</h4>
            {verificationEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No verification rows loaded for this ride.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {verificationEntries.map((entry) => (
                  <div key={entry.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">status: {entry.status}</span>
                      <span className="text-muted-foreground">attempts: {entry.attempts}</span>
                    </div>
                    <p className="text-muted-foreground">
                      required: {String(entry.isRequired)} | created: {entry.createdAt || '-'} | expires: {entry.expiresAt || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="flex items-start gap-2 border-l-2 border-l-muted p-2">
                  {log.status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />}
                  {log.status === 'error' && <XCircle className="mt-0.5 h-4 w-4 text-red-600" />}
                  {log.status === 'info' && <AlertTriangle className="mt-0.5 h-4 w-4 text-blue-600" />}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
