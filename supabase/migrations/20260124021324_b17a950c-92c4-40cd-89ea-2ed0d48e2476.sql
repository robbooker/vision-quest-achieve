-- Create trading P&L table for tracking daily profit/loss
CREATE TABLE public.trading_pnl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trade_date date NOT NULL,
  pnl_amount numeric NOT NULL,
  trade_count integer DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, trade_date)
);

-- Enable RLS
ALTER TABLE public.trading_pnl ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own P&L"
  ON public.trading_pnl FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own P&L"
  ON public.trading_pnl FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own P&L"
  ON public.trading_pnl FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own P&L"
  ON public.trading_pnl FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trading_pnl_updated_at
  BEFORE UPDATE ON public.trading_pnl
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();