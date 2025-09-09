-- Fix RLS policies to allow updates for order management
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public order creation" ON public.orders;
DROP POLICY IF EXISTS "Allow public order reading" ON public.orders;

-- Allow anyone to insert orders (for checkout)
CREATE POLICY "Allow public order creation" ON public.orders
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read orders
CREATE POLICY "Allow public order reading" ON public.orders
  FOR SELECT 
  USING (true);

-- Allow updates to orders (needed for payment status updates)
CREATE POLICY "Allow public order updates" ON public.orders
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);
