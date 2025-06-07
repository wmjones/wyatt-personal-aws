ALTER TABLE "forecast_adjustments" ADD COLUMN "adjustment_start_date" date;--> statement-breakpoint
ALTER TABLE "forecast_adjustments" ADD COLUMN "adjustment_end_date" date;--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_date_range" ON "forecast_adjustments" USING btree ("adjustment_start_date","adjustment_end_date") WHERE adjustment_start_date IS NOT NULL;
