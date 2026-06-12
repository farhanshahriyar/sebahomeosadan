-- ============================================
-- Site Configuration / Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- Site Identity
  site_name TEXT NOT NULL DEFAULT 'Popular Homeo Center',
  site_tagline TEXT NOT NULL DEFAULT 'হোমিওপ্যাথি চিকিৎসা সেবা',
  site_description TEXT NOT NULL DEFAULT 'আপনার সঠিক সিদ্ধান্তই আপনাকে রাখতে পারে সুস্থ এবং সুরক্ষিত।',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '+8801720970031',
  contact_address TEXT NOT NULL DEFAULT '',

  -- SEO
  meta_title TEXT NOT NULL DEFAULT 'Popular Homeo Center | Homeopathy',
  meta_description TEXT NOT NULL DEFAULT 'Popular Homeo Center - হোমিওপ্যাথি চিকিৎসা সেবা।',
  meta_keywords TEXT NOT NULL DEFAULT 'homeopathy, homeo, হোমিও, চিকিৎসা',

  -- Appearance
  primary_color TEXT NOT NULL DEFAULT '#0d7a3e',
  accent_color TEXT NOT NULL DEFAULT '#f48840',
  logo_url TEXT NOT NULL DEFAULT '',
  favicon_url TEXT NOT NULL DEFAULT '',

  -- Social Links
  facebook_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  twitter_url TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',

  -- Content Settings
  posts_per_page INTEGER NOT NULL DEFAULT 10,
  enable_comments BOOLEAN NOT NULL DEFAULT false,
  enable_search BOOLEAN NOT NULL DEFAULT true,
  show_author_name BOOLEAN NOT NULL DEFAULT true,
  show_reading_time BOOLEAN NOT NULL DEFAULT true,
  default_article_status TEXT NOT NULL DEFAULT 'draft',

  -- Maintenance
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT NOT NULL DEFAULT 'সাইটটি রক্ষণাবেক্ষণের জন্য বন্ধ রয়েছে। শীঘ্রই ফিরে আসব।',

  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_single_row_config CHECK (id = 1)
);

-- Insert initial row if not exists
INSERT INTO public.site_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admins can update site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admins can insert site_config" ON public.site_config;

-- 1. Everyone can read site_config (public access for front-end)
CREATE POLICY "Anyone can read site_config"
  ON public.site_config FOR SELECT
  USING (true);

-- 2. Only admins/super_admins can update site_config
CREATE POLICY "Admins can update site_config"
  ON public.site_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 3. Only admins/super_admins can insert site_config (for initialization)
CREATE POLICY "Admins can insert site_config"
  ON public.site_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
