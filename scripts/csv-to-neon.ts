#!/usr/bin/env node
import { Pool } from 'pg';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const BATCH_SIZE = 1000; // Insert 1000 rows at a time

interface ForecastRecord {
  restaurant_id: number;
  inventory_item_id: number;
  business_date: string;
  dma_id: string;
  dc_id: number;
  state: string;
  y_05: number;
  y_50: number;
  y_95: number;
}

class CSVToNeonLoader {
  private pgPool: Pool;
  private totalRows = 0;
  private batches: ForecastRecord[][] = [];
  private currentBatch: ForecastRecord[] = [];

  constructor(connectionString: string) {
    this.pgPool = new Pool({ connectionString });
  }

  async load(csvPath: string) {
    console.log('🚀 Starting CSV to Neon import...');

    try {
      // 1. Create table
      await this.createTable();

      // 2. Process CSV file
      await this.processCSV(csvPath);

      // 3. Insert remaining batch
      if (this.currentBatch.length > 0) {
        await this.insertBatch(this.currentBatch);
      }

      // 4. Create indexes
      await this.createIndexes();

      // 5. Get final count
      const result = await this.pgPool.query('SELECT COUNT(*) as count FROM forecast_data');
      console.log(`✅ Import completed! Total records: ${result.rows[0].count}`);

    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    } finally {
      await this.pgPool.end();
    }
  }

  private async createTable() {
    console.log('📋 Creating table...');

    await this.pgPool.query(`
      DROP TABLE IF EXISTS forecast_data CASCADE;

      CREATE TABLE forecast_data (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL,
        inventory_item_id INTEGER NOT NULL,
        business_date DATE NOT NULL,
        dma_id VARCHAR(50),
        dc_id INTEGER,
        state VARCHAR(2) NOT NULL,
        y_05 DECIMAL(10, 2),
        y_50 DECIMAL(10, 2) NOT NULL,
        y_95 DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Table created successfully');
  }

  private async processCSV(csvPath: string) {
    console.log('📄 Processing CSV file...');

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Cast numeric columns
        if (['restaurant_id', 'inventory_item_id', 'dc_id'].includes(context.column as string)) {
          return value ? parseInt(value) : null;
        }
        if (['y_05', 'y_50', 'y_95'].includes(context.column as string)) {
          return value ? parseFloat(value) : null;
        }
        return value;
      }
    });

    const batchProcessor = new Transform({
      objectMode: true,
      transform: async (record: ForecastRecord, encoding, callback) => {
        this.currentBatch.push(record);
        this.totalRows++;

        if (this.currentBatch.length >= BATCH_SIZE) {
          try {
            await this.insertBatch(this.currentBatch);
            this.currentBatch = [];

            if (this.totalRows % 10000 === 0) {
              console.log(`📊 Processed ${this.totalRows.toLocaleString()} rows...`);
            }
          } catch (error) {
            return callback(error as Error);
          }
        }

        callback();
      }
    });

    await pipeline(
      createReadStream(csvPath),
      parser,
      batchProcessor
    );
  }

  private async insertBatch(records: ForecastRecord[]) {
    if (records.length === 0) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    records.forEach((record, index) => {
      const baseIndex = index * 9;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9})`
      );

      values.push(
        record.restaurant_id,
        record.inventory_item_id,
        record.business_date,
        record.dma_id,
        record.dc_id,
        record.state,
        record.y_05,
        record.y_50,
        record.y_95
      );
    });

    const query = `
      INSERT INTO forecast_data (
        restaurant_id, inventory_item_id, business_date,
        dma_id, dc_id, state, y_05, y_50, y_95
      ) VALUES ${placeholders.join(', ')}
    `;

    await this.pgPool.query(query, values);
  }

  private async createIndexes() {
    console.log('🔨 Creating indexes...');

    const indexes = [
      'CREATE INDEX idx_forecast_date ON forecast_data(business_date)',
      'CREATE INDEX idx_forecast_restaurant ON forecast_data(restaurant_id)',
      'CREATE INDEX idx_forecast_item ON forecast_data(inventory_item_id)',
      'CREATE INDEX idx_forecast_state ON forecast_data(state)',
      'CREATE INDEX idx_forecast_composite ON forecast_data(business_date, restaurant_id, inventory_item_id)'
    ];

    for (const idx of indexes) {
      console.log(`  Creating index: ${idx.split(' ')[2]}...`);
      await this.pgPool.query(idx);
    }

    console.log('✅ Indexes created successfully');
  }
}

// Main execution
if (require.main === module) {
  const connectionString = process.env.DATABASE_URL || '';
  const csvPath = process.env.CSV_PATH || '/workspaces/wyatt-personal-aws/data/forecast_data.csv';

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const loader = new CSVToNeonLoader(connectionString);

  loader.load(csvPath)
    .then(() => {
      console.log('🎉 CSV import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 CSV import failed:', error);
      process.exit(1);
    });
}
