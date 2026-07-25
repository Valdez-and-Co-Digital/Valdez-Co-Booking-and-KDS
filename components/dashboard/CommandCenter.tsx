'use client';

import { useState } from 'react';
import { KDSBoard } from '@/components/kds/KDSBoard';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Utensils, Calendar as CalendarIcon } from 'lucide-react';

interface CommandCenterProps {
  tenantId: string;
  defaultIsFoodTruck?: boolean;
  businessHours?: any;
}

export function CommandCenter({ tenantId, defaultIsFoodTruck = false, businessHours }: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'kds'>(
    defaultIsFoodTruck ? 'kds' : 'calendar'
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top View Toggle */}
      <div className="flex items-center justify-between glass-card px-4 py-2 rounded-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Command View:</span>
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Salon Calendar
            </button>
            <button
              onClick={() => setActiveTab('kds')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'kds'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Kitchen Display (KDS)
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'calendar' ? (
          <CalendarView tenantId={tenantId} businessHours={businessHours} />
        ) : (
          <KDSBoard tenantId={tenantId} />
        )}
      </div>
    </div>
  );
}
