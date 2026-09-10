import React from 'react';
import { Star, MapPin, ShieldCheck, ArrowRight, User, CheckCircle2 } from 'lucide-react';
import type { RecommendedWorker, WorkerRecommendationResult } from '@/types/service-request';
import { VerifiedWorkerBadge } from '@/components/verified-worker-badge';


interface RecommendedWorkerCardProps {
  recommendationResult: WorkerRecommendationResult | null;
  isLoading?: boolean;
  onSelectWorker?: (worker: RecommendedWorker) => void;
}

export function RecommendedWorkerCard({ recommendationResult, isLoading, onSelectWorker }: RecommendedWorkerCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-emerald-200/80 bg-white p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-48 rounded bg-emerald-100" />
        <div className="h-40 w-full rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!recommendationResult) {
    return null;
  }

  const { topRecommendation, otherWorkers, effectiveSearchRadiusKm, tierMessage } = recommendationResult;
  const allWorkers: RecommendedWorker[] = [
    ...(topRecommendation ? [topRecommendation] : []),
    ...(otherWorkers || []),
  ];

  if (allWorkers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center space-y-2">
        <MapPin className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="text-base font-bold text-slate-900">No available workers found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {tierMessage || 'No available workers found within 30 km for this service category.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Radius & Tier Message Header */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{tierMessage || `${allWorkers.length} available worker(s) found near you`}</span>
        </div>
        <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-white border border-emerald-200 rounded-full px-2.5 py-0.5">
          Search Radius: {effectiveSearchRadiusKm} km
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Available Nearby Workers (Sorted by Distance)
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          {allWorkers.map((worker) => (
            <div
              key={worker.workerId}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {worker.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-display text-base font-black text-slate-900 group-hover:text-emerald-950 transition-colors">
                          {worker.name}
                        </h5>
                        <VerifiedWorkerBadge isVerified={worker.isVerified} size="sm" />
                      </div>
                      <span className="font-mono text-xs font-extrabold text-emerald-700 block mt-0.5">
                        📍 {worker.distanceKm} km away
                      </span>
                    </div>

                  </div>

                  <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-200 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {worker.rating ? worker.rating.toFixed(1) : 'New'}
                    {worker.totalRatings > 0 && (
                      <span className="text-[10px] text-amber-700/80">({worker.totalRatings})</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
                  {worker.experienceYears !== undefined && (
                    <span>{worker.experienceYears} yrs exp</span>
                  )}
                  {worker.hourlyRate && (
                    <span className="font-bold text-slate-800">• ₹{worker.hourlyRate}/hr</span>
                  )}
                </div>
              </div>

              {onSelectWorker && (
                <button
                  type="button"
                  onClick={() => onSelectWorker(worker)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  Select Worker <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
