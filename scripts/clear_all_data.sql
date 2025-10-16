-- Clear ALL data including user profiles
-- WARNING: This will delete everything except auth.users

DELETE FROM transaction_splits;
DELETE FROM transactions;
DELETE FROM profiles;

-- Reset the sequences
ALTER SEQUENCE transaction_splits_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
