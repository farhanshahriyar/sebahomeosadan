-- ============================================
-- Articles / Blog Posts System
-- ============================================

-- 1. Create the categories table (admin-managed)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'review')),
  views INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 4. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- =====================
-- Categories RLS
-- =====================

-- Everyone can read active categories (public)
CREATE POLICY "Anyone can read active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Admins can read all categories (including inactive)
CREATE POLICY "Admins can read all categories"
  ON public.categories FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Only admins can create categories
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Only admins can update categories
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- =====================
-- Articles RLS
-- =====================

-- Anyone can read published articles (public website)
CREATE POLICY "Anyone can read published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- Authors can read their own articles (any status)
CREATE POLICY "Authors can read own articles"
  ON public.articles FOR SELECT
  USING (auth.uid() = author_id);

-- Admins can read all articles
CREATE POLICY "Admins can read all articles"
  ON public.articles FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Authors can insert their own articles
CREATE POLICY "Authors can insert articles"
  ON public.articles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Admins can insert any article
CREATE POLICY "Admins can insert any article"
  ON public.articles FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );


-- Authors can update their own articles
CREATE POLICY "Authors can update own articles"
  ON public.articles FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Admins can update any article
CREATE POLICY "Admins can update any article"
  ON public.articles FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Authors can delete their own articles
CREATE POLICY "Authors can delete own articles"
  ON public.articles FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can delete any article
CREATE POLICY "Admins can delete any article"
  ON public.articles FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_articles_updated_at();

-- 6. Helper function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^\w\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE
-- ============================================
