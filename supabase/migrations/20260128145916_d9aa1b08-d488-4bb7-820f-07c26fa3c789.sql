-- Add unique constraint for trading_pnl upserts
ALTER TABLE public.trading_pnl 
ADD CONSTRAINT trading_pnl_user_date_unique UNIQUE (user_id, trade_date);
