
-- Marketplace listings table
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  seller_username TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('ore', 'refined', 'ingot', 'item')),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit BIGINT NOT NULL CHECK (price_per_unit > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (active = true);

-- Sellers can insert their own listings
CREATE POLICY "Users can create own listings"
  ON public.marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update/delete their own listings
CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Enable realtime for marketplace
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
