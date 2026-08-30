import React, { useState, useEffect } from 'react';
import { Briefcase, Check, DollarSign, MapPin, Plus, ShieldCheck, Tag, User, X, AlertCircle, Loader2, Wrench, Activity, Sparkles, Hammer, Paintbrush, Sprout, Tv, HelpCircle } from 'lucide-react';
import { createWorkerProfileApi, updateWorkerProfileApi } from '@/services/api';
import { CATEGORY_LABELS, type ServiceCategory } from '@/types/service-request';
import type { WorkerProfile } from '@/types/worker-profile';
import { useToast } from '@/hooks/use-toast';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: WorkerProfile) => void;
  existingProfile: WorkerProfile | null;
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

export function WorkerProfileModal({ isOpen, onClose, onSuccess, existingProfile }: WorkerProfileModalProps) {
  const { toast } = useToast();
  const isEditing = !!existingProfile;

  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [hourlyRate, setHourlyRate] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('10');
  const [isAvailable, setIsAvailable] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (existingProfile) {
      setSelectedCategories(existingProfile.serviceCategories || []);
      setSkills(existingProfile.skills || []);
      setBio(existingProfile.bio || '');
      setExperienceYears(String(existingProfile.experienceYears ?? 0));
      setHourlyRate(String(existingProfile.hourlyRate ?? ''));
      setServiceLocation(existingProfile.serviceLocation || '');
      setServiceRadiusKm(String(existingProfile.serviceRadiusKm ?? 10));
      setIsAvailable(existingProfile.available ?? true);
    } else {
      setSelectedCategories([]);
      setSkills([]);
      setBio('');
      setExperienceYears('0');
      setHourlyRate('');
      setServiceLocation('');
      setServiceRadiusKm('10');
      setIsAvailable(true);
    }
    setErrors({});
    setSubmitError(null);
  }, [existingProfile, isOpen]);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setErrors((prev) => ({ ...prev, skill: 'Skill already added.' }));
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
    setErrors((prev) => ({ ...prev, skills: '' }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setErrors((prev) => ({ ...prev, categories: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedCategories.length === 0) {
      newErrors.categories = 'Select at least one service category you offer.';
    }

    if (skills.length === 0) {
      newErrors.skills = 'Add at least one skill tag.';
    }

    const exp = parseInt(experienceYears, 10);
    if (isNaN(exp) || exp < 0) {
      newErrors.experienceYears = 'Experience years must be 0 or greater.';
    }

    const rate = parseFloat(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than ₹0.';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters.';
    }

    const radius = parseInt(serviceRadiusKm, 10);
    if (serviceRadiusKm && (isNaN(radius) || radius < 1)) {
      newErrors.serviceRadiusKm = 'Radius must be at least 1 km.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      bio: bio.trim() || undefined,
      experienceYears: parseInt(experienceYears, 10),
      hourlyRate: parseFloat(hourlyRate),
      skills,
      serviceCategories: selectedCategories,
      isAvailable,
      serviceLocation: serviceLocation.trim() || undefined,
      serviceRadiusKm: serviceRadiusKm ? parseInt(serviceRadiusKm, 10) : undefined,
    };

    try {
      let result: WorkerProfile;
      if (isEditing) {
        result = await updateWorkerProfileApi(payload);
        toast({
          title: 'Profile Updated',
          description: 'Your worker profile has been updated successfully.',
        });
      } else {
        result = await createWorkerProfileApi(payload);
        toast({
          title: 'Profile Created',
          description: 'Your worker profile has been set up successfully.',
        });
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save worker profile.';
      setSubmitError(msg);
      toast({
        title: 'Error Saving Profile',
        description: msg,
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
        aria-labelledby="worker-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <Briefcase className="h-4 w-4" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                {isEditing ? 'Edit Profile' : 'Worker Onboarding'}
              </span>
            </div>
            <h2 id="worker-modal-title" className="mt-1 font-display text-2xl font-semibold text-primary">
              {isEditing ? 'Update Worker Profile' : 'Complete Your Worker Profile'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Define your skills, rate, service categories, and availability for future local requests.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors disabled:opacity-50"
            aria-label="Close modal"
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
          {/* Service Categories (Multi-select) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary">
              Supported Service Categories <span className="text-destructive">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Select all categories you are qualified to perform.</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((catKey) => {
                const isSelected = selectedCategories.includes(catKey);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => toggleCategory(catKey)}
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
            {errors.categories && <p className="mt-1.5 text-xs text-destructive">{errors.categories}</p>}
          </div>

          {/* Skills Tag Editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary">
              Skills & Expertise <span className="text-destructive">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Add specific skill tags (e.g. Pipe Fitting, Wiring, Deep Cleaning).</p>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Leak Detection, Circuit Repair..."
                  className="focus-ring w-full rounded-2xl border border-border/80 bg-background pl-10 pr-3.5 py-3 text-sm text-primary placeholder:text-muted-foreground/60 transition-colors hover:border-accent/40"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="focus-ring inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-3 text-xs font-bold text-primary hover:bg-secondary/80 transition-colors"
              >
                <Plus className="h-4 w-4 text-accent" /> Add Tag
              </button>
            </div>
            {errors.skills && <p className="mt-1.5 text-xs text-destructive">{errors.skills}</p>}

            {/* Rendered Skill Chips */}
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="rounded-full p-0.5 hover:bg-accent/20 hover:text-accent-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience & Hourly Rate */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="experienceYears" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Years of Experience <span className="text-destructive">*</span>
              </label>
              <input
                id="experienceYears"
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="5"
                className={`focus-ring mt-2 w-full rounded-2xl border bg-background px-3.5 py-3 text-sm text-primary transition-colors ${
                  errors.experienceYears ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                }`}
              />
              {errors.experienceYears && <p className="mt-1.5 text-xs text-destructive">{errors.experienceYears}</p>}
            </div>

            <div>
              <label htmlFor="hourlyRate" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Hourly / Service Rate (₹) <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-3 font-mono font-bold text-muted-foreground">₹</span>
                <input
                  id="hourlyRate"
                  type="number"
                  min="1"
                  step="1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="500"
                  className={`focus-ring w-full rounded-2xl border bg-background pl-9 pr-3.5 py-3 text-sm text-primary transition-colors ${
                    errors.hourlyRate ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                  }`}
                />
              </div>
              {errors.hourlyRate && <p className="mt-1.5 text-xs text-destructive">{errors.hourlyRate}</p>}
            </div>
          </div>

          {/* Location & Service Radius */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="serviceLocation" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Primary Location
              </label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="serviceLocation"
                  type="text"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="focus-ring w-full rounded-2xl border border-border/80 bg-background pl-10 pr-3.5 py-3 text-sm text-primary transition-colors hover:border-accent/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="serviceRadiusKm" className="block text-xs font-bold uppercase tracking-wider text-primary">
                Service Radius (km)
              </label>
              <input
                id="serviceRadiusKm"
                type="number"
                min="1"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                placeholder="10"
                className={`focus-ring mt-2 w-full rounded-2xl border bg-background px-3.5 py-3 text-sm text-primary transition-colors ${
                  errors.serviceRadiusKm ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
                }`}
              />
              {errors.serviceRadiusKm && <p className="mt-1.5 text-xs text-destructive">{errors.serviceRadiusKm}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-wider text-primary">
              Short Worker Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell households about your expertise, background, and commitment to quality work..."
              className={`focus-ring mt-2 w-full rounded-2xl border bg-background p-3.5 text-sm text-primary transition-colors ${
                errors.bio ? 'border-destructive' : 'border-border/80 hover:border-accent/40'
              }`}
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              {errors.bio ? <span className="text-destructive">{errors.bio}</span> : <span />}
              <span>{bio.length}/500</span>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background p-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Current Availability</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Toggle whether you are available to receive local service requests.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`focus-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isAvailable ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Complete Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
