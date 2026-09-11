import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import type { CreateProposalRequest, ProposalCategory } from '@/types/governance';
import { createProposalApi } from '@/services/api/governance';
import { useToast } from '@/hooks/use-toast';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProposalModal({ isOpen, onClose, onSuccess }: CreateProposalModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProposalCategory>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES: { value: ProposalCategory; label: string; description: string }[] = [
    { value: 'GENERAL', label: t('governance.categoryGeneral'), description: 'Cooperative operation, meetings, or general motions.' },
    { value: 'POLICY', label: t('governance.categoryPolicy'), description: 'Rules, codes of conduct, or membership standards.' },
    { value: 'PLATFORM_FEE', label: t('governance.categoryFees'), description: 'Proposals affecting take rates, platform fees, and pricing.' },
    { value: 'BENEFITS', label: t('governance.categoryBenefits'), description: 'Healthcare, safety equipment, tool subsidies, or insurance.' },
    { value: 'DISPUTE_RULE', label: t('governance.categoryDisputes'), description: 'Arbitration timelines, review panels, and fairness standards.' },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 5 || trimmedTitle.length > 255) {
      setError('Title must be between 5 and 255 characters.');
      return;
    }

    if (trimmedDesc.length < 20 || trimmedDesc.length > 4000) {
      setError('Description must be between 20 and 4000 characters to provide sufficient context for members.');
      return;
    }

    try {
      setIsSubmitting(true);
      const req: CreateProposalRequest = {
        title: trimmedTitle,
        description: trimmedDesc,
        category,
      };

      await createProposalApi(req);

      toast({
        title: 'Proposal Draft Created',
        description: 'Your cooperative proposal has been submitted as a draft and is ready to open for voting.',
      });

      setTitle('');
      setDescription('');
      setCategory('GENERAL');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create proposal. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 block">
              {t('governance.modalEyebrow')}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">{t('governance.modalTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('governance.titleLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('governance.titlePlaceholder')}
              maxLength={255}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">{t('governance.titleChars')}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('governance.categoryLabel')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProposalCategory)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {CATEGORIES.find((c) => c.value === category)?.description}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('governance.descLabel')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('governance.descPlaceholder')}
              rows={5}
              maxLength={4000}
              required
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>{t('governance.descMin')}</span>
              <span>{description.length} / 4000</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-3 text-xs text-emerald-900">
            <strong>Cooperative Policy:</strong> {t('governance.coopPolicyNotice')}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('governance.submitting')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> {t('governance.createDraftProposal')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
