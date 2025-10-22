-- Add settlement_status column to track payment request status
alter table public.transaction_splits
add column if not exists settlement_status text default 'confirmed' check (settlement_status in ('pending', 'confirmed', 'settled'));

-- Update existing settled records
update public.transaction_splits
set settlement_status = 'settled'
where is_settled = true;

-- Update existing unsettled records to confirmed (not pending, since they haven't been requested yet)
update public.transaction_splits
set settlement_status = 'confirmed'
where is_settled = false;
