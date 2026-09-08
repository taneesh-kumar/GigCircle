import React from 'react';
import { PlatformShell } from '@/components/platform-shell';
import { AppHeader } from '@/components/app-shell/AppHeader';
import { HorizontalNav } from '@/components/app-shell/HorizontalNav';
import { AdminVerificationSection } from '@/components/admin-verification-section';

export default function AdminVerificationPage() {
  return (
    <PlatformShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AppHeader sectionTitle="Admin Verification Audit Dashboard" />

        <HorizontalNav />

        <main className="mt-4">
          <AdminVerificationSection />
        </main>
      </div>
    </PlatformShell>
  );
}
