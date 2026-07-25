import { addMinutes, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, BusinessHours, BusinessHourSlot } from '@/types/database';

type DB = Database;

// ============================================================
// SALON SCHEDULER
// Sequential slot stacking: total duration of cart determines
// the minimum contiguous free window needed.
// ============================================================

export interface AvailableSlot {
  start: Date;
  end: Date;
  label: string; // e.g. "9:00 AM"
}

export async function getAvailableSalonSlots(
  supabase: SupabaseClient<DB>,
  tenantId: string,
  date: Date,
  totalDurationMinutes: number,
  businessHours: BusinessHours
): Promise<AvailableSlot[]> {
  // Get day of week
  const dayKey = format(date, 'EEE').toLowerCase() as keyof BusinessHours;
  const hours = businessHours[dayKey] as BusinessHourSlot;

  // If closed on this day, return empty
  if (hours.closed || !hours.open || !hours.close) return [];

  // Parse business hours into today's Date objects
  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const dayOpen = new Date(date);
  dayOpen.setHours(openH, openM, 0, 0);
  const dayClose = new Date(date);
  dayClose.setHours(closeH, closeM, 0, 0);

  // Fetch existing bookings for this day
  const { data: existing } = await supabase
    .from('orders_appointments')
    .select('slot_start, slot_end')
    .eq('tenant_id', tenantId)
    .gte('slot_start', startOfDay(date).toISOString())
    .lte('slot_start', endOfDay(date).toISOString())
    .not('status', 'in', '("cancelled","no_show")');

  const booked = (existing ?? []).map(b => ({
    start: new Date(b.slot_start),
    end: b.slot_end ? new Date(b.slot_end) : addMinutes(new Date(b.slot_start), 30),
  }));

  const slots: AvailableSlot[] = [];
  const intervalMinutes = 15;
  let cursor = new Date(dayOpen);

  while (cursor.getTime() + totalDurationMinutes * 60000 <= dayClose.getTime()) {
    const slotEnd = addMinutes(cursor, totalDurationMinutes);

    // Check if [cursor, slotEnd) overlaps with any existing booking
    const hasConflict = booked.some(b =>
      cursor < b.end && slotEnd > b.start
    );

    if (!hasConflict) {
      slots.push({
        start: new Date(cursor),
        end: slotEnd,
        label: format(cursor, 'h:mm a'),
      });
    }

    cursor = addMinutes(cursor, intervalMinutes);
  }

  return slots;
}

// ============================================================
// FOOD TRUCK SCHEDULER — Slot Throttling
// Checks how many orders are in a 15-minute window against
// the tenant's max_capacity setting.
// ============================================================

export interface SlotCapacity {
  available: boolean;
  currentCount: number;
  maxCapacity: number;
  percentFull: number;
}

export async function getFoodTruckSlotCapacity(
  supabase: SupabaseClient<DB>,
  tenantId: string,
  slotStart: Date,
  maxCapacity: number
): Promise<SlotCapacity> {
  const slotEnd = addMinutes(slotStart, 15);

  const { count } = await supabase
    .from('orders_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('slot_start', slotStart.toISOString())
    .lt('slot_start', slotEnd.toISOString())
    .not('status', 'in', '("cancelled","no_show")');

  const currentCount = count ?? 0;
  return {
    available: currentCount < maxCapacity,
    currentCount,
    maxCapacity,
    percentFull: Math.round((currentCount / maxCapacity) * 100),
  };
}

/**
 * Returns available 15-minute pickup slots for a food truck.
 * Filters out slots that have reached max_capacity.
 */
export async function getAvailableFoodTruckSlots(
  supabase: SupabaseClient<DB>,
  tenantId: string,
  date: Date,
  maxCapacity: number,
  businessHours: BusinessHours,
  slotsAhead: number = 8 // show next N slots from now
): Promise<AvailableSlot[]> {
  const dayKey = format(date, 'EEE').toLowerCase() as keyof BusinessHours;
  const hours = businessHours[dayKey] as BusinessHourSlot;

  if (hours.closed || !hours.open || !hours.close) return [];

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const dayOpen = new Date(date);
  dayOpen.setHours(openH, openM, 0, 0);
  const dayClose = new Date(date);
  dayClose.setHours(closeH, closeM, 0, 0);

  // Start from the next 15-min boundary from now
  const now = new Date();
  let cursor = now > dayOpen ? roundUpTo15Min(now) : new Date(dayOpen);
  const slots: AvailableSlot[] = [];

  while (cursor < dayClose && slots.length < slotsAhead) {
    const capacity = await getFoodTruckSlotCapacity(supabase, tenantId, cursor, maxCapacity);
    if (capacity.available) {
      slots.push({
        start: new Date(cursor),
        end: addMinutes(cursor, 15),
        label: format(cursor, 'h:mm a'),
      });
    }
    cursor = addMinutes(cursor, 15);
  }

  return slots;
}

function roundUpTo15Min(date: Date): Date {
  const ms = 15 * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}
