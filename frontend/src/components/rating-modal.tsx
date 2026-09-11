import React, { useState } from 'react';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createRatingApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  workerName: string | null;
  onSuccess: () => void;
}

export function RatingModal({ isOpen, onClose, jobId, workerName, onSuccess }: RatingModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || jobId === null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1 || score > 5) {
      setError('Please select a rating from 1 to 5 stars.');
      return;
    }

    if (review.length > 500) {
      setError('Review text cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createRatingApi(jobId, {
        score,
        review: review.trim() || undefined,
      });

      toast({
        title: 'Rating Submitted!',
        description: `Thank you for rating ${workerName || 'the worker'}.`,
      });

      onSuccess();
      onClose();
      // Reset form
      setScore(5);
      setReview('');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Failed to submit rating.';

      if (status === 409) {
        setError('This job has already been rated.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarRating = hoverScore || score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl animate-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          aria-label={t('common.close', 'Close')}
          className="absolute right-5 top-5 p-2 text-muted-foreground hover:text-primary rounded-xl transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Rate Service Quality
          </span>
          <h2 className="mt-1 font-display text-2xl font-semibold text-primary">
            Rate {workerName || 'Worker'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Share your feedback to support trustworthy local gig work in our cooperative.
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Star Selection */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHoverScore(star)}
                  onMouseLeave={() => setHoverScore(0)}
                  className="p-1 focus:outline-hidden transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= activeStarRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-amber-500">
              {activeStarRating === 5 && '★★★★★ Excellent'}
              {activeStarRating === 4 && '★★★★☆ Very Good'}
              {activeStarRating === 3 && '★★★☆☆ Good'}
              {activeStarRating === 2 && '★★☆☆☆ Fair'}
              {activeStarRating === 1 && '★☆☆☆☆ Poor'}
            </span>
          </div>

          {/* Optional Review Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-text" className="text-xs font-semibold text-primary">
                Review / Comments (Optional)
              </label>
              <span
                className={`font-mono text-[10px] ${
                  review.length > 480 ? 'text-destructive font-bold' : 'text-muted-foreground'
                }`}
              >
                {review.length}/500
              </span>
            </div>
            <textarea
              id="review-text"
              rows={4}
              maxLength={500}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about the worker's punctuality, skills, or service quality..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-primary placeholder:text-muted-foreground/60 focus:border-accent focus:outline-hidden resize-none"
            />
          </div>

          {/* Form Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="focus-ring rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
