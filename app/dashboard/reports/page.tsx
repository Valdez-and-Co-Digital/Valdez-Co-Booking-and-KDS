'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useImpersonation } from '@/providers/ImpersonationProvider';
import { Loader2, TrendingUp, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function ReportsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();
  const { impersonatedTenantId } = useImpersonation();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        let tenantId = impersonatedTenantId;
        
        if (!tenantId) {
          // Get user's own tenant ID
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('tenant_id')
            .eq('user_id', session.user.id)
            .single();
          if (adminUser) tenantId = adminUser.tenant_id;
        }

        if (tenantId) {
          const { data: analyticsData, error: rpcError } = await supabase.rpc('get_merchant_analytics', { p_tenant_id: tenantId });
          if (rpcError) throw rpcError;
          setData(analyticsData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase, impersonatedTenantId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Failed to load analytics: {error}
      </div>
    );
  }

  // Safely extract data
  const heatmap = data?.heatmap || [];
  const efficiency = data?.efficiency || { efficiency_percentage: 0, total_orders: 0 };
  const retention = data?.retention || [];

  // Helper to get heatmap intensity
  const getIntensity = (val: number, max: number) => {
    if (max === 0) return 0;
    return val / max;
  };
  
  const maxRevenue = heatmap.reduce((max: number, curr: any) => Math.max(max, curr.total_revenue), 0);
  
  // Format heatmap grid: 7 days x 24 hours
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({length: 24}, (_, i) => i);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-500" />
          Advanced Analytics
        </h1>
        <p className="text-zinc-400 text-sm">Performance insights and historical data</p>
      </div>

      {/* Top Row: Revenue Heatmap */}
      <div className="glass-card rounded-2xl border-white/10 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-white">Revenue Heatmap</h2>
          <p className="text-xs text-zinc-400">Busiest days and hours based on completed orders</p>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            <div className="flex mb-2">
              <div className="w-12"></div> {/* Empty corner */}
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-[10px] text-zinc-500 font-mono">
                  {h === 0 ? '12A' : h < 12 ? `${h}A` : h === 12 ? '12P' : `${h-12}P`}
                </div>
              ))}
            </div>
            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-xs text-zinc-400 font-medium">{day}</div>
                {hours.map(h => {
                  const cell = heatmap.find((c: any) => c.day_of_week === dIdx && c.hour_of_day === h);
                  const val = cell ? cell.total_revenue : 0;
                  const intensity = getIntensity(val, maxRevenue);
                  return (
                    <div 
                      key={`${dIdx}-${h}`} 
                      className="flex-1 aspect-square mx-0.5 rounded-sm transition-all hover:scale-110"
                      style={{
                        backgroundColor: intensity > 0 ? `rgba(124, 58, 237, ${0.1 + (intensity * 0.9)})` : 'rgba(255, 255, 255, 0.03)',
                        boxShadow: intensity > 0.7 ? '0 0 8px rgba(124, 58, 237, 0.4)' : 'none'
                      }}
                      title={`${day} ${h}:00 - $${val.toFixed(2)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle Left: Service Efficiency Gauge */}
        <div className="glass-card rounded-2xl border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock className="w-24 h-24 text-green-500" />
          </div>
          <h2 className="text-sm font-display font-semibold text-zinc-400 self-start mb-6">Service Efficiency</h2>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Simple CSS Radial Progress */}
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-white/5"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="100, 100"
              />
              <path
                className={`${efficiency.efficiency_percentage >= 90 ? 'text-green-500' : efficiency.efficiency_percentage >= 75 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${efficiency.efficiency_percentage}, 100`}
                style={{ filter: `drop-shadow(0 0 4px currentColor)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-display font-bold text-white">{efficiency.efficiency_percentage}%</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Within SLA</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-6 text-center max-w-[200px]">
            Based on {efficiency.total_orders} completed orders in the warning timeframe (15m).
          </p>
        </div>

        {/* Middle Right: Customer Retention Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl border-white/10 p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-display font-semibold text-zinc-400">Customer Retention</h2>
            <p className="text-xs text-zinc-500 mt-1">New vs Returning Customers (Last 6 Months)</p>
          </div>
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retention} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month_label" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 20, 25, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '13px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                <Line type="monotone" name="New Customers" dataKey="new_customers" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6, fill: '#d2bbff' }} />
                <Line type="monotone" name="Returning Customers" dataKey="returning_customers" stroke="rgba(124, 58, 237, 0.4)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: 'rgba(124, 58, 237, 0.4)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Static KPIs (Mocked for visual completeness per design) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-4 rounded-xl border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Average Order Value</p>
            <p className="text-xl font-display font-bold text-white mt-1">$24.50</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Net Profit Margin</p>
            <p className="text-xl font-display font-bold text-white mt-1">68.2%</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Customer Churn Rate</p>
            <p className="text-xl font-display font-bold text-white mt-1">4.1%</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
