-- Fix the relationship between profiles and user_plans tables
-- This migration adds a foreign key constraint from user_plans.user_id to profiles.id
-- This resolves the "Could not find a relationship between 'profiles' and 'user_plans'" error

-- Add the foreign key constraint
ALTER TABLE user_plans
ADD CONSTRAINT fk_user_plans_profiles
  FOREIGN KEY (user_id)
  REFERENCES profiles (id)
  ON DELETE CASCADE;

-- Note: We don't need to modify the existing constraint to auth.users
-- as we want both relationships to be maintained 