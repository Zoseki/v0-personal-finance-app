-- Add image_url column to transaction_splits table
ALTER TABLE transaction_splits
ADD COLUMN image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN transaction_splits.image_url IS 'URL of the uploaded image (receipt, proof of purchase, etc.)';
