-- Add settlement_status column to track payment request status
alter table public.transaction_splits
add column if not exists settlement_status text default 'settled' check (settlement_status in ('pending', 'confirmed', 'settled'));

-- Update existing settled records
update public.transaction_splits
set settlement_status = 'settled'
where is_settled = true;

-- Update existing unsettled records
update public.transaction_splits
set settlement_status = 'pending'
where is_settled = false;
