-- Fix varchar(10) constraint issue for state columns
-- Some state names are longer than 10 characters (e.g., "Massachusetts", "Pennsylvania")

-- Update summary_cache table
ALTER TABLE forecast_cache.summary_cache
ALTER COLUMN state TYPE VARCHAR(50);

-- Update timeseries_cache table
ALTER TABLE forecast_cache.timeseries_cache
ALTER COLUMN state TYPE VARCHAR(50);

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'forecast_cache'
    AND column_name = 'state';
