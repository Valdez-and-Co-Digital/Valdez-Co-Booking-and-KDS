'use client';

import { useMemo } from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { Appointment } from './CalendarView';
import { Clock, User } from 'lucide-react';

interface DayScheduleProps {
  appointments: Appointment[];
  date: Date;
  businessHours: { start: number; end: number };
  onAppointmentClick?: (apt: Appointment) => void;
}

export function DaySchedule({ appointments, date, businessHours, onAppointmentClick }: DayScheduleProps) {
  const { start, end } = businessHours;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const totalMinutes = (end - start + 1) * 60;

  // Calculate top position percentage based on time
  const getTopPosition = (dateString: string) => {
    const d = parseISO(dateString);
    const m = d.getHours() * 60 + d.getMinutes();
    const offsetMins = m - (start * 60);
    // If it's before business hours, clamp it to top
    if (offsetMins < 0) return 0;
    return (offsetMins / totalMinutes) * 100;
  };

  // Calculate height percentage based on duration
  const getHeight = (startStr: string, endStr: string) => {
    const s = parseISO(startStr);
    const e = parseISO(endStr);
    const diff = differenceInMinutes(e, s);
    return (diff / totalMinutes) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200';
      case 'confirmed': return 'bg-blue-500/20 border-blue-500/50 text-blue-200';
      case 'in_progress': return 'bg-violet-500/20 border-violet-500/50 text-violet-200';
      case 'completed': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-500/20 border-red-500/50 text-red-200 opacity-50';
      default: return 'bg-zinc-500/20 border-zinc-500/50 text-zinc-200';
    }
  };

  return (
    <div className="relative min-w-[600px] min-h-[800px] select-none">
      {/* Time Grid Background */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {hours.map((hour) => (
          <div key={hour} className="flex-1 border-t border-white/5 relative group">
            <span className="absolute -top-3 left-2 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </span>
            {/* 30-min dashed line */}
            <div className="absolute top-1/2 left-16 right-0 border-t border-dashed border-white/5" />
          </div>
        ))}
      </div>

      {/* Appointments Container */}
      <div className="absolute inset-0 left-16 right-4 pointer-events-auto">
        {appointments.map((apt) => {
          const top = getTopPosition(apt.slot_start);
          // Default to 30 mins if slot_end is missing (just as fallback)
          const height = apt.slot_end 
            ? getHeight(apt.slot_start, apt.slot_end)
            : (30 / totalMinutes) * 100;
            
          // If the appointment falls completely outside the view, we could hide it, 
          // but relying on CSS overflow handles most issues.

          return (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick && onAppointmentClick(apt)}
              className={`absolute left-2 right-2 rounded-lg border p-2 overflow-hidden transition-all hover:ring-2 ring-white/20 cursor-pointer shadow-lg backdrop-blur-sm ${getStatusColor(apt.status)}`}
              style={{
                top: `${top}%`,
                height: `${height}%`,
                minHeight: '40px' // Ensure very short appointments are still clickable
              }}
              title={`${apt.customer_name} - ${format(parseISO(apt.slot_start), 'h:mm a')}`}
            >
              <div className="flex flex-col h-full text-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold truncate flex items-center gap-1.5">
                    <User className="w-3 h-3 opacity-70" />
                    {apt.customer_name}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 shrink-0 bg-black/20 px-1.5 py-0.5 rounded">
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-xs opacity-80 flex items-center gap-1 mt-1 truncate">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(apt.slot_start), 'h:mm a')} - {apt.slot_end ? format(parseISO(apt.slot_end), 'h:mm a') : 'TBD'}
                </div>

                {/* Services summary */}
                {apt.cart_items && apt.cart_items.length > 0 && (
                  <div className="mt-auto pt-1 truncate text-xs opacity-90 font-medium">
                    {apt.cart_items.map(item => item.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
