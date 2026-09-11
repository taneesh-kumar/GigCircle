import React, { useState, useEffect, useCallback } from 'react';
import {
  Vote,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  Users,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Filter,
  Check,
  Calendar,
  Lock,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import type {
  ProposalResponse,
  ProposalStatus,
  ProposalCategory,
  VoteType,
} from '@/types/governance';
import {
  getProposalsApi,
  castVoteApi,
  openProposalApi,
  closeProposalApi,
} from '@/services/api/governance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateProposalModal } from './create-proposal-modal';

const CATEGORY_STYLES: Record<ProposalCategory, { bg: string; text: string; label: string }> = {
  GENERAL: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', label: 'General' },
  POLICY: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Policy' },
  PLATFORM_FEE: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Fees & Payout' },
  BENEFITS: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Benefits & Welfare' },
  DISPUTE_RULE: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Dispute Rules' },
};

const STATUS_BADGES: Record<ProposalStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  DRAFT: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    icon: <Clock3 className="h-3 w-3 text-slate-500" />,
    label: 'DRAFT',
  },
  OPEN: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    icon: <Clock3 className="h-3 w-3 text-emerald-600 animate-pulse" />,
    label: 'VOTING OPEN',
  },
  PASSED: {
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    text: 'text-teal-800',
    icon: <CheckCircle2 className="h-3 w-3 text-teal-600" />,
    label: 'PASSED',
  },
  REJECTED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    icon: <XCircle className="h-3 w-3 text-rose-600" />,
    label: 'REJECTED',
  },
  CLOSED: {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    text: 'text-gray-700',
    icon: <Lock className="h-3 w-3 text-gray-500" />,
    label: 'CLOSED',
  },
};

export function CooperativeGovernanceSection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<ProposalCategory | 'ALL'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<ProposalResponse | null>(null);

  // Voting interaction state
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);
  const [selectedVoteChoice, setSelectedVoteChoice] = useState<VoteType>('YES');
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

  // Proposal modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Opening / Closing actions
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getProposalsApi({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        size: 50,
      });

      setProposals(res.content || []);

      // If a proposal was selected, update its reference
      if (selectedProposal) {
        const fresh = res.content.find((p) => p.id === selectedProposal.id);
        if (fresh) setSelectedProposal(fresh);
      }
    } catch (err: any) {
      toast({
        title: 'Error Fetching Proposals',
        description: err?.response?.data?.message || 'Could not load governance proposals.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, selectedProposal, toast]);

  useEffect(() => {
    fetchProposals();
  }, [statusFilter, categoryFilter]);

  const handleCastVote = async (proposalId: number, choice: VoteType) => {
    try {
      setIsSubmittingVote(true);
      const updated = await castVoteApi(proposalId, { voteChoice: choice });

      toast({
        title: 'Vote Cast Successfully',
        description: `Your vote (${choice}) has been recorded securely on the cooperative ledger.`,
      });

      // Update local proposals list
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal(updated);
      }
    } catch (err: any) {
      toast({
        title: 'Voting Failed',
        description: err?.response?.data?.message || 'Unable to record vote.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleOpenVoting = async (proposalId: number) => {
    try {
      setActionLoadingId(proposalId);
      const updated = await openProposalApi(proposalId, { votingDurationDays: 7 });

      toast({
        title: 'Proposal Voting Opened',
        description: 'Eligible cooperative workers have been notified to cast their votes.',
      });

      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal(updated);
      }
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err?.response?.data?.message || 'Failed to open voting.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseVoting = async (proposalId: number) => {
    try {
      setActionLoadingId(proposalId);
      await closeProposalApi(proposalId);

      toast({
        title: 'Voting Concluded',
        description: 'The proposal has been finalized and results computed from persisted votes.',
      });

      fetchProposals();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err?.response?.data?.message || 'Failed to close proposal.',
        variant: 'destructive',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics summary
  const openCount = proposals.filter((p) => p.status === 'OPEN').length;
  const passedCount = proposals.filter((p) => p.status === 'PASSED').length;
  const draftCount = proposals.filter((p) => p.status === 'DRAFT').length;

  const isWorker = user?.role?.toUpperCase() === 'WORKER';
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* COOPERATIVE HERO & SUMMARY STRIP */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-extrabold text-emerald-300">
              <Vote className="h-4 w-4 text-emerald-400" />
              <span>COOPERATIVE WORKER GOVERNANCE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Worker Voice. One Member, One Vote.
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
              Participate directly in platform policy decisions, commission adjustments, equipment subsidies, and cooperative standards. Results are mathematically derived and tamper-proof.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {(isWorker || isAdmin) && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <Plus className="h-4 w-4" /> New Proposal
              </button>
            )}

            <button
              type="button"
              onClick={fetchProposals}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors disabled:opacity-50"
              title="Refresh Proposals"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3 STAT METRICS */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8 pt-6 border-t border-white/10">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Active Voting</span>
            <div className="text-2xl md:text-3xl font-black text-white mt-0.5">{openCount}</div>
            <span className="text-[10px] text-slate-400">Open for worker ballots</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">Passed Motions</span>
            <div className="text-2xl md:text-3xl font-black text-white mt-0.5">{passedCount}</div>
            <span className="text-[10px] text-slate-400">Enacted platform policies</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Formulating</span>
            <div className="text-2xl md:text-3xl font-black text-white mt-0.5">{draftCount}</div>
            <span className="text-[10px] text-slate-400">Drafts pending open</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* STATUS TABS */}
        <div className="flex flex-wrap items-center gap-1">
          {(['ALL', 'OPEN', 'DRAFT', 'PASSED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Motions' : st}
            </button>
          ))}
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="POLICY">Policy</option>
            <option value="PLATFORM_FEE">Fees & Payout</option>
            <option value="BENEFITS">Benefits & Welfare</option>
            <option value="DISPUTE_RULE">Dispute Rules</option>
          </select>
        </div>
      </div>

      {/* PROPOSAL CARDS LIST */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">Loading cooperative governance motions...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Vote className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No proposals match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a new governance proposal or switch filters to view past and draft cooperative decisions.
          </p>
          {(isWorker || isAdmin) && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create First Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {proposals.map((proposal) => {
            const cat = CATEGORY_STYLES[proposal.category] || CATEGORY_STYLES.GENERAL;
            const badge = STATUS_BADGES[proposal.status] || STATUS_BADGES.CLOSED;
            const total = proposal.totalVotes || 0;
            const yesPct = total > 0 ? Math.round((proposal.yesVotes / total) * 100) : 0;
            const noPct = total > 0 ? Math.round((proposal.noVotes / total) * 100) : 0;
            const abstainPct = total > 0 ? Math.round((proposal.abstainVotes / total) * 100) : 0;

            const isCreator = user?.id === proposal.createdById;
            const canManage = isCreator || isAdmin;

            return (
              <div
                key={proposal.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all space-y-5 group"
              >
                <div className="space-y-4">
                  {/* TOP TAGS */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span
                      className={`rounded-xl border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${cat.bg} ${cat.text}`}
                    >
                      {cat.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badge.bg}`}
                    >
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-950 transition-colors leading-snug">
                      {proposal.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {proposal.description}
                    </p>
                  </div>

                  {/* PROPOSAL METADATA */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 pt-1 border-t border-slate-50 font-medium">
                    <span>
                      Proposed by: <strong className="text-slate-800 font-bold">{proposal.createdByName}</strong> ({proposal.createdByRole})
                    </span>
                    {proposal.votingEndsAt && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Ends: {new Date(proposal.votingEndsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* LIVE / FINAL TALLY VISUALIZATION */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {proposal.status === 'OPEN' ? 'Live Ballot Tally' : 'Final Certified Tally'}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{total} Votes Cast</span>
                    </div>

                    {/* MULTI-SEGMENT PROGRESS BAR */}
                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                      <div style={{ width: `${yesPct}%` }} className="bg-emerald-500 h-full transition-all" title={`YES: ${yesPct}%`} />
                      <div style={{ width: `${noPct}%` }} className="bg-rose-500 h-full transition-all" title={`NO: ${noPct}%`} />
                      <div style={{ width: `${abstainPct}%` }} className="bg-amber-400 h-full transition-all" title={`ABSTAIN: ${abstainPct}%`} />
                    </div>

                    {/* VOTE METRICS ROW */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="rounded-xl bg-white border border-slate-200/60 p-2">
                        <span className="text-[10px] font-bold text-emerald-700 block">YES</span>
                        <span className="font-black text-slate-900">{proposal.yesVotes}</span>
                        <span className="text-[10px] text-slate-400 block">({yesPct}%)</span>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200/60 p-2">
                        <span className="text-[10px] font-bold text-rose-700 block">NO</span>
                        <span className="font-black text-slate-900">{proposal.noVotes}</span>
                        <span className="text-[10px] text-slate-400 block">({noPct}%)</span>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200/60 p-2">
                        <span className="text-[10px] font-bold text-amber-700 block">ABSTAIN</span>
                        <span className="font-black text-slate-900">{proposal.abstainVotes}</span>
                        <span className="text-[10px] text-slate-400 block">({abstainPct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VOTING CONTROLS OR RECEIPT STATUS */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* WORKER HAS ALREADY VOTED */}
                  {proposal.userHasVoted ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-emerald-900">
                          Your Vote Recorded:
                        </span>
                      </div>
                      <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-xs">
                        {proposal.userVote}
                      </span>
                    </div>
                  ) : proposal.status === 'OPEN' && proposal.userCanVote ? (
                    /* WORKER CAN VOTE NOW */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
                        <span>Cast your ballot (one-time & final):</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(['YES', 'NO', 'ABSTAIN'] as const).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleCastVote(proposal.id, choice)}
                            disabled={isSubmittingVote}
                            className={`flex-1 rounded-xl py-2 text-xs font-black transition-all shadow-2xs ${
                              choice === 'YES'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : choice === 'NO'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            Vote {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* ADMINISTRATIVE / CREATOR CONTROLS */}
                  {canManage && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {proposal.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVoting(proposal.id)}
                          disabled={actionLoadingId === proposal.id}
                          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5"
                        >
                          {actionLoadingId === proposal.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening...
                            </>
                          ) : (
                            <>
                              <Clock3 className="h-3.5 w-3.5" /> Open for Worker Voting (7 Days)
                            </>
                          )}
                        </button>
                      )}

                      {proposal.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => handleCloseVoting(proposal.id)}
                          disabled={actionLoadingId === proposal.id}
                          className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5"
                        >
                          {actionLoadingId === proposal.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finalizing...
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5 text-slate-500" /> Finalize & Close Ballot
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROPOSAL MODAL */}
      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProposals}
      />
    </div>
  );
}
