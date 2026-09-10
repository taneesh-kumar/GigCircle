import React from 'react';
import { Star, MapPin, CheckCircle, Clock, DollarSign, Wrench, Compass, AlertCircle, ShieldCheck } from 'lucide-react';
import type { NearbyWorker, NearbyWorkerSearchResult } from '@/types/service-request';

interface NearbyWorkersListProps {
  searchResult: NearbyWorkerSearchResult | null;
  isLoading?: boolean;
  onSelectWorker?: (worker: NearbyWorker) => void;
}

export function NearbyWorkersList({ searchResult, isLoading, onSelectWorker }: NearbyWorkersListProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-full rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-500">
        <Compass className="mx-auto h-8 w-8 text-slate-400 animate-spin-slow mb-2" />
        <p className="text-xs font-medium">Select a location on the map to discover nearby available workers.</p>
      </div>
    );
  }

  const { workers, effectiveRadiusKm, tierMessage } = searchResult;

  return (
    <div className="space-y-4">
      {/* Tier Expansion Status Header */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-800">
        <div className="flex items-center gap-2 font-medium">
          <Compass className="h-4 w-4 shrink-0 text-emerald-600 animate-pulse" />
          <span>{tierMessage}</span>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-2xs">
          Radius: {effectiveRadiusKm} km
        </span>
      </div>

      {/* No Workers State */}
      {workers.length === 0 ? (
        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-6 text-center space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
          <h4 className="font-display text-sm font-bold text-slate-800">No Nearby Workers Found</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {tierMessage || 'No qualified, available workers found within 50 km. Try adjusting your service location on the map.'}
          </p>
        </div>
      ) : (
        /* Workers Grid */
        <div className="grid gap-3 sm:grid-cols-2">
          {workers.map((worker) => (
            <div
              key={worker.workerId}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {worker.name}
                      </h4>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    {worker.experienceYears !== undefined && (
                      <p className="text-[11px] font-medium text-slate-500">
                        {worker.experienceYears} yrs experience
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {worker.rating ? worker.rating.toFixed(1) : 'New'}
                    {worker.totalRatings > 0 && (
                      <span className="text-[10px] text-amber-600/80">({worker.totalRatings})</span>
                    )}
                  </span>
                </div>

                {/* Distance & Availability Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                    <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
                    {worker.distanceKm} km away
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-bold text-emerald-700">Available</span>
                  </span>

                  {worker.hourlyRate && (
                    <span className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800">
                      ₹{worker.hourlyRate}/hr
                    </span>
                  )}
                </div>

                {/* Service Categories / Skills */}
                {worker.skills && worker.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {worker.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                    {worker.skills.length > 3 && (
                      <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                        +{worker.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {onSelectWorker && (
                <div className="mt-3 border-t border-slate-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectWorker(worker)}
                    className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition-colors"
                  >
                    Request Worker
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
