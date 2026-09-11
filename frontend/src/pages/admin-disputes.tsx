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
import { useTranslation } from 'react-i18next';

export const AdminDisputesPage: React.FC = () => {
  const { t } = useTranslation();
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
      setError(err.response?.data?.message || t('common.somethingWentWrong'));
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
          <AlertTitle>{t('admin.disputes.accessDeniedTitle')}</AlertTitle>
          <AlertDescription>{t('admin.disputes.accessDeniedDesc')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('admin.disputes.managementTitle')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.disputes.filterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('admin.disputes.filterAll')}</SelectItem>
              <SelectItem value="OPEN">{t('admin.disputes.filterOpen')}</SelectItem>
              <SelectItem value="UNDER_REVIEW">{t('admin.disputes.filterUnderReview')}</SelectItem>
              <SelectItem value="ACTION_REQUIRED">{t('admin.disputes.filterActionRequired')}</SelectItem>
              <SelectItem value="RESOLVED">{t('admin.disputes.filterResolved')}</SelectItem>
              <SelectItem value="DISMISSED">{t('admin.disputes.filterDismissed')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchDisputes} disabled={loading} aria-label={t('common.refresh')}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedDispute ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
            {t('admin.disputes.backToList')}
          </Button>
          <AdminDisputeControls dispute={selectedDispute} onUpdated={fetchDisputes} />
        </div>
      ) : (
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
          {loading && disputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" /> {t('admin.disputes.loading')}
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('admin.disputes.noDisputesFound')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="p-3">{t('admin.disputes.tableId')}</th>
                    <th className="p-3">{t('admin.disputes.tableJobId')}</th>
                    <th className="p-3">{t('admin.disputes.tableRaisedBy')}</th>
                    <th className="p-3">{t('admin.disputes.tableAgainstUser')}</th>
                    <th className="p-3">{t('admin.disputes.tableReason')}</th>
                    <th className="p-3">{t('admin.disputes.tableStatus')}</th>
                    <th className="p-3">{t('admin.disputes.tableCreated')}</th>
                    <th className="p-3 text-right">{t('admin.disputes.tableAction')}</th>
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
                          <Eye className="h-3.5 w-3.5 mr-1" /> {t('admin.disputes.viewAndManage')}
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

