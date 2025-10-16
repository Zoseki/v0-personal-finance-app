-- Complete reset - deletes everything including auth users
-- WARNING: This will delete ALL users and data

-- Delete transaction data
DELETE FROM transaction_splits;
DELETE FROM transactions;
DELETE FROM profiles;

-- Delete auth users (this will cascade delete everything)
DELETE FROM auth.users;

-- Reset sequences
ALTER SEQUENCE transaction_splits_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
