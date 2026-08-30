import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Wrench, X, AlertCircle, Loader2, Check, Sparkles, Activity, Briefcase, Hammer, Paintbrush, Sprout, Tv, HelpCircle } from 'lucide-react';
import { createServiceRequestApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const getCategoryIcon = (category: string) => {
  const catUpper = (category || '').toUpperCase();
  switch (catUpper) {
    case 'PLUMBING':
      return <Wrench className="h-5 w-5 text-emerald-600" />;
    case 'ELECTRICAL':
      return <Activity className="h-5 w-5 text-amber-600 animate-pulse" />;
    case 'CLEANING':
      return <Sparkles className="h-5 w-5 text-teal-600" />;
    case 'CARPENTRY':
      return <Hammer className="h-5 w-5 text-orange-600" />;
    case 'PAINTING':
      return <Paintbrush className="h-5 w-5 text-pink-600" />;
    case 'GARDENING':
      return <Sprout className="h-5 w-5 text-green-600" />;
    case 'APPLIANCE_REPAIR':
      return <Tv className="h-5 w-5 text-sky-600" />;
    default:
      return <HelpCircle className="h-5 w-5 text-slate-500" />;
  }
};

export function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const { toast } = useToast();

  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = new Date();
    initial.setHours(0, 0, 0, 0);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthDate = viewMonth;
  const monthName = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const firstWeekday = (monthDate.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  const monthDays: Array<{ value: string; day: number; disabled: boolean } | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    monthDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    monthDays.push({
      value: formatLocalDate(date),
      day,
      disabled: date < today,
    });
  }

  const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
  const periodOptions = ['AM', 'PM'];
  const monthOptions = Array.from({ length: 3 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + index, 1);
    return {
      value: monthDate.getMonth(),
      year: monthDate.getFullYear(),
      label: monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
  });
  const WHEEL_ITEM_HEIGHT = 42;
  const timeColumnRefs = useRef<Record<'hour' | 'minute' | 'period', HTMLDivElement | null>>({
    hour: null,
    minute: null,
    period: null,
  });

  const getWheelScrollTop = (index: number, container: HTMLDivElement) => {
    const centerOffset = container.clientHeight / 2 - WHEEL_ITEM_HEIGHT / 2;
    return Math.max(0, index * WHEEL_ITEM_HEIGHT - centerOffset);
  };

  const updatePreferredTime = (nextDate: string, nextTime: string) => {
    const nextValue = nextDate && nextTime ? `${nextDate}T${nextTime}:00` : '';
    setPreferredTime(nextValue);
    if (errors.preferredTime) {
      setErrors((prev) => ({ ...prev, preferredTime: '' }));
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    updatePreferredTime(date, selectedTime || '09:00');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    updatePreferredTime(selectedDate || formatLocalDate(today), time);
  };

  const handleMonthChange = (nextMonth: number, nextYear: number) => {
    const minMonth = today.getMonth();
    const maxMonth = today.getMonth() + 2;
    const clampedMonth = Math.min(maxMonth, Math.max(minMonth, nextMonth));
    const safeYear = Math.max(today.getFullYear(), nextYear);
    setViewMonth(new Date(safeYear, clampedMonth, 1));
  };

  const getDisplayTime = (timeValue: string) => {
    if (!timeValue) {
      return { hour: '09', minute: '00', period: 'AM' };
    }

    const [hourValue, minuteValue] = timeValue.split(':');
    const hourNumber = Number(hourValue);
    const hour12 = hourNumber % 12 || 12;

    return {
      hour: String(hour12).padStart(2, '0'),
      minute: minuteValue,
      period: hourNumber >= 12 ? 'PM' : 'AM',
    };
  };

  const selectedDisplay = getDisplayTime(selectedTime || '09:00');

  const updateDisplayedTime = (nextHour: string, nextMinute: string, nextPeriod: string) => {
    let hour24 = Number(nextHour);
    if (nextPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    if (nextPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }

    const nextTime = `${String(hour24).padStart(2, '0')}:${nextMinute}`;
    handleTimeSelect(nextTime);
  };

  const handleTimeColumnScroll = (
    event: React.UIEvent<HTMLDivElement>,
    options: string[],
    currentValue: string,
    onChange: (value: string) => void,
  ) => {
    const container = event.currentTarget;
    const center = container.clientHeight / 2;
    const rawIndex = (container.scrollTop + center - WHEEL_ITEM_HEIGHT / 2) / WHEEL_ITEM_HEIGHT;
    const index = Math.min(options.length - 1, Math.max(0, Math.round(rawIndex)));
    const nextValue = options[index];

    if (nextValue !== currentValue) {
      onChange(nextValue);
    }
  };

  useEffect(() => {
    const setScrollPosition = (column: 'hour' | 'minute' | 'period', value: string, options: string[]) => {
      const container = timeColumnRefs.current[column];
      if (!container) return;
      const index = options.indexOf(value);
      if (index === -1) return;
      container.scrollTop = getWheelScrollTop(index, container);
    };

    setScrollPosition('hour', selectedDisplay.hour, hourOptions);
    setScrollPosition('minute', selectedDisplay.minute, minuteOptions);
    setScrollPosition('period', selectedDisplay.period, periodOptions);
  }, [selectedDisplay.hour, selectedDisplay.minute, selectedDisplay.period]);

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
      setSelectedDate('');
      setSelectedTime('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-rise-in">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                New Customer Request
              </span>
            </div>
            <h2 id="modal-title" className="font-display text-2xl font-black text-slate-900">
              Request a Service
            </h2>
            <p className="text-xs text-slate-500">
              Describe what your household needs and specify your location and preferred schedule.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Service Category */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Service Category <span className="text-red-500">*</span>
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
                    className={`relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 shadow-2xs ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 font-semibold shadow-xs ring-1 ring-emerald-500/20 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-3xs ${
                      isSelected ? 'bg-white text-emerald-600' : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {getCategoryIcon(catKey)}
                    </div>
                    <span className="text-xs font-black tracking-tight mt-1">{CATEGORY_LABELS[catKey].label}</span>
                    <span className="line-clamp-1 text-[9px] text-slate-400 font-medium">
                      {CATEGORY_LABELS[catKey].description}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="mt-1.5 text-xs text-red-600">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Describe what you need <span className="text-red-500">*</span>
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
                className={`w-full rounded-2xl border bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400/80 hover:border-slate-300 hover:shadow-2xs transition-all ${
                  errors.description ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              {errors.description ? (
                <span className="text-xs text-red-600">{errors.description}</span>
              ) : (
                <span className="font-medium">Provide specific details so workers understand the job scope</span>
              )}
              <span className="font-medium">{description.length}/1000</span>
            </div>
          </div>

          {/* Location & Budget */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Service Location <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className={`w-full rounded-2xl border bg-white pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400/80 hover:border-slate-300 hover:shadow-2xs transition-all ${
                    errors.location ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.location && <p className="mt-1.5 text-xs text-red-600">{errors.location}</p>}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Estimated Budget (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-3.5 h-4 w-4 font-mono font-bold text-slate-400">₹</span>
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
                  className={`w-full rounded-2xl border bg-white pl-9 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400/80 hover:border-slate-300 hover:shadow-2xs transition-all ${
                    errors.budget ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.budget && <p className="mt-1.5 text-xs text-red-600">{errors.budget}</p>}
            </div>
          </div>

          {/* Preferred Date & Time */}
          <div>
            <label htmlFor="preferredTime" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Preferred Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="preferredTime"
                type="datetime-local"
                min={nowStr}
                value={preferredTime}
                onChange={(e) => {
                  setPreferredTime(e.target.value);
                  if (errors.preferredTime) setErrors((prev) => ({ ...prev, preferredTime: '' }));
                }}
                className={`w-full rounded-2xl border bg-white pl-10 pr-3.5 py-3 text-sm text-slate-900 hover:border-slate-300 hover:shadow-2xs transition-all ${
                  errors.preferredTime ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.preferredTime && <p className="mt-1.5 text-xs text-red-600">{errors.preferredTime}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
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
