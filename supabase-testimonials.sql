-- ============================================
-- SQL for Testimonials in Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  img TEXT,
  text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can modify testimonials" ON public.testimonials;

-- 1. Everyone can read testimonials (public access)
CREATE POLICY "Anyone can read testimonials"
  ON public.testimonials FOR SELECT
  USING (true);

-- 2. Only admins/super_admins can modify testimonials (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can modify testimonials"
  ON public.testimonials FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Insert initial rows if not exists (using fixed UUIDs to prevent duplicates if run multiple times)
INSERT INTO public.testimonials (id, name, title, img, text, display_order)
VALUES
  ('b001d2d3-1111-4444-a1a1-111111111111', 'Samuel Hahnemann', 'Founder of Homeopathy', '/img/homeo scientist/s1.jpg', 'চিকিৎসা বিজ্ঞান হলো অভিজ্ঞতার বিজ্ঞান; এর উদ্দেশ্য হলো ওষুধের মাধ্যমে রোগ নির্মূল করা। রোগের জ্ঞান, ওষুধের জ্ঞান এবং তাদের প্রয়োগের জ্ঞান - এই তিনটি মিলে চিকিৎসা বিজ্ঞান গঠিত।', 1),
  ('b001d2d3-2222-4444-a2a2-222222222222', 'J.T. Kent', 'Homeopathy Scientist', '/img/homeo scientist/s2.jpg', 'হোমিওপ্যাথি হলো একমাত্র চিকিৎসা পদ্ধতি যা রোগীর সামগ্রিক অবস্থা বিবেচনা করে চিকিৎসা করে। এটি শুধু রোগ নয়, রোগীকে চিকিৎসা করে।', 2),
  ('b001d2d3-3333-4444-a3a3-333333333333', 'William Boericke', 'Homeopathy Author', '/img/homeo scientist/s3.png', 'হোমিওপ্যাথির মূলনীতি হলো ''সদৃশ দ্বারা সদৃশের চিকিৎসা''। এই নীতি অনুসরণ করে সঠিক ওষুধ নির্বাচন করলে রোগ আরোগ্য সম্ভব।', 3),
  ('b001d2d3-4444-4444-a4a4-444444444444', 'E.B. Nash', 'Clinical Practitioner', '/img/homeo scientist/s4.jpg', 'হোমিওপ্যাথি চিকিৎসায় সর্বোপরি মানসিক লক্ষণাবলী লক্ষ্য রাখতে হবে। মানসিক ও দৈহিক উদ্বেগ, অস্থিরতা বর্তমান আছে কি না তা পর্যবেক্ষণ করতে হবে।', 4)
ON CONFLICT (id) DO NOTHING;
