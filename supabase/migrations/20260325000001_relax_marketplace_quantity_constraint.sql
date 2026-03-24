-- Relax marketplace_listings quantity check to allow 0.
-- This is necessary for the 'buy_marketplace_item' RPC to correctly 
-- set quantity to 0 when a listing is fully purchased.

ALTER TABLE public.marketplace_listings 
DROP CONSTRAINT IF EXISTS marketplace_listings_quantity_check;

ALTER TABLE public.marketplace_listings 
ADD CONSTRAINT marketplace_listings_quantity_check 
CHECK (quantity >= 0);
