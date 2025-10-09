-- Add item_description column to transaction_splits table
ALTER TABLE transaction_splits
ADD COLUMN item_description TEXT;

-- Update existing records to have a default description
UPDATE transaction_splits
SET item_description = 'Món hàng'
WHERE item_description IS NULL;
