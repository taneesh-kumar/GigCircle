import React from 'react';
import { PlatformShell } from '@/components/platform-shell';
import { AppHeader } from '@/components/app-shell/AppHeader';
import { HorizontalNav } from '@/components/app-shell/HorizontalNav';
import { WorkerVerificationSection } from '@/components/worker-verification-section';

export default function WorkerVerificationPage() {
  return (
    <PlatformShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AppHeader sectionTitle="Worker Verification & Compliance" />

        <HorizontalNav />

        <main className="mt-4">
          <WorkerVerificationSection />
        </main>
      </div>
    </PlatformShell>
  );
}
