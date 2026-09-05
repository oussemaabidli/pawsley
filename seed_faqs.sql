-- Seed Data for FAQs
-- Uses ON CONFLICT to ensure we don't duplicate these if run multiple times.
-- Make sure to run this in your Supabase SQL Editor.

INSERT INTO public.faqs (id, question, answer, sort_order, visible)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    'What materials do you use for your collars and leashes?',
    'We use only the highest quality materials, including premium top-grain leather, durable solid brass hardware, and specialized water-resistant fabrics for our adventure line.',
    10,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'How do I measure my dog for the perfect fit?',
    'Use a soft measuring tape and measure comfortably around your dog''s neck where the collar would normally sit. You should be able to slide two fingers between the collar and your dog''s neck. Please refer to our size guide on each product page for specific measurements.',
    20,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Are your products machine washable?',
    'Our fabric and nylon products can be machine washed on a gentle cycle in a wash bag. However, our leather products should never be machine washed. Simply wipe them down with a damp cloth and use leather conditioner occasionally to maintain their suppleness.',
    30,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Do you offer international shipping?',
    'Yes, we ship globally! Shipping costs and delivery times vary depending on the destination and will be calculated at checkout.',
    40,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'What is your return policy?',
    'We accept returns within 30 days of purchase for unused items in their original packaging. Custom or personalized items are final sale. Please contact our support team to initiate a return.',
    50,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order,
  visible = EXCLUDED.visible;
