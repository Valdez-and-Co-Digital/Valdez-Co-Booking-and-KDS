'use client';

import { QuickCharge } from '@/components/payments/QuickCharge';

export default function QuickChargePage() {
  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold">Terminal Quick Charge</h1>
        <p className="text-sm text-zinc-400">Accept contactless Tap to Pay payments</p>
      </div>
      <QuickCharge tenantId="b0000000-0000-0000-0000-000000000002" />
    </div>
  );
}
