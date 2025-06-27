-- Add missing RLS policies for user_plans table
-- This fixes the "record 'new' has no field 'id'" error during onboarding

-- Users can insert their own plan
CREATE POLICY "Users can insert their own plan"
  ON public.user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan  
CREATE POLICY "Users can update their own plan"
  ON public.user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 