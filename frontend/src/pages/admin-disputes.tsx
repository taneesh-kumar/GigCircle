import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { DisputeDetailResponse, DisputeStatus } from '@/types/dispute';
import { getAllDisputesAdminApi } from '@/services/api/dispute';
import { DisputeStatusBadge } from '@/components/dispute/DisputeStatusBadge';
import { AdminDisputeControls } from '@/components/dispute/AdminDisputeControls';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Eye, RefreshCw, ShieldAlert, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AdminDisputesPage: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<DisputeDetailResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = statusFilter !== 'ALL' ? (statusFilter as DisputeStatus) : undefined;
      const res = await getAllDisputesAdminApi(filter);
      const list = Array.isArray(res) ? res : res.content;
      setDisputes(list);

      if (selectedDispute) {
        const updated = list.find((d: DisputeDetailResponse) => d.id === selectedDispute.id);
        if (updated) setSelectedDispute(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load disputes for admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Only administrative users may access the admin disputes dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dispute Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ACTION_REQUIRED">Action Required</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchDisputes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedDispute ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
            ← Back to All Disputes
          </Button>
          <AdminDisputeControls dispute={selectedDispute} onUpdated={fetchDisputes} />
        </div>
      ) : (
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
          {loading && disputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" /> Loading disputes...
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No disputes found matching filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Raised By</th>
                    <th className="p-3">Against User</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold">#{d.id}</td>
                      <td className="p-3">Job #{d.jobId}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{d.raisedBy.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{d.againstUser.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{d.reason.replace(/_/g, ' ')}</td>
                      <td className="p-3">
                        <DisputeStatusBadge status={d.status} />
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedDispute(d)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View & Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
