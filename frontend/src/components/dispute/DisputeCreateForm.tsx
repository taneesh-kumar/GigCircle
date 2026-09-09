import React, { useState } from 'react';
import { createDisputeApi } from '@/services/api/dispute';
import type { DisputeReason, DisputeDetailResponse } from '@/types/dispute';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DisputeCreateFormProps {
  jobId: number;
  onSuccess: (dispute: DisputeDetailResponse) => void;
  onCancel?: () => void;
}

export const DisputeCreateForm: React.FC<DisputeCreateFormProps> = ({ jobId, onSuccess, onCancel }) => {
  const [reason, setReason] = useState<DisputeReason>('QUALITY_ISSUE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description cannot be blank');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createDisputeApi({
        jobId,
        reason,
        description: description.trim(),
      });
      onSuccess(result);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('An active dispute already exists for this job.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid dispute request (e.g. job has no assigned worker).');
      } else if (err.response?.status === 403) {
        setError('Access denied: Only the customer or assigned worker can raise a dispute.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit dispute');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 border-b pb-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-lg">Raise Dispute for Job #{jobId}</h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Dispute Reason</label>
        <Select value={reason} onValueChange={(val) => setReason(val as DisputeReason)}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="QUALITY_ISSUE">Quality of Service Issue</SelectItem>
            <SelectItem value="NON_DELIVERY">Worker Did Not Show Up / Non-Delivery</SelectItem>
            <SelectItem value="PAYMENT_ISSUE">Payment / Price Dispute</SelectItem>
            <SelectItem value="COMMUNICATION_ISSUE">Unresponsive / Communication Issue</SelectItem>
            <SelectItem value="SAFETY_VIOLATION">Safety or Misbehavior Violation</SelectItem>
            <SelectItem value="OTHER">Other Reason</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Provide detailed explanation of the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!description.trim() || loading} variant="destructive">
          {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
          Submit Dispute
        </Button>
      </div>
    </form>
  );
};
