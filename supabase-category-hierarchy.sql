-- 1. Add parent_id column to categories table for hierarchical structure
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- 2. Create index on parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 3. Update SELECT policy: Everyone can read active categories, 
-- and authors can read the categories/topics they suggested (even if inactive/pending approval)
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read active categories and authors can read own suggested" ON public.categories;

CREATE POLICY "Anyone can read active categories and authors can read own suggested"
  ON public.categories FOR SELECT
  USING (is_active = true OR auth.uid() = created_by);

-- 4. Update INSERT policy: Admins can insert anything; 
-- authenticated authors can insert new suggested topics (which must start as inactive)
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authors and Admins can insert categories" ON public.categories;

CREATE POLICY "Authors and Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    -- Admins can insert anything
    ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin'))
    OR
    -- Authors can suggest inactive categories/topics
    (auth.role() = 'authenticated' AND is_active = false)
  );
