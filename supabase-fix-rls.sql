-- ============================================
-- FIX: Infinite recursion in RLS policies
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;

-- Recreate policies WITHOUT recursive self-references

-- 1. Allow any authenticated user to read their OWN profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Allow admins to view ALL profiles using JWT metadata (no recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow super_admin to update any profile (using JWT, no recursion)
CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- 5. Allow inserts for authenticated users (own profile only)
CREATE POLICY "Allow insert for authenticated users"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- DONE! Refresh your dashboard to verify.
-- ============================================
