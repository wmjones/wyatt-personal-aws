#!/usr/bin/env python3
"""
Generate forecast data according to the data simulation requirements.

Requirements:
- Date range: 2025-01-01 to 2025-04-01 (10 weeks of daily data)
- 2750 unique restaurant IDs (00000-30000)
- 5 unique inventory item IDs (1-2000)
- 30 unique DMA IDs (3-letter codes)
- 60 unique DC IDs (1-60)
- 5 unique states (US state abbreviations)
"""

import pandas as pd
import numpy as np
from datetime import datetime

# Set seed for reproducibility
np.random.seed(42)

# Configuration from requirements
N_RESTAURANTS = 2750
N_INVENTORY_ITEMS = 5
N_SIMULATIONS = 1000
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 4, 1)

# Generate date range (daily for 10 weeks)
date_range = pd.date_range(start=START_DATE, end=END_DATE, freq="D")
n_days = len(date_range)

print(f"Generating data for {n_days} days from {START_DATE.date()} to {END_DATE.date()}")

# Generate restaurant IDs (5 digits, zero-padded between 00000 and 30000)
restaurant_ids = np.random.choice(range(30001), size=N_RESTAURANTS, replace=False)
restaurant_ids = [f"{rid:05d}" for rid in sorted(restaurant_ids)]

# Generate inventory item IDs (5 unique from range 1-2000)
inventory_item_ids = sorted(np.random.choice(range(1, 2001), size=N_INVENTORY_ITEMS, replace=False))

# Generate DMA IDs (30 unique 3-letter codes)
dma_ids = []
for i in range(30):
    letters = "".join(np.random.choice(list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), size=3))
    dma_ids.append(letters)
dma_ids = sorted(list(set(dma_ids)))[:30]

# Generate DC IDs (60 unique from 1-60)
dc_ids = list(range(1, 61))

# 5 US states
states = ["CA", "TX", "FL", "NY", "IL"]

# Assign each restaurant to a specific DMA, DC, and state (they don't change)
restaurant_assignments = {}
for rid in restaurant_ids:
    restaurant_assignments[rid] = {"dma_id": np.random.choice(dma_ids), "dc_id": np.random.choice(dc_ids), "state": np.random.choice(states)}

# Generate model parameters
# Restaurant random effects (normal distribution)
restaurant_effects = {rid: np.random.normal(0, 1) for rid in restaurant_ids}

# Inventory item constant effects (gamma distribution with mean 20)
# Using shape=4, scale=5 to get mean=20
inventory_effects = {iid: np.random.gamma(4, 5) for iid in inventory_item_ids}

# Day of week effects (Fourier-based, Tuesday lowest, Saturday highest)
# 0=Monday, 1=Tuesday, ..., 5=Saturday, 6=Sunday
dow_effects = {0: -0.1, 1: -0.2, 2: -0.05, 3: 0.05, 4: 0.15, 5: 0.3, 6: 0.1}  # Monday  # Tuesday (lowest)  # Wednesday  # Thursday  # Friday  # Saturday (highest)  # Sunday

# Exponential decay effects for each inventory item (gamma with mean 0.95)
# Using shape=95, scale=0.01 to get mean≈0.95
decay_rates = {iid: np.random.gamma(95, 0.01) for iid in inventory_item_ids}

print("Generating forecast data...")

# Create the base dataframe
rows = []
for rid in restaurant_ids:
    for iid in inventory_item_ids:
        for day_idx, date in enumerate(date_range):
            # Get restaurant assignment
            assignment = restaurant_assignments[rid]

            # Base value from inventory effect
            base_value = inventory_effects[iid]

            # Add restaurant effect
            base_value += restaurant_effects[rid]

            # Add day of week effect
            dow = date.weekday()
            base_value *= 1 + dow_effects[dow]

            # Apply exponential decay
            decay = decay_rates[iid] ** day_idx
            base_value *= decay

            # Add white noise
            noise = np.random.normal(0, 0.1)
            base_value *= 1 + noise

            # Ensure positive values
            base_value = max(0.1, base_value)

            # Generate quantiles
            # y_50 is the base value
            y_50 = base_value

            # y_05 and y_95 are based on uncertainty
            # Using a coefficient of variation of 0.2
            std_dev = y_50 * 0.2
            y_05 = max(0.1, y_50 - 1.645 * std_dev)  # 5th percentile
            y_95 = y_50 + 1.645 * std_dev  # 95th percentile

            rows.append({"restaurant_id": int(rid), "inventory_item_id": int(iid), "business_date": date.strftime("%Y-%m-%d"), "dma_id": assignment["dma_id"], "dc_id": int(assignment["dc_id"]), "state": assignment["state"], "y_05": round(y_05, 2), "y_50": round(y_50, 2), "y_95": round(y_95, 2)})

# Create DataFrame
df = pd.DataFrame(rows)

# Save to CSV
output_path = "/workspaces/wyatt-personal-aws/data/forecast_data.csv"
df.to_csv(output_path, index=False)

print("\nForecast data generated successfully!")
print(f"Total rows: {len(df):,}")
print(f"Date range: {df['business_date'].min()} to {df['business_date'].max()}")
print(f"Unique restaurants: {df['restaurant_id'].nunique()}")
print(f"Unique inventory items: {df['inventory_item_id'].nunique()}")
print(f"File saved to: {output_path}")

# Display sample data
print("\nSample data (first 10 rows):")
print(df.head(10))
