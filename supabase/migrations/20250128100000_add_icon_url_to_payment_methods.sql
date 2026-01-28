-- Add icon_url to payment_methods for custom payment icons (displayed on checkout and admin)
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS icon_url text;

COMMENT ON COLUMN payment_methods.icon_url IS 'Optional URL of uploaded payment icon image (e.g. GCash, Maya logo).';
