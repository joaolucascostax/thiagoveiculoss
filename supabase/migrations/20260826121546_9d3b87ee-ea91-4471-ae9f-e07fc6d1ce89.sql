CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('vehicles-feed-sync-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vehicles-feed-sync-daily');

SELECT cron.schedule(
  'vehicles-feed-sync-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ebucfxobwbhdlsehyyqr.supabase.co/functions/v1/vehicles-feed-sync',
    headers := '{"Content-Type": "application/json", "x-feed-sync-token": "b4957438d165c3032c1855a85d4b65f3743af7a46adf9f52"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);