-- Clear all transaction data (keeps user accounts)
-- This will delete all transactions and splits but keep user profiles

DELETE FROM transaction_splits;
DELETE FROM transactions;

-- Reset the sequences (optional, for clean IDs)
ALTER SEQUENCE transaction_splits_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
