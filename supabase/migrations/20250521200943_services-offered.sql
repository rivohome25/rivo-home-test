-- Create service_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_types (
  id   SERIAL    PRIMARY KEY,
  name TEXT      UNIQUE NOT NULL
);

-- Seed some example service types (run once)
INSERT INTO public.service_types (name) VALUES
  ('Plumbing Repair'),
  ('HVAC Maintenance'),
  ('Electrical Work'),
  ('Appliance Installation'),
  ('Roofing'),
  ('General Handyman')
ON CONFLICT (name) DO NOTHING;

-- Create provider_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.provider_services (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type_id INT       REFERENCES public.service_types(id),
  radius_miles    INT       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, service_type_id)
);

-- Add RLS policies for provider_services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Provider policy: can manage their own services
DROP POLICY IF EXISTS "Providers can manage own services" ON public.provider_services;
CREATE POLICY "Providers can manage own services"
  ON public.provider_services FOR ALL
  USING   ( provider_id = auth.uid() )
  WITH CHECK ( provider_id = auth.uid() );

-- Admin policy: can manage all services
DROP POLICY IF EXISTS admin_bypass_provider_services ON public.provider_services;
CREATE POLICY admin_bypass_provider_services
  ON public.provider_services FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
