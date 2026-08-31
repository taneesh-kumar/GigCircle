import React from 'react';
import { Star, MapPin, Check, Sparkles, ShieldCheck, Award, ThumbsUp, ArrowRight, User } from 'lucide-react';
import type { RecommendedWorker, WorkerRecommendationResult } from '@/types/service-request';

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

  if (!recommendationResult || !recommendationResult.topRecommendation) {
    return null;
  }

  const { topRecommendation, otherWorkers, effectiveSearchRadiusKm, tierMessage } = recommendationResult;

  return (
    <div className="space-y-6">
      {/* Top Recommended Worker Banner & Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 p-6 shadow-lg">
        {/* Glow effect header */}
        <div className="flex items-center justify-between border-b border-emerald-100/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5 fill-white text-white" />
              {topRecommendation.suitabilityBadge || 'Top Recommended Match'}
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Radius: {effectiveSearchRadiusKm} km
          </span>
        </div>

        {/* Worker Details */}
        <div className="mt-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md">
                {topRecommendation.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-lg font-black text-slate-900">
                    {topRecommendation.name}
                  </h3>
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  {topRecommendation.experienceYears !== undefined && (
                    <span>{topRecommendation.experienceYears} yrs experience</span>
                  )}
                  {topRecommendation.hourlyRate && (
                    <span className="font-bold text-slate-800">• ₹{topRecommendation.hourlyRate}/hr</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800 border border-amber-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {topRecommendation.rating ? topRecommendation.rating.toFixed(1) : 'New'}
                {topRecommendation.totalRatings > 0 && (
                  <span className="text-[10px] text-amber-700/80">({topRecommendation.totalRatings})</span>
                )}
              </span>
              <p className="mt-1 font-mono text-[11px] font-extrabold text-emerald-700">
                📍 {topRecommendation.distanceKm} km away
              </p>
            </div>
          </div>

          {/* Why this worker? (Explainable Match Reasons) */}
          {topRecommendation.matchReasons && topRecommendation.matchReasons.length > 0 && (
            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 shadow-2xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
                Why this recommendation?
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {topRecommendation.matchReasons.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{reason.replace(/^✓\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onSelectWorker && (
            <button
              type="button"
              onClick={() => onSelectWorker(topRecommendation)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition-all"
            >
              Request Top Recommended Worker
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Other Suitable Workers List */}
      {otherWorkers && otherWorkers.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Other Nearby Suitable Workers ({otherWorkers.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherWorkers.map((worker) => (
              <div
                key={worker.workerId}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-display text-sm font-black text-slate-900">{worker.name}</h5>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                      📍 {worker.distanceKm} km away
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {worker.rating ? worker.rating.toFixed(1) : 'New'}
                  </span>
                </div>

                {onSelectWorker && (
                  <button
                    type="button"
                    onClick={() => onSelectWorker(worker)}
                    className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition-colors"
                  >
                    Select Worker
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
