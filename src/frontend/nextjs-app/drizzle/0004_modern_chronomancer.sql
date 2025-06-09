CREATE TABLE "dashboard_forecast_view" (
	"restaurant_id" integer,
	"inventory_item_id" integer,
	"business_date" date,
	"dma_id" varchar(50),
	"dc_id" integer,
	"state" varchar(50),
	"y_05" numeric(10, 2),
	"y_50" numeric(10, 2),
	"y_95" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "forecast_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"business_date" date NOT NULL,
	"dma_id" varchar(50),
	"dc_id" integer,
	"state" varchar(50),
	"y_05" numeric(10, 2),
	"y_50" numeric(10, 2),
	"y_95" numeric(10, 2)
);
--> statement-breakpoint
CREATE INDEX "idx_forecast_business_date" ON "forecast_data" USING btree ("business_date");--> statement-breakpoint
CREATE INDEX "idx_forecast_inventory_item" ON "forecast_data" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_state" ON "forecast_data" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_forecast_dma" ON "forecast_data" USING btree ("dma_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_dc" ON "forecast_data" USING btree ("dc_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_composite" ON "forecast_data" USING btree ("inventory_item_id","business_date","state","dma_id");
