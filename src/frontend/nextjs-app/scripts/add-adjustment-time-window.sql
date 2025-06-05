-- Add time window support to forecast_adjustments table
ALTER TABLE forecast_adjustments
ADD COLUMN IF NOT EXISTS adjustment_start_date DATE,
ADD COLUMN IF NOT EXISTS adjustment_end_date DATE;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_date_range
ON forecast_adjustments(adjustment_start_date, adjustment_end_date)
WHERE adjustment_start_date IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN forecast_adjustments.adjustment_start_date IS 'Start date for time-window specific adjustments';
COMMENT ON COLUMN forecast_adjustments.adjustment_end_date IS 'End date for time-window specific adjustments';
