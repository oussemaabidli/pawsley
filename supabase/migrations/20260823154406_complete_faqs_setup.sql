-- 1. Create the faqs table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow anyone to view the FAQs if they are visible, or if the user is an admin
CREATE POLICY "faqs public read" ON public.faqs
  FOR SELECT USING (visible OR public.is_admin());

-- Allow admins to manage everything
CREATE POLICY "faqs admin all" ON public.faqs
  FOR ALL USING (public.is_admin());

-- 4. Seed Data
INSERT INTO public.faqs (question, answer, sort_order) VALUES 
('How long does shipping take?', 'Standard shipping is 3-5 business days. Express is 1-2 business days.', 1),
('What is your return policy?', 'We accept returns within 30 days of delivery for unused items in original condition.', 2),
('Do you ship internationally?', 'Yes - international shipping rates are calculated at checkout.', 3),
('Are your materials safe for pets?', 'Every material is pet-safe and independently tested.', 4);
