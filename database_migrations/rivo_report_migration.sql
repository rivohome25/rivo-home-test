-- =====================================================
-- RIVO REPORT DATABASE MIGRATION
-- =====================================================
-- This migration adds all necessary schema changes for the
-- comprehensive Rivo Report feature including property metadata,
-- task history tracking, ownership timeline, and verification levels

-- =====================================================
-- 1. ENHANCE PROPERTIES TABLE
-- =====================================================
-- Add new columns for Rivo Report metadata
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS square_footage INT,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS rivo_id TEXT UNIQUE;

-- Create function to generate Rivo ID
CREATE OR REPLACE FUNCTION public.generate_rivo_id()
RETURNS TEXT AS $$
DECLARE
  state_code TEXT;
  zip_code   TEXT;
  random_part TEXT;
  new_rivo_id TEXT;
  counter INT := 0;
BEGIN
  -- Extract state from region (assuming format like "Dallas, TX")
  state_code := UPPER(COALESCE(
    SUBSTRING(NEW.region FROM ', ([A-Z]{2})$'),
    'XX'
  ));
  
  -- Extract ZIP from address using regex
  zip_code := COALESCE(
    SUBSTRING(NEW.address FROM '\d{5}'),
    '00000'
  );
  
  -- Generate unique Rivo ID with collision handling
  LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || counter::TEXT) FROM 1 FOR 4));
    new_rivo_id := CONCAT('RIV-', state_code, '-', zip_code, '-', random_part);
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE rivo_id = new_rivo_id) THEN
      RETURN new_rivo_id;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 1000 THEN
      RAISE EXCEPTION 'Unable to generate unique Rivo ID';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate Rivo ID on insert
CREATE OR REPLACE FUNCTION public.set_rivo_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rivo_id IS NULL THEN
    NEW.rivo_id := public.generate_rivo_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_rivo_id ON public.properties;
CREATE TRIGGER trg_generate_rivo_id
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_rivo_id();

-- Backfill existing properties with Rivo IDs
UPDATE public.properties
SET rivo_id = public.generate_rivo_id()
WHERE rivo_id IS NULL;

-- =====================================================
-- 2. CREATE USER TASK HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_task_history (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id      UUID      REFERENCES public.properties(id) ON DELETE CASCADE,
  task_type        TEXT      NOT NULL,
  task_date        DATE      NOT NULL,
  source           TEXT      NOT NULL CHECK (source IN ('verified_pro', 'verified_external', 'diy_upload', 'self_reported')),
  verification_level NUMERIC(3,2) NOT NULL CHECK (verification_level BETWEEN 0 AND 1),
  notes            TEXT,
  media_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_task_history_user_id ON public.user_task_history(user_id);
CREATE INDEX idx_user_task_history_property_id ON public.user_task_history(property_id);
CREATE INDEX idx_user_task_history_task_date ON public.user_task_history(task_date);

-- Enable RLS
ALTER TABLE public.user_task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own task history"
  ON public.user_task_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own task history"
  ON public.user_task_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task history"
  ON public.user_task_history FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own task history"
  ON public.user_task_history FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 3. CREATE PROPERTY OWNERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_owners (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID      REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_name    TEXT      NOT NULL,
  owner_email   TEXT,
  start_date    DATE      NOT NULL,
  end_date      DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_property_owners_property_id ON public.property_owners(property_id);
CREATE INDEX idx_property_owners_dates ON public.property_owners(start_date, end_date);

-- Enable RLS
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view owners of their properties"
  ON public.property_owners FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage owners of their properties"
  ON public.property_owners FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate Home Health Score
CREATE OR REPLACE FUNCTION public.calculate_home_health_score(p_property_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points NUMERIC := 0;
  total_possible NUMERIC := 0;
  task_count RECORD;
BEGIN
  -- Count tasks by verification level
  FOR task_count IN 
    SELECT 
      source,
      COUNT(*) as count,
      CASE source
        WHEN 'verified_pro' THEN 1.0
        WHEN 'verified_external' THEN 0.85
        WHEN 'diy_upload' THEN 0.9
        WHEN 'self_reported' THEN 0.6
      END as weight
    FROM public.user_task_history
    WHERE property_id = p_property_id
      AND task_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY source
  LOOP
    total_points := total_points + (task_count.count * task_count.weight);
    total_possible := total_possible + task_count.count;
  END LOOP;
  
  -- Count overdue tasks (weight = 0)
  SELECT COUNT(*) INTO task_count
  FROM public.user_tasks ut
  JOIN public.master_tasks mt ON ut.task_id = mt.id
  WHERE ut.property_id = p_property_id
    AND ut.due_date < CURRENT_DATE
    AND ut.completed = false;
  
  IF task_count.count > 0 THEN
    total_possible := total_possible + task_count.count;
  END IF;
  
  -- Calculate score
  IF total_possible = 0 THEN
    RETURN 100; -- No tasks = perfect score
  ELSE
    RETURN ROUND((total_points / total_possible) * 100);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property report data
CREATE OR REPLACE FUNCTION public.get_property_report_data(p_property_id UUID)
RETURNS TABLE (
  verification_source TEXT,
  task_count INTEGER,
  weight NUMERIC,
  contribution INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH task_counts AS (
    -- Completed tasks from history
    SELECT 
      source,
      COUNT(*)::INTEGER as count
    FROM public.user_task_history
    WHERE property_id = p_property_id
      AND task_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY source
    
    UNION ALL
    
    -- Overdue tasks
    SELECT 
      'overdue' as source,
      COUNT(*)::INTEGER as count
    FROM public.user_tasks ut
    WHERE ut.property_id = p_property_id
      AND ut.due_date < CURRENT_DATE
      AND ut.completed = false
  )
  SELECT 
    tc.source as verification_source,
    tc.count as task_count,
    CASE tc.source
      WHEN 'verified_pro' THEN 1.0
      WHEN 'verified_external' THEN 0.85
      WHEN 'diy_upload' THEN 0.9
      WHEN 'self_reported' THEN 0.6
      WHEN 'overdue' THEN 0.0
    END as weight,
    ROUND(tc.count * CASE tc.source
      WHEN 'verified_pro' THEN 1.0
      WHEN 'verified_external' THEN 0.85
      WHEN 'diy_upload' THEN 0.9
      WHEN 'self_reported' THEN 0.6
      WHEN 'overdue' THEN 0.0
    END * 100)::INTEGER as contribution
  FROM task_counts tc
  ORDER BY 
    CASE tc.source
      WHEN 'verified_pro' THEN 1
      WHEN 'verified_external' THEN 2
      WHEN 'diy_upload' THEN 3
      WHEN 'self_reported' THEN 4
      WHEN 'overdue' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER TO POPULATE OWNER HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_initial_property_owner()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Get user details
  SELECT 
    COALESCE(p.full_name, u.email),
    u.email
  INTO user_name, user_email
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = NEW.user_id;
  
  -- Insert initial owner record
  INSERT INTO public.property_owners (
    property_id,
    owner_name,
    owner_email,
    start_date,
    notes
  ) VALUES (
    NEW.id,
    user_name,
    user_email,
    COALESCE(NEW.purchase_date, CURRENT_DATE),
    'Report Initiator'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_initial_owner ON public.properties;
CREATE TRIGGER trg_create_initial_owner
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_property_owner();

-- =====================================================
-- 6. BACKFILL EXISTING DATA
-- =====================================================

-- Create initial owner records for existing properties
INSERT INTO public.property_owners (property_id, owner_name, owner_email, start_date, notes)
SELECT 
  p.id,
  COALESCE(prof.full_name, u.email),
  u.email,
  COALESCE(p.purchase_date, p.created_at::DATE),
  'Report Initiator'
FROM public.properties p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN public.profiles prof ON u.id = prof.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_owners po WHERE po.property_id = p.id
);

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.user_task_history TO authenticated;
GRANT INSERT ON public.user_task_history TO authenticated;
GRANT UPDATE ON public.user_task_history TO authenticated;
GRANT DELETE ON public.user_task_history TO authenticated;

GRANT SELECT ON public.property_owners TO authenticated;
GRANT INSERT ON public.property_owners TO authenticated;
GRANT UPDATE ON public.property_owners TO authenticated;
GRANT DELETE ON public.property_owners TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_home_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_report_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_rivo_id() TO authenticated;

-- =====================================================
-- 8. CREATE REPORT DATA VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.view_property_report_summary AS
SELECT 
  p.id as property_id,
  p.address,
  p.rivo_id,
  p.property_type,
  p.square_footage,
  p.purchase_date,
  p.region,
  p.year_built,
  public.calculate_home_health_score(p.id) as home_health_score,
  (
    SELECT COUNT(*)
    FROM public.user_tasks ut
    WHERE ut.property_id = p.id
      AND ut.due_date >= CURRENT_DATE
      AND ut.completed = false
  ) as upcoming_tasks_count,
  (
    SELECT COUNT(*)
    FROM public.user_tasks ut
    WHERE ut.property_id = p.id
      AND ut.due_date < CURRENT_DATE
      AND ut.completed = false
  ) as overdue_tasks_count,
  (
    SELECT json_agg(
      json_build_object(
        'owner_name', po.owner_name,
        'start_date', po.start_date,
        'end_date', po.end_date,
        'notes', po.notes
      ) ORDER BY po.start_date
    )
    FROM public.property_owners po
    WHERE po.property_id = p.id
  ) as owners
FROM public.properties p
WHERE p.user_id = auth.uid();

GRANT SELECT ON public.view_property_report_summary TO authenticated; 