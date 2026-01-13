-- Change payment_methods table structure to allow duplicate IDs across admin groups
-- but enforce uniqueness within each admin group

-- Step 1: Add a new UUID primary key column
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS uuid_id uuid DEFAULT gen_random_uuid();

-- Step 2: Populate uuid_id for existing rows
UPDATE payment_methods
SET uuid_id = gen_random_uuid()
WHERE uuid_id IS NULL;

-- Step 3: Make uuid_id NOT NULL
ALTER TABLE payment_methods
ALTER COLUMN uuid_id SET NOT NULL;

-- Step 4: Drop the existing primary key constraint on 'id'
ALTER TABLE payment_methods
DROP CONSTRAINT IF EXISTS payment_methods_pkey;

-- Step 5: Set uuid_id as the new primary key
ALTER TABLE payment_methods
ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (uuid_id);

-- Step 5.5: Ensure admin_name is NOT NULL (set any NULLs to 'Old' first)
UPDATE payment_methods SET admin_name = 'Old' WHERE admin_name IS NULL;
ALTER TABLE payment_methods
ALTER COLUMN admin_name SET NOT NULL;

-- Step 6: Create a composite unique constraint on (admin_name, id)
-- This ensures that within each admin group, IDs are unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_admin_name_id_unique
ON payment_methods(admin_name, id);

-- Step 7: Create an index on 'id' for faster lookups (since we still query by it)
CREATE INDEX IF NOT EXISTS idx_payment_methods_id ON payment_methods(id);
