CREATE TABLE "tmp_drizzle_test" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_name" varchar(255) NOT NULL,
	"test_value" varchar(1000),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
