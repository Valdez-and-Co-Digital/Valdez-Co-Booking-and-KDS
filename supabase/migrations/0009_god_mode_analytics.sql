-- Add location columns to tenants for God Mode Map
ALTER TABLE public.tenants
ADD COLUMN current_lat DOUBLE PRECISION,
ADD COLUMN current_lng DOUBLE PRECISION;

-- RPC for God Mode Stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json AS $$
DECLARE
  tpv NUMERIC;
  fees NUMERIC;
  active_tenants INT;
  total_users INT;
BEGIN
  -- Sum of all completed orders
  SELECT COALESCE(SUM(total_price_cents), 0) / 100.0 INTO tpv
  FROM public.orders_appointments
  WHERE status = 'completed';

  fees := tpv * 0.01; -- 1% fees

  SELECT COUNT(*) INTO active_tenants FROM public.tenants;
  SELECT COUNT(*) INTO total_users FROM public.admin_users;

  RETURN json_build_object(
    'tpv', tpv,
    'fees', fees,
    'active_tenants', active_tenants,
    'total_users', total_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for Merchant Analytics
CREATE OR REPLACE FUNCTION get_merchant_analytics(p_tenant_id uuid)
RETURNS json AS $$
DECLARE
  heatmap json;
  efficiency json;
  retention json;
BEGIN
  -- Revenue Heatmap: Sum by Day of Week (0=Sun, 6=Sat) and Hour of Day
  SELECT COALESCE(json_agg(row_to_json(h)), '[]'::json) INTO heatmap
  FROM (
    SELECT 
      EXTRACT(DOW FROM start_time) as day_of_week,
      EXTRACT(HOUR FROM start_time) as hour_of_day,
      SUM(total_price_cents) / 100.0 as total_revenue,
      COUNT(*) as order_count
    FROM public.orders_appointments
    WHERE tenant_id = p_tenant_id AND status = 'completed'
    GROUP BY EXTRACT(DOW FROM start_time), EXTRACT(HOUR FROM start_time)
    ORDER BY day_of_week, hour_of_day
  ) h;

  -- Service Efficiency: % of orders completed within 15 minutes
  SELECT row_to_json(e) INTO efficiency
  FROM (
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN (updated_at - created_at) <= interval '15 minutes' THEN 1 ELSE 0 END) as on_time_orders,
      CASE WHEN COUNT(*) > 0 THEN 
        ROUND((SUM(CASE WHEN (updated_at - created_at) <= interval '15 minutes' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100)
      ELSE 0 END as efficiency_percentage
    FROM public.orders_appointments
    WHERE tenant_id = p_tenant_id AND status = 'completed'
  ) e;

  -- Customer Retention: New vs Returning Customers by month (last 6 months)
  SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO retention
  FROM (
    WITH CustomerFirstOrder AS (
      SELECT customer_id, MIN(created_at) as first_order_date
      FROM public.orders_appointments
      WHERE tenant_id = p_tenant_id AND customer_id IS NOT NULL
      GROUP BY customer_id
    ),
    MonthlyOrders AS (
      SELECT 
        DATE_TRUNC('month', o.created_at) as month_date,
        o.customer_id,
        CASE WHEN DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', cfo.first_order_date) THEN 'new' ELSE 'returning' END as cust_type
      FROM public.orders_appointments o
      JOIN CustomerFirstOrder cfo ON o.customer_id = cfo.customer_id
      WHERE o.tenant_id = p_tenant_id AND o.customer_id IS NOT NULL
        AND o.created_at >= (NOW() - interval '6 months')
    )
    SELECT 
      TO_CHAR(month_date, 'Mon YYYY') as month_label,
      SUM(CASE WHEN cust_type = 'new' THEN 1 ELSE 0 END) as new_customers,
      SUM(CASE WHEN cust_type = 'returning' THEN 1 ELSE 0 END) as returning_customers
    FROM MonthlyOrders
    GROUP BY month_date
    ORDER BY month_date ASC
  ) r;

  RETURN json_build_object(
    'heatmap', heatmap,
    'efficiency', efficiency,
    'retention', retention
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
