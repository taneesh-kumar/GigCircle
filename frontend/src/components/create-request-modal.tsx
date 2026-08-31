import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown, MapPin, Wrench, X, AlertCircle, Loader2, Check, Sparkles, Activity, Briefcase, Hammer, Paintbrush, Sprout, Tv, HelpCircle } from 'lucide-react';
import { createServiceRequestApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/service-request';
import { useToast } from '@/hooks/use-toast';
import { LocationPicker, type LocationPickerValue } from '@/components/location-picker';

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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [budget, setBudget] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = new Date();
    initial.setHours(0, 0, 0, 0);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);

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

  const timeSlots = Array.from({ length: 9 }, (_, index) => {
    const hour = 9 + index;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const monthOptions = Array.from({ length: 3 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + index, 1);
    return {
      value: monthDate.getMonth(),
      year: monthDate.getFullYear(),
      label: monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
  });

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
      const selectedDateTime = new Date(preferredTime);
      if (isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date()) {
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
      const locText = location.trim() || address.trim() || city.trim() || 'Selected Map Location';
      await createServiceRequestApi({
        category: category as ServiceCategory,
        description: description.trim(),
        location: locText,
        latitude,
        longitude,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        budget: parseFloat(budget),
        preferredTime: new Date(preferredTime).toISOString().slice(0, 19),
      });

      toast({
        title: 'Request Created',
        description: 'Your service request has been posted successfully.',
      });

      setCategory('');
      setDescription('');
      setLocation('');
      setLatitude(null);
      setLongitude(null);
      setAddress('');
      setCity('');
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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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

          {/* Map Location Selector */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-4">
            <LocationPicker
              label="Select Service Location on Map"
              initialLatitude={latitude}
              initialLongitude={longitude}
              initialAddress={address}
              initialCity={city}
              onChange={(val: LocationPickerValue) => {
                setLatitude(val.latitude);
                setLongitude(val.longitude);
                setAddress(val.address);
                setCity(val.city);
                if (val.address || val.city) {
                  setLocation(val.address ? (val.city ? `${val.address}, ${val.city}` : val.address) : val.city);
                }
                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
              }}
            />

            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div>
                <label htmlFor="location" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Address / City Details <span className="text-red-500">*</span>
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
                    placeholder="e.g. MG Road, Vijayawada"
                    className={`w-full rounded-2xl border bg-white pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400/80 hover:border-slate-300 hover:shadow-2xs transition-all ${
                      errors.location ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.location && <p className="mt-1.5 text-xs text-red-600">{errors.location}</p>}
              </div>

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
        </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary">
              Preferred Date & Time <span className="text-destructive">*</span>
            </label>

            <div className="mt-3 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Choose date</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMonthMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-white"
                      aria-label="Select month"
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{monthName}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {isMonthMenuOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        {monthOptions.map((option) => {
                          const isActive = option.value === monthDate.getMonth() && option.year === monthDate.getFullYear();
                          return (
                            <button
                              key={`${option.year}-${option.value}`}
                              type="button"
                              onClick={() => {
                                setViewMonth(new Date(option.year, option.value, 1));
                                setIsMonthMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                                isActive
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{option.label}</span>
                              {isActive && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <span key={day} className="py-1">{day}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {monthDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="h-10" />;
                      }

                      const isSelected = selectedDate === day.value;

                      return (
                        <button
                          key={day.value}
                          type="button"
                          disabled={day.disabled}
                          onClick={() => handleDateSelect(day.value)}
                          className={`h-10 rounded-xl border text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                              : day.disabled
                                ? 'border-transparent bg-slate-200/60 text-slate-400 cursor-not-allowed'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {day.day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Choose time slot</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">
                      {new Date(`${selectedDate}T${selectedTime}:00`).toLocaleString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {errors.preferredTime && <p className="mt-1.5 text-xs text-destructive">{errors.preferredTime}</p>}
          </div>

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
