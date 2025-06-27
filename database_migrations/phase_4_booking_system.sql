-- Phase 4: Booking Flow & Notifications System
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. BOOKINGS TABLE AND RLS POLICIES
-- =====================================================

-- 1a) Create service_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_types (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Insert common service types
INSERT INTO public.service_types (name) VALUES
  ('plumbing'),
  ('hvac'),
  ('electrical'),
  ('roofing'),
  ('landscaping'),
  ('painting'),
  ('flooring'),
  ('appliance-repair'),
  ('handyman'),
  ('cleaning')
ON CONFLICT (name) DO NOTHING;

-- 1b) Bookings master table
CREATE TABLE IF NOT EXISTS public.bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type_id  INT         NOT NULL REFERENCES public.service_types(id),
  scheduled_date   DATE        NOT NULL,
  scheduled_time   TIME        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',  -- pending|scheduled|completed|cancelled
  notes            TEXT,       -- Optional booking notes
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 1c) RLS Policies for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Homeowner can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Provider can see own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Provider can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role full access on bookings" ON public.bookings;

-- Homeowners can manage their own bookings
CREATE POLICY "Homeowner can manage own bookings"
  ON public.bookings FOR ALL
  USING ( homeowner_id = auth.uid() )
  WITH CHECK ( homeowner_id = auth.uid() );

-- Providers can see & update their own bookings
CREATE POLICY "Provider can see own bookings"
  ON public.bookings FOR SELECT
  USING ( provider_id = auth.uid() );

CREATE POLICY "Provider can update own bookings"
  ON public.bookings FOR UPDATE
  USING ( provider_id = auth.uid() )
  WITH CHECK ( provider_id = auth.uid() );

-- Service-role (admin) full access
CREATE POLICY "Service role full access on bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING ( true ) WITH CHECK ( true );

-- =====================================================
-- 2. DASHBOARD VIEWS
-- =====================================================

-- 2a) Homeowner's upcoming bookings (next 5)
CREATE OR REPLACE VIEW public.view_upcoming_bookings AS
SELECT
  b.id,
  b.provider_id,
  b.scheduled_date,
  b.scheduled_time,
  b.status,
  b.notes,
  pp.business_name as provider_business_name,
  pp.full_name as provider_name,
  st.name as service_type,
  b.created_at
FROM public.bookings b
LEFT JOIN public.provider_profiles pp ON b.provider_id = pp.user_id
LEFT JOIN public.service_types st ON b.service_type_id = st.id
WHERE b.homeowner_id = auth.uid()
  AND b.scheduled_date >= current_date
ORDER BY b.scheduled_date, b.scheduled_time
LIMIT 5;

-- 2b) Provider's new leads (pending bookings)
CREATE OR REPLACE VIEW public.view_provider_new_leads AS
SELECT
  b.id,
  b.homeowner_id,
  b.service_type_id,
  b.scheduled_date,
  b.scheduled_time,
  b.notes,
  p.email as homeowner_email,
  prof.full_name as homeowner_name,
  st.name as service_type,
  b.created_at
FROM public.bookings b
LEFT JOIN auth.users p ON b.homeowner_id = p.id
LEFT JOIN public.profiles prof ON b.homeowner_id = prof.id
LEFT JOIN public.service_types st ON b.service_type_id = st.id
WHERE b.provider_id = auth.uid()
  AND b.status = 'pending'
ORDER BY b.created_at DESC;

-- 2c) Provider's all bookings view
CREATE OR REPLACE VIEW public.view_provider_bookings AS
SELECT
  b.id,
  b.homeowner_id,
  b.service_type_id,
  b.scheduled_date,
  b.scheduled_time,
  b.status,
  b.notes,
  p.email as homeowner_email,
  prof.full_name as homeowner_name,
  st.name as service_type,
  b.created_at,
  b.updated_at
FROM public.bookings b
LEFT JOIN auth.users p ON b.homeowner_id = p.id
LEFT JOIN public.profiles prof ON b.homeowner_id = prof.id
LEFT JOIN public.service_types st ON b.service_type_id = st.id
WHERE b.provider_id = auth.uid()
ORDER BY b.scheduled_date DESC, b.scheduled_time DESC;

-- =====================================================
-- 3. NOTIFICATIONS SYSTEM
-- =====================================================

-- 3a) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  link        TEXT,       -- optional URL to click
  type        TEXT        NOT NULL DEFAULT 'info', -- info|success|warning|error
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3b) RLS Policies for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access on notifications" ON public.notifications;

CREATE POLICY "Users can see own notifications"
  ON public.notifications FOR SELECT
  USING ( user_id = auth.uid() );

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

-- Service role full access
CREATE POLICY "Service role full access on notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING ( true ) WITH CHECK ( true );

-- 3c) Unread notifications view
CREATE OR REPLACE VIEW public.view_unread_notifications AS
SELECT 
  id, 
  title,
  message, 
  link, 
  type,
  created_at
FROM public.notifications
WHERE user_id = auth.uid() AND NOT is_read
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 4. NOTIFICATION TRIGGERS
-- =====================================================

-- 4a) Function to notify provider on new booking
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  homeowner_name TEXT;
  service_name TEXT;
BEGIN
  -- Get homeowner name
  SELECT COALESCE(prof.full_name, u.email) INTO homeowner_name
  FROM auth.users u
  LEFT JOIN public.profiles prof ON u.id = prof.id
  WHERE u.id = NEW.homeowner_id;
  
  -- Get service type name
  SELECT name INTO service_name
  FROM public.service_types
  WHERE id = NEW.service_type_id;
  
  -- Insert notification for provider
  INSERT INTO public.notifications(user_id, title, message, link, type)
  VALUES (
    NEW.provider_id,
    'New Booking Request',
    format('New %s booking request from %s for %s at %s', 
           service_name, 
           homeowner_name, 
           NEW.scheduled_date, 
           NEW.scheduled_time),
    '/dashboard/bookings/' || NEW.id,
    'info'
  );
  
  RETURN NEW;
END;
$$ language plpgsql;

-- 4b) Function to notify homeowner on booking status change
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  service_name TEXT;
  status_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider business name
  SELECT COALESCE(business_name, full_name) INTO provider_name
  FROM public.provider_profiles
  WHERE user_id = NEW.provider_id;
  
  -- Get service type name
  SELECT name INTO service_name
  FROM public.service_types
  WHERE id = NEW.service_type_id;
  
  -- Set message and type based on new status
  CASE NEW.status
    WHEN 'scheduled' THEN
      status_message := format('Your %s booking with %s has been confirmed for %s at %s', 
                              service_name, provider_name, NEW.scheduled_date, NEW.scheduled_time);
      notification_type := 'success';
    WHEN 'completed' THEN
      status_message := format('Your %s service with %s has been completed', 
                              service_name, provider_name);
      notification_type := 'success';
    WHEN 'cancelled' THEN
      status_message := format('Your %s booking with %s has been cancelled', 
                              service_name, provider_name);
      notification_type := 'warning';
    ELSE
      status_message := format('Your %s booking status has been updated to: %s', 
                              service_name, NEW.status);
      notification_type := 'info';
  END CASE;
  
  -- Insert notification for homeowner
  INSERT INTO public.notifications(user_id, title, message, link, type)
  VALUES (
    NEW.homeowner_id,
    'Booking Status Update',
    status_message,
    '/dashboard/bookings/' || NEW.id,
    notification_type
  );
  
  RETURN NEW;
END;
$$ language plpgsql;

-- 4c) Create triggers
DROP TRIGGER IF EXISTS trig_notify_new_booking ON public.bookings;
CREATE TRIGGER trig_notify_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();

DROP TRIGGER IF EXISTS trig_notify_booking_status_change ON public.bookings;
CREATE TRIGGER trig_notify_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();

-- =====================================================
-- 5. ENABLE RLS ON SERVICE TYPES
-- =====================================================

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access to service types
DROP POLICY IF EXISTS "Public can view service types" ON public.service_types;
CREATE POLICY "Public can view service types"
  ON public.service_types FOR SELECT
  USING ( true );

-- Service role full access
DROP POLICY IF EXISTS "Service role full access on service_types" ON public.service_types;
CREATE POLICY "Service role full access on service_types"
  ON public.service_types FOR ALL
  TO service_role
  USING ( true ) WITH CHECK ( true );

-- =====================================================
-- 6. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment below to insert sample notifications for testing
/*
-- Sample notification (replace USER_ID with actual user ID)
INSERT INTO public.notifications (user_id, title, message, link, type) VALUES
  ('YOUR_USER_ID_HERE', 'Welcome!', 'Welcome to RivoHome booking system', '/dashboard', 'success');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 'bookings' as table_name, count(*) as row_count FROM public.bookings
UNION ALL
SELECT 'notifications' as table_name, count(*) as row_count FROM public.notifications
UNION ALL
SELECT 'service_types' as table_name, count(*) as row_count FROM public.service_types;

-- Check if views were created
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'view_%';

-- Check if triggers were created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('bookings');

COMMIT; 