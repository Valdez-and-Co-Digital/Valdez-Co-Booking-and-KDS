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
  SELECT COALESCE(SUM(total_cents), 0) / 100.0 INTO tpv
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
      EXTRACT(DOW FROM slot_start) as day_of_week,
      EXTRACT(HOUR FROM slot_start) as hour_of_day,
      SUM(total_cents) / 100.0 as total_revenue,
      COUNT(*) as order_count
    FROM public.orders_appointments
    WHERE tenant_id = p_tenant_id AND status = 'completed'
    GROUP BY EXTRACT(DOW FROM slot_start), EXTRACT(HOUR FROM slot_start)
    ORDER BY day_of_week, hour_of_day
  ) h;

  -- Service Efficiency: % of orders completed within 15 minutes
  SELECT row_to_json(e) INTO efficiency
  FROM (
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN (updated_at - ordered_at) <= interval '15 minutes' THEN 1 ELSE 0 END) as on_time_orders,
      CASE WHEN COUNT(*) > 0 THEN 
        ROUND((SUM(CASE WHEN (updated_at - ordered_at) <= interval '15 minutes' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100)
      ELSE 0 END as efficiency_percentage
    FROM public.orders_appointments
    WHERE tenant_id = p_tenant_id AND status = 'completed'
  ) e;

  -- Customer Retention: New vs Returning Customers by month (last 6 months)
  SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO retention
  FROM (
    WITH CustomerFirstOrder AS (
      SELECT customer_email, MIN(ordered_at) as first_order_date
      FROM public.orders_appointments
      WHERE tenant_id = p_tenant_id AND customer_email IS NOT NULL
      GROUP BY customer_email
    ),
    MonthlyOrders AS (
      SELECT 
        DATE_TRUNC('month', o.ordered_at) as month_date,
        o.customer_email,
        CASE WHEN DATE_TRUNC('month', o.ordered_at) = DATE_TRUNC('month', cfo.first_order_date) THEN 'new' ELSE 'returning' END as cust_type
      FROM public.orders_appointments o
      JOIN CustomerFirstOrder cfo ON o.customer_email = cfo.customer_email
      WHERE o.tenant_id = p_tenant_id AND o.customer_email IS NOT NULL
        AND o.ordered_at >= (NOW() - interval '6 months')
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
