-- Change amount columns from numeric(10,2) to integer
alter table public.transactions
  alter column total_amount type integer using total_amount::integer;

alter table public.transaction_splits
  alter column amount type integer using amount::integer;
