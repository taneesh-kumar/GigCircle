import type { VerificationStatus } from '@/types/worker-verification';

// Helper logic tests for VerifiedWorkerBadge visibility criteria
export function shouldRenderVerifiedBadge(isVerified?: boolean | null): boolean {
  return isVerified === true;
}

export function isStatusPubliclyVerified(status?: VerificationStatus | null): boolean {
  return status === 'VERIFIED';
}

// Logic validation suite
export function runBadgeLogicTests() {
  const results = {
    rendersForTrue: shouldRenderVerifiedBadge(true) === true,
    hidesForFalse: shouldRenderVerifiedBadge(false) === false,
    hidesForNull: shouldRenderVerifiedBadge(null) === false,
    hidesForUndefined: shouldRenderVerifiedBadge(undefined) === false,
    verifiedStatusIsPublic: isStatusPubliclyVerified('VERIFIED') === true,
    pendingStatusIsHidden: isStatusPubliclyVerified('PENDING_REVIEW') === false,
    rejectedStatusIsHidden: isStatusPubliclyVerified('REJECTED') === false,
    suspendedStatusIsHidden: isStatusPubliclyVerified('SUSPENDED') === false,
  };

  const allPassed = Object.values(results).every(Boolean);
  return { allPassed, results };
}
