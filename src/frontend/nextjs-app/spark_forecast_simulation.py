import numpy as np
from datetime import datetime, timedelta
import random

# PySpark imports
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, udf, percentile_approx, expr
from pyspark.sql.types import StructType, StructField, StringType, FloatType, IntegerType, ArrayType


def create_spark_session(app_name="ForecastSimulation"):
    """
    Create and configure a Spark session.

    Returns:
    - spark: Configured SparkSession object
    """
    # Create Spark session with Arrow optimization for Python UDFs
    spark = SparkSession.builder.appName(app_name).config("spark.sql.execution.arrow.pyspark.enabled", "true").config("spark.driver.memory", "8g").config("spark.executor.memory", "8g").getOrCreate()

    # Set log level to reduce verbosity
    spark.sparkContext.setLogLevel("WARN")

    return spark


def generate_base_data(spark, config):
    """
    Generate the base data for restaurant forecast simulations.

    Parameters:
    - spark: SparkSession object
    - config: Dictionary containing simulation parameters

    Returns:
    - base_df: Spark DataFrame with base data combinations
    - model_params: Dictionary of model parameters
    """
    # Extract configuration
    n_restaurants = config["n_restaurants"]
    n_inventory_items = config["n_inventory_items"]
    start_date = config["start_date"]
    end_date = config["end_date"]

    # Set seed for reproducibility
    random.seed(42)
    np.random.seed(42)

    # Generate restaurant IDs (5 digits, zero-padded between 00000 and 30000)
    restaurant_ids = []
    while len(restaurant_ids) < n_restaurants:
        new_id = f"{random.randint(0, 30000):05d}"
        if new_id not in restaurant_ids:
            restaurant_ids.append(new_id)

    # Generate inventory item IDs (integers between 1 and 2000)
    inventory_item_ids = [str(id) for id in random.sample(range(1, 2001), n_inventory_items)]

    # Generate business dates
    n_days = (end_date - start_date).days
    business_dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(n_days)]

    # Generate DMA IDs (3 letter codes - 30 unique)
    dma_ids = ["".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3)) for _ in range(30)]

    # Generate DC IDs (integers between 1 and 60)
    dc_ids = [str(i) for i in range(1, 61)]

    # Generate states (5 unique US state abbreviations)
    states = random.sample(["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"], 5)

    # Generate model parameters (drawn once and reused across simulations)
    # Restaurant random effects (normal distribution)
    restaurant_effects = {rest_id: np.random.normal(0, 1) for rest_id in restaurant_ids}

    # Item constant effects (gamma distribution with mean 20)
    item_effects = {item_id: np.random.gamma(20, 1) for item_id in inventory_item_ids}

    # Decay effects (uniform distribution between 0.95 and 0.995)
    decay_effects = {item_id: np.random.uniform(0.95, 0.995) for item_id in inventory_item_ids}
    print(f"decay_effects: {decay_effects}")

    # Assign DMA, DC, and state to each restaurant (these don't change)
    restaurant_dma = {rest_id: random.choice(dma_ids) for rest_id in restaurant_ids}
    restaurant_dc = {rest_id: random.choice(dc_ids) for rest_id in restaurant_ids}
    restaurant_state = {rest_id: random.choice(states) for rest_id in restaurant_ids}

    # Create combinations for the base data
    combinations = []
    for rest_id in restaurant_ids:
        for item_id in inventory_item_ids:
            for date in business_dates:
                combinations.append({"restaurant_id": rest_id, "inventory_item_id": item_id, "business_date": date, "dma_id": restaurant_dma[rest_id], "dc_id": restaurant_dc[rest_id], "state": restaurant_state[rest_id]})

    # Define schema for base DataFrame
    schema = StructType([StructField("restaurant_id", StringType(), False), StructField("inventory_item_id", StringType(), False), StructField("business_date", StringType(), False), StructField("dma_id", StringType(), False), StructField("dc_id", StringType(), False), StructField("state", StringType(), False)])

    # Create Spark DataFrame from combinations
    base_df = spark.createDataFrame(combinations, schema)

    # Store model parameters in dictionary
    model_params = {"restaurant_effects": restaurant_effects, "item_effects": item_effects, "decay_effects": decay_effects, "start_date": start_date}

    print(f"Created base dataframe with {base_df.count()} combinations")

    return base_df, model_params


def calculate_day_of_week_effect(date_str):
    """
    Calculate day of week effect for a given date.

    Parameters:
    - date_str: Date string in format "%Y-%m-%d"

    Returns:
    - day_of_week_effect: Float representing the day of week effect
    """
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    weekday = date_obj.weekday()  # 0=Monday, 1=Tuesday, ..., 6=Sunday

    # Adjust so Tuesday (1) is lowest and Saturday (5) is highest
    # Shift so Tuesday is at 0 in our function
    shifted_dow = (weekday - 1) % 7
    # Scale to cover a full cycle over 7 days
    angle = 2 * np.pi * shifted_dow / 7
    # Cosine will be minimum at 0 (Tuesday) and maximum at π (roughly Saturday)
    # Multiply by 7.5 to amplify the day of week effect
    return 7.5 * np.cos(angle)


def create_parameter_df(base_df, model_params):
    """
    Create a DataFrame with calculated parameters for each combination.

    Parameters:
    - base_df: Spark DataFrame with base data combinations
    - model_params: Dictionary of model parameters

    Returns:
    - param_df: Spark DataFrame with calculated parameters
    """
    # Extract model parameters
    restaurant_effects = model_params["restaurant_effects"]
    item_effects = model_params["item_effects"]
    decay_effects = model_params["decay_effects"]
    start_date = model_params["start_date"]

    # Create UDFs for parameter calculations
    @udf(returnType=FloatType())
    def calculate_restaurant_effect(rest_id):
        return float(restaurant_effects.get(rest_id, 0.0))

    @udf(returnType=FloatType())
    def calculate_item_effect(item_id):
        return float(item_effects.get(item_id, 0.0))

    @udf(returnType=FloatType())
    def calculate_decay_effect(item_id):
        return float(decay_effects.get(item_id, 0.95))

    @udf(returnType=FloatType())
    def calculate_dow_effect(date_str):
        return float(calculate_day_of_week_effect(date_str))

    @udf(returnType=IntegerType())
    def calculate_days_from_start(date_str):
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        return (date_obj - start_date.date()).days

    # Add parameter columns to the base DataFrame
    param_df = base_df.withColumn("rest_effect", calculate_restaurant_effect(col("restaurant_id"))).withColumn("item_effect", calculate_item_effect(col("inventory_item_id"))).withColumn("decay_effect", calculate_decay_effect(col("inventory_item_id"))).withColumn("dow_effect", calculate_dow_effect(col("business_date"))).withColumn("days_from_start", calculate_days_from_start(col("business_date")))

    # Calculate base value and decayed value
    param_df = param_df.withColumn("base_value", col("rest_effect") + col("item_effect") + col("dow_effect")).withColumn("decayed_value", col("base_value") * expr("pow(decay_effect, days_from_start)"))

    return param_df


def run_simulations(param_df, n_simulations=1000):
    """
    Run Monte Carlo simulations for each combination in parallel.

    Parameters:
    - param_df: Spark DataFrame with calculated parameters
    - n_simulations: Number of simulations to run per combination

    Returns:
    - forecast_df: Spark DataFrame with quantile forecasts
    - sample_sim_df: Spark DataFrame with sample simulations (for verification)
    """

    # Create UDF to generate simulations
    @udf(returnType=ArrayType(FloatType()))
    def generate_sales_simulations(decayed_value, n_sims=n_simulations, seed=42):
        # Set random seed based on hash of parameters to ensure different streams
        np.random.seed(seed)

        # Generate random noises and calculate sales values
        noises = np.random.normal(0, 1, size=n_sims)
        sales_values = np.maximum(0, decayed_value + noises)

        # Return array of sales values
        return [float(val) for val in sales_values]

    # Generate simulations for each combination
    sim_df = param_df.withColumn("sales_simulations", generate_sales_simulations(col("decayed_value")))

    # Cache the DataFrame to speed up subsequent operations
    sim_df.cache()

    # Create UDFs for quantile calculations
    @udf(returnType=FloatType())
    def calculate_quantile_05(sales_array):
        return float(np.percentile(sales_array, 5))

    @udf(returnType=FloatType())
    def calculate_quantile_50(sales_array):
        return float(np.percentile(sales_array, 50))

    @udf(returnType=FloatType())
    def calculate_quantile_95(sales_array):
        return float(np.percentile(sales_array, 95))

    # Calculate quantiles from simulations
    forecast_df = sim_df.withColumn("y_05", calculate_quantile_05(col("sales_simulations"))).withColumn("y_50", calculate_quantile_50(col("sales_simulations"))).withColumn("y_95", calculate_quantile_95(col("sales_simulations"))).select("restaurant_id", "inventory_item_id", "business_date", "dma_id", "dc_id", "state", "y_05", "y_50", "y_95")

    # Create a sample of simulations for verification (first 5 simulations for the first few combinations)
    # We'll use Spark SQL for this operation to explode the array of simulations
    sim_df.createOrReplaceTempView("simulations")

    sample_sim_df = spark.sql(
        """
        SELECT
            restaurant_id, inventory_item_id, business_date, dma_id, dc_id, state,
            pos AS simulation_id, sales_value
        FROM (
            SELECT
                restaurant_id, inventory_item_id, business_date, dma_id, dc_id, state,
                posexplode(slice(sales_simulations, 1, 5)) AS (pos, sales_value)
            FROM simulations
            LIMIT 5000
        )
    """
    )

    return forecast_df, sample_sim_df


def generate_forecast_data(spark):
    """
    Generate restaurant sales forecast data using Spark for distributed computation.

    Parameters:
    - spark: SparkSession object

    Returns:
    - forecast_df: Spark DataFrame with forecasted sales quantiles
    - sample_sim_df: Spark DataFrame with sample simulations (for verification)
    """
    # Set configuration parameters
    config = {"n_restaurants": 1, "n_inventory_items": 2, "n_simulations": 1000, "start_date": datetime(2025, 1, 1), "end_date": datetime(2025, 4, 1)}

    print(f"Generating forecast data with {config['n_restaurants']} restaurants, " + f"{config['n_inventory_items']} items, " + f"and {(config['end_date'] - config['start_date']).days} days...")
    print(f"Running {config['n_simulations']} simulations...")

    # Generate base data and model parameters
    base_df, model_params = generate_base_data(spark, config)

    # Calculate parameters for each combination
    param_df = create_parameter_df(base_df, model_params)

    # Run simulations in parallel
    forecast_df, sample_sim_df = run_simulations(param_df, config["n_simulations"])

    return forecast_df, sample_sim_df


def main():
    """Main function to generate and display data."""
    # Initialize Spark session
    spark = create_spark_session()

    try:
        # Generate the forecast data and simulations
        forecast_df, sample_sim_df = generate_forecast_data(spark)

        # Display sample of forecast data
        print("\nSample of forecast data:")
        forecast_df.show(5)

        # Display dimensions of the dataset
        n_restaurants = forecast_df.select("restaurant_id").distinct().count()
        n_items = forecast_df.select("inventory_item_id").distinct().count()
        n_dates = forecast_df.select("business_date").distinct().count()
        n_rows = forecast_df.count()

        print("\nDataset dimensions:")
        print(f"Number of restaurants: {n_restaurants}")
        print(f"Number of inventory items: {n_items}")
        print(f"Number of business dates: {n_dates}")
        print(f"Total rows in forecast: {n_rows}")
        print(f"Expected rows: {n_restaurants * n_items * n_dates}")

        # Display simulation data statistics
        if sample_sim_df is not None:
            n_simulations = sample_sim_df.select("simulation_id").distinct().count()
            print("\nSimulation summary:")
            print(f"Sample simulations stored: {sample_sim_df.count()} rows")
            print(f"Number of unique simulation IDs: {n_simulations}")

            # Calculate quantiles from simulations for verification
            sim_quantiles = sample_sim_df.groupBy("restaurant_id", "inventory_item_id", "business_date").agg(percentile_approx("sales_value", 0.05).alias("y_05_check"), percentile_approx("sales_value", 0.5).alias("y_50_check"), percentile_approx("sales_value", 0.95).alias("y_95_check"))

            print("\nQuantiles calculated from sample simulations (for verification):")
            sim_quantiles.show(5)

        # Save the data to temp views instead of Parquet files
        forecast_df.createOrReplaceTempView("forecast_results")
        print("\nForecast data saved to temp view 'forecast_results'")

        if sample_sim_df is not None:
            sample_sim_df.createOrReplaceTempView("simulation_samples")
            print("Sample simulation data saved to temp view 'simulation_samples'")

            # Also create a view for the quantiles for easy access
            sim_quantiles.createOrReplaceTempView("simulation_quantiles")
            print("Simulation quantiles saved to temp view 'simulation_quantiles'")

        # Show how to query the temp views with Spark SQL
        print("\nExample queries using temp views:")
        print("1. Query forecast results:")
        print('   spark.sql("SELECT * FROM forecast_results LIMIT 5").show()')
        print("2. Query simulation samples:")
        print('   spark.sql("SELECT * FROM simulation_samples LIMIT 5").show()')
        print("3. Query simulation quantiles:")
        print('   spark.sql("SELECT * FROM simulation_quantiles LIMIT 5").show()')

        return forecast_df, sample_sim_df

    finally:
        # Note: Temp views are only available during the Spark session
        print("\nNote: Temp views are only available during the current Spark session.")
        print("To persist the data, you can run:")
        print('   forecast_df.write.mode("overwrite").saveAsTable("permanent_forecast_results")')
        print('   sample_sim_df.write.mode("overwrite").saveAsTable("permanent_simulation_samples")')

        # Stop Spark session to release resources
        spark.stop()
        print("Spark session stopped.")


if __name__ == "__main__":
    main()
