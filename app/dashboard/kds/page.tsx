'use client';

import { KDSBoard } from '@/components/kds/KDSBoard';

export default function KDSPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <KDSBoard tenantId="b0000000-0000-0000-0000-000000000002" />
    </div>
  );
}
