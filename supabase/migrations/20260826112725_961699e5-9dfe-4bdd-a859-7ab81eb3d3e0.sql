GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_ad_insights TO authenticated;
GRANT ALL ON public.meta_ad_insights TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_campaign_targets TO authenticated;
GRANT ALL ON public.meta_campaign_targets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_campaigns TO authenticated;
GRANT ALL ON public.meta_campaigns TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT SELECT ON public.store_settings TO anon;
GRANT ALL ON public.store_settings TO service_role;

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT ON public.vehicle_events TO authenticated;
GRANT INSERT ON public.vehicle_events TO anon;
GRANT ALL ON public.vehicle_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;

GRANT SELECT ON public.weekly_reports TO authenticated;
GRANT ALL ON public.weekly_reports TO service_role;