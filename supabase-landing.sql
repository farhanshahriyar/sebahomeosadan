-- ============================================
-- Landing Page Settings and Customizations
-- ============================================

CREATE TABLE IF NOT EXISTS public.landing_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'আপনার সঠিক সিদ্ধান্তই আপনাকে',
  hero_subtitle TEXT NOT NULL DEFAULT 'রাখতে পারে সুস্থ এবং সুরক্ষিত।',
  hero_quote TEXT NOT NULL DEFAULT 'Medicine is a science of experience; its object is to eradicate diseases by means of remedies. The knowledge of disease, the knowledge of remedies and the knowledge of their employment, constitute medicine.',
  hero_quote_author TEXT NOT NULL DEFAULT 'Samuel Hahnemann',
  hero_phone TEXT NOT NULL DEFAULT '+8801720970031',
  hero_image TEXT NOT NULL DEFAULT '/img/img2.png',
  banner_image TEXT NOT NULL DEFAULT '/img/banner.png',
  marquee_text TEXT NOT NULL DEFAULT 'সাম্প্রতিক পোস্ট : একোনাইটাম নেপেলাস [Aconitum Napellus] , এ্যাকটিয়া রেসিমোসা [Actea Racemosa] | যোগাযোগ করুন +8801720970031',
  featured_articles UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_single_row CHECK (id = 1)
);

-- Insert initial row if not exists
INSERT INTO public.landing_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Add column if table already exists
ALTER TABLE public.landing_settings ADD COLUMN IF NOT EXISTS featured_articles UUID[] DEFAULT '{}';

-- Enable Row Level Security
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read landing_settings" ON public.landing_settings;
DROP POLICY IF EXISTS "Admins can update landing_settings" ON public.landing_settings;

-- 1. Everyone can read landing_settings (public access)
CREATE POLICY "Anyone can read landing_settings"
  ON public.landing_settings FOR SELECT
  USING (true);

-- 2. Only admins/super_admins can update landing_settings
CREATE POLICY "Admins can update landing_settings"
  ON public.landing_settings FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 3. Only admins/super_admins can insert landing_settings (for initialization if needed)
CREATE POLICY "Admins can insert landing_settings"
  ON public.landing_settings FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );
