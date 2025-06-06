CREATE SCHEMA "forecast_cache";
--> statement-breakpoint
CREATE TABLE "forecast_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"adjustment_value" numeric(5, 2) NOT NULL,
	"filter_context" jsonb NOT NULL,
	"inventory_item_name" varchar(255),
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"user_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_cache"."cache_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_cache"."query_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_fingerprint" varchar(64) NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"execution_time_ms" integer NOT NULL,
	"data_source" varchar(20) NOT NULL,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"error_occurred" boolean DEFAULT false NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(255),
	"filters" jsonb
);
--> statement-breakpoint
CREATE TABLE "forecast_cache"."summary_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" varchar(255) NOT NULL,
	"query_fingerprint" varchar(64) NOT NULL,
	"state" varchar(50),
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "summary_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "forecast_cache"."timeseries_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" varchar(255) NOT NULL,
	"query_fingerprint" varchar(64) NOT NULL,
	"state" varchar(50),
	"start_date" date,
	"end_date" date,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "timeseries_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"has_seen_welcome" boolean DEFAULT false NOT NULL,
	"has_completed_tour" boolean DEFAULT false NOT NULL,
	"tour_progress" json DEFAULT '{}'::json NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"tooltips_enabled" boolean DEFAULT true NOT NULL,
	"preferred_help_format" varchar(20) DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "migrations" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_created_at" ON "forecast_adjustments" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_inventory_item" ON "forecast_adjustments" USING btree ("inventory_item_name");--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_filter_context" ON "forecast_adjustments" USING gin ("filter_context");--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_user_id" ON "forecast_adjustments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_is_active" ON "forecast_adjustments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_forecast_adjustments_user_email" ON "forecast_adjustments" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "idx_metadata_metric_name" ON "forecast_cache"."cache_metadata" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "idx_metadata_category" ON "forecast_cache"."cache_metadata" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_metrics_fingerprint" ON "forecast_cache"."query_metrics" USING btree ("query_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_metrics_executed_at" ON "forecast_cache"."query_metrics" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "idx_metrics_data_source" ON "forecast_cache"."query_metrics" USING btree ("data_source");--> statement-breakpoint
CREATE INDEX "idx_metrics_cache_hit" ON "forecast_cache"."query_metrics" USING btree ("cache_hit");--> statement-breakpoint
CREATE INDEX "idx_summary_cache_key" ON "forecast_cache"."summary_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "idx_summary_fingerprint" ON "forecast_cache"."summary_cache" USING btree ("query_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_summary_expires" ON "forecast_cache"."summary_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_summary_state" ON "forecast_cache"."summary_cache" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_timeseries_cache_key" ON "forecast_cache"."timeseries_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "idx_timeseries_fingerprint" ON "forecast_cache"."timeseries_cache" USING btree ("query_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_timeseries_expires" ON "forecast_cache"."timeseries_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_timeseries_dates" ON "forecast_cache"."timeseries_cache" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_timeseries_state" ON "forecast_cache"."timeseries_cache" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_onboarding" ON "user_preferences" USING btree ("has_seen_welcome","has_completed_tour");
