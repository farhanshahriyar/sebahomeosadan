-- ============================================
-- SQL for Medicines Catalog in Supabase
-- ============================================

-- 1. Create the medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_allen TEXT,
  content_roerick TEXT,
  content_kent TEXT,
  content_nash TEXT,
  content_note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_medicines_slug ON public.medicines(slug);

-- 3. Enable Row Level Security
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any (safe re-run)
DROP POLICY IF EXISTS "Anyone can read medicines" ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can delete medicines" ON public.medicines;

-- 5. RLS Policies

-- Everyone can read medicines (public access)
CREATE POLICY "Anyone can read medicines"
  ON public.medicines FOR SELECT
  USING (true);

-- Authenticated users (author/admin/super_admin) can insert medicines
CREATE POLICY "Authenticated users can insert medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Authenticated users (author/admin/super_admin) can update medicines
CREATE POLICY "Authenticated users can update medicines"
  ON public.medicines FOR UPDATE
  USING (
    auth.role() = 'authenticated'
  );

-- Authenticated users (author/admin/super_admin) can delete medicines
CREATE POLICY "Authenticated users can delete medicines"
  ON public.medicines FOR DELETE
  USING (
    auth.role() = 'authenticated'
  );

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_medicines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS medicines_updated_at ON public.medicines;
CREATE TRIGGER medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.update_medicines_updated_at();

-- 7. Seed initial medicines data (using fixed UUIDs to prevent duplicates)
INSERT INTO public.medicines (id, name, slug, content_allen, content_roerick, content_kent, content_nash, content_note)
VALUES
  (
    'a0000001-0001-4000-a001-000000000001',
    'একোনাইটাম নেপেলাস [Aconitum Napellus]',
    'aconitum-napellus',
    E'[মস্কস্হুড নামক লতা] [রানানকুলানি]\n\nযুবক-যুবতীদের বিশেষতঃ বালিকাদের (যুবতী) যারা পূর্ণ রক্তপ্রধান ধাতুবিশিষ্ট এবং অলসভাবে সময় কাটায়, আবহাওয়ার পরিবর্তনে সহজেই অসুস্থ হয়ে পড়ে, যাদের চুল এবং চোখের তারা কাল ও দৃঢ় পেশী তন্তুর অধিকারী, সাধারণতঃ তাদের তরুণ ও তীব্র রোগে উপযোগী।\n\nরোগের উৎপত্তি: শুকনো ঠান্ডা বাতাসে, শুকনো উত্তর বা পশ্চিমা বাতাস লেগে, অথবা ঘর্মাবস্থায় ঠান্ডা বায়ু (প্রবাহ) শরীরে লেগে, ঘর্ম অবরোধ হয়ে তার কুফলে।\n\nভয় অত্যধিক এবং মানসিক উদ্বেগ সৎসহ অত্যন্ত স্নায়ুবিক উত্তেজনা; (ঘরের) বাইরে যেতে, উত্তেজনাপূর্ণ কোন স্থানে জনতার (ভীড়ের) মাঝে যেতে, রাস্তা পার হতে ভয় পায়।\n\nমুখের অভিব্যক্তি ভীতিপ্রদর্শক, ভয়ে জীবন দুর্বিসহ হয়ে পড়ে; নিশ্চিতভাবে মনে করে তার রোগটি সাংঘাতিক, মৃত্যুর দিন সম্বন্ধে ভবিষ্যৎ বাণী করে বসে; গর্ভাবস্থায় মৃত্যুভয়ে ভীত হয়।\n\nঅস্থির এবং উদ্বিগ্ন, সবকিছুই তাড়াতাড়ি করতে চায়; বারে বারে অবশ্যই স্থান পরিবর্তন করে; সবকিছুতেই চমকে উঠে।\n\nবেদনা- অসহ্য, তাকে উন্মাদগ্রস্ত করে তোলে, বেদনায় অস্থির হয়, রাতে বেদনা (বৃদ্ধি)।\n\nহ্যানিম্যান বলেন: "হোমিওপ্যাথিক মতে একোনাইট নির্বাচন কালে সর্বোপরি মানসিক লক্ষণাবলী লক্ষ্য রাখবে, সাবধান যেন উহা (রোগলক্ষণের) সদৃশ হয়- মানসিক ও দৈহিক উদ্বেগ, অস্থিরতা এবং কিছুতেই শান্ত হয় না- এরূপ অবস্থা বর্তমান আছে কি-না লক্ষ্য রাখতে হয়।"\n\nবৃদ্ধি - সন্ধ্যায় ও রাতে বেদনা অসহ্য মনে হয়; গরম ঘরে, বিছানা হতে উঠে বসলে, আক্রান্ত পার্শ্বে চেপে শুলে।\n\nউপশম - খোলা বাতাসে।\n\nসম্বন্ধ - জ্বর, নিদ্রাহীনতা ও অসহ্য বেদনাবোধ লক্ষণে কফিয়া অনুপূরক। আঘাতে আর্নিকা অনুপূরক; সালফার সকল অবস্থায় অনুপূরক।\n\nশক্তি - ১X, ৩X, ৩০, ২০০, ১M।\n\nপুরাতন অবস্থায় মানসিক অবস্থায় বর্তমানে উচ্চশক্তি ফলপ্রদ — ন্যাশ টেস্ট্রিমনি অব দি ক্লিনিক।',
    'রোরিকের মতে একোনাইটাম নেপেলাস একটি অত্যন্ত গুরুত্বপূর্ণ তরুণ রোগের ওষুধ। এর প্রধান কার্যক্ষেত্র হলো তরুণ জ্বর, প্রদাহ এবং ভয়জনিত রোগসমূহ।',
    'কেন্টের মতানুসারে একোনাইটের প্রধান বৈশিষ্ট্য হলো তীব্রতা ও আকস্মিকতা। রোগ হঠাৎ আসে এবং তীব্র আকার ধারণ করে। ভয়, উদ্বেগ এবং অস্থিরতা এর প্রধান মানসিক লক্ষণ।',
    'ন্যাশ বলেন, একোনাইটের তিনটি প্রধান লক্ষণ: (১) অস্থিরতা ও উদ্বেগ, (২) তীব্র পিপাসা সহ জ্বর, এবং (৩) ভয়। এই তিনটি লক্ষণ একত্রে থাকলে একোনাইট নির্দেশিত।',
    'একোনাইটাম নেপেলাস একটি স্বল্পক্রিয় ওষুধ। তরুণ রোগে এর প্রয়োগ হয়। দীর্ঘকালীন রোগে এটি কম ব্যবহৃত হয়। শুষ্ক ঠান্ডা বাতাসে রোগের উৎপত্তি হলে এবং ভয়, উদ্বেগ ও অস্থিরতা বর্তমান থাকলে এই ওষুধ নির্বাচনযোগ্য।'
  ),
  (
    'a0000001-0002-4000-a002-000000000002',
    'এ্যাকটিয়া রেসিমোসা [Actea Racemosa]',
    'actea-racemosa',
    NULL,
    NULL,
    NULL,
    NULL,
    E'এ্যাকটিয়া রেসিমোসা একটি গুরুত্বপূর্ণ হোমিওপ্যাথি ওষুধ যা মূলত নারীদের বিভিন্ন রোগে ব্যবহৃত হয়। এটি বিশেষ করে ঋতুস্রাবজনিত সমস্যা, গর্ভাবস্থায় বিভিন্ন উপসর্গ এবং মানসিক অবসাদে কার্যকর।\n\nএই ওষুধের প্রধান বৈশিষ্ট্য হলো পেশী ও স্নায়ুবিক ব্যথা, বিশেষত ঘাড় ও পিঠের ব্যথায় এটি অত্যন্ত কার্যকর। রোগী সাধারণত উদ্বিগ্ন ও অস্থির থাকে এবং ঠান্ডায় রোগ বৃদ্ধি পায়।'
  ),
  ('a0000001-0003-4000-a003-000000000003', 'Allium Cepa', 'allium-cepa', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0004-4000-a004-000000000004', 'Antimonium Tartaricum', 'antimonium-tartaricum', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0005-4000-a005-000000000005', 'Apis Mellifica', 'apis-mellifica', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0006-4000-a006-000000000006', 'Argentum Nitricum', 'argentum-nitricum', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0007-4000-a007-000000000007', 'Arnica Montana', 'arnica-montana', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0008-4000-a008-000000000008', 'Arsenicum Album', 'arsenicum-album', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0009-4000-a009-000000000009', 'Belladonna', 'belladonna', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0010-4000-a010-000000000010', 'Bryonia Alba', 'bryonia-alba', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0011-4000-a011-000000000011', 'Calcarea Carbonica', 'calcarea-carbonica', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0012-4000-a012-000000000012', 'Chamomilla', 'chamomilla', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0013-4000-a013-000000000013', 'China Officinalis', 'china-officinalis', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0014-4000-a014-000000000014', 'Gelsemium', 'gelsemium', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0015-4000-a015-000000000015', 'Ignatia Amara', 'ignatia-amara', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0016-4000-a016-000000000016', 'Lycopodium', 'lycopodium', NULL, NULL, NULL, NULL, NULL),
  ('a0000001-0017-4000-a017-000000000017', 'Nux Vomica', 'nux-vomica', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE
-- ============================================
