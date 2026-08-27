import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Wrench, X, AlertCircle, Loader2, Check } from 'lucide-react';
import { createServiceRequestApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const { toast } = useToast();

  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Set min datetime to current local time (formatted for datetime-local input)
  const nowStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = 'Please select a service category.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe the service you need.';
    } else if (description.trim().length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters.';
    }

    if (!location.trim()) {
      newErrors.location = 'Please enter the service location.';
    }

    const numericBudget = parseFloat(budget);
    if (!budget || isNaN(numericBudget) || numericBudget <= 0) {
      newErrors.budget = 'Budget must be greater than ₹0.';
    }

    if (!preferredTime) {
      newErrors.preferredTime = 'Please select a preferred date and time.';
    } else {
      const selectedDate = new Date(preferredTime);
      if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
        newErrors.preferredTime = 'Preferred time must be in the future.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await createServiceRequestApi({
        category: category as ServiceCategory,
        description: description.trim(),
        location: location.trim(),
        budget: parseFloat(budget),
        preferredTime: new Date(preferredTime).toISOString().slice(0, 19),
      });

      toast({
        title: 'Request Created',
        description: 'Your service request has been posted successfully.',
      });

      // Reset form
      setCategory('');
      setDescription('');
      setLocation('');
      setBudget('');
      setPreferredTime('');
      setErrors({});

      onSuccess();
      onClose();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || 'Failed to create service request. Please check your inputs.';
      setSubmitError(apiMessage);
      toast({
        title: 'Error Creating Request',
        description: apiMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <Wrench className="h-4 w-4" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">New Customer Request</span>
            </div>
            <h2 id="modal-title" className="mt-1 font-display text-2xl font-semibold text-primary">
              Request a Service
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe what your household needs and specify your location and preferred schedule.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Service Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary">
              Service Category <span className="text-destructive">*</span>
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((catKey) => {
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setCategory(catKey);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    className={`focus-ring relative flex flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-accent font-semibold shadow-xs'
                        : 'border-border/80 bg-background text-muted-foreground hover:border-accent/50 hover:text-primary'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <span className="text-xs font-bold">{CATEGORY_LABELS[catKey].label}</span>
                    <span className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                      {CATEGORY_LABELS[catKey].description}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="mt-1.5 text-xs text-destructive">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-primary">
              Describe what you need <span className="text-destructive">*</span>
            </label>
            <div className="mt-2">
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder="e.g. Kitchen sink drain is completely blocked and water is leaking onto the floor..."
                className={`focus-ring w-full rounded-2xl border bg-background p-3.5 text-sm text-primary placeholder:text-muted-foreground/60 transition-colors ${
                  errors.description ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                }`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              {errors.description ? (
                <span className="text-xs text-destructive">{errors.description}</span>
              ) : (
                <span>Provide specific details so workers understand the job scope</span>
              )}
              <span>{description.length}/1000</span>
            </div>
          </div>

          {/* Location & Budget */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Service Location <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className={`focus-ring w-full rounded-2xl border bg-background pl-10 pr-3.5 py-3 text-sm text-primary placeholder:text-muted-foreground/60 transition-colors ${
                    errors.location ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                  }`}
                />
              </div>
              {errors.location && <p className="mt-1.5 text-xs text-destructive">{errors.location}</p>}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Estimated Budget (₹) <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-3 h-4 w-4 font-mono font-bold text-muted-foreground">₹</span>
                <input
                  id="budget"
                  type="number"
                  min="1"
                  step="1"
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
                  }}
                  placeholder="700"
                  className={`focus-ring w-full rounded-2xl border bg-background pl-9 pr-3.5 py-3 text-sm text-primary placeholder:text-muted-foreground/60 transition-colors ${
                    errors.budget ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                  }`}
                />
              </div>
              {errors.budget && <p className="mt-1.5 text-xs text-destructive">{errors.budget}</p>}
            </div>
          </div>

          {/* Preferred Date & Time */}
          <div>
            <label htmlFor="preferredTime" className="block text-xs font-bold uppercase tracking-wider text-primary">
              Preferred Date & Time <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                id="preferredTime"
                type="datetime-local"
                min={nowStr}
                value={preferredTime}
                onChange={(e) => {
                  setPreferredTime(e.target.value);
                  if (errors.preferredTime) setErrors((prev) => ({ ...prev, preferredTime: '' }));
                }}
                className={`focus-ring w-full rounded-2xl border bg-background pl-10 pr-3.5 py-3 text-sm text-primary transition-colors ${
                  errors.preferredTime ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                }`}
              />
            </div>
            {errors.preferredTime && <p className="mt-1.5 text-xs text-destructive">{errors.preferredTime}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="focus-ring rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-primary hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
