# schema
restaurant_id: string "5 integers 0 left pad between 00000 and 30000"
inventory_item_id: string "integer between 1 and 2000"
business_date: date "utc date between 2025-01-01 and 2025-03-31
dma_id: string "3 letter code"
dc_id: string "integer between 1 to 60"
state: string "US state abreviation"
y_05: float "lower tail sales prediction"
y_50: float "most likely sales prediction"
y_95: float "upper tail sales prediction"

# data statistics
restaurant_id has 2750 unique ids
inventory_item_id has 5 unique ids
business_date has daily for 10 weeks
dma_id has 30 unique ids and each restaurant is assigned a specific dma_id and it doesnt change
dc_id has 60 unique ids and each restaurant is assigned a specific dc_id and it doesnt change
state has 5 unique ids and each restaurant is assigned a specific state and it doesnt change

# forecast data
each restaurant_id has a random effect that is drawn from a normal distribution
each inventory_item_id has a constant effect that is drawn from a gamma distribution with mean of 20
there is a smooth fourier day of week effect where tuesday has the lowest negative effect and saturday has the highest positive effect
for each inventory_item_id there is an exponential decay for how much y_50 in the aggregate decreases after the first day in the dataset. the decay effect is drawn from a gamma distribution with mean .95 which means that in the aggregate day 2 has 95% as much sales as day 1
there is no effect from state, dma, or dc_id
error effect is a random normal distribution that represents a white noise effect

y_05: float "lower tail sales prediction representing the 5th quantile of the probablistic forecast"
y_50: float "most likely sales prediction representing the 50th quantile of the probablistic forecast"
y_95: float "upper tail sales prediction representing the 95th quantile of the probablistic forecast"

# implementation
use a seed for reproducibility
use scipy for distributions
simulate this data using polars to generate a df_sim where the data generated process is simulated and each simulation gets a simulation_id. The model parameters should not be redrawn between simulations. conduct 1000 simulations.
The number of rows in df_sim should equal n_restaurant_id * n_inventory_item_id * n_business_days * n_simulation_id
use the simulations to generate the y_05, y_50, and y_95 based on the draws from the simulation
