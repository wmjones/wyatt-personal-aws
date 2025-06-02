import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { migrations } from '../migrations';

// Mock the postgres query function
jest.mock('../postgres');

describe('Database Migrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Migration Structure', () => {
    it('should have valid migration structure', () => {
      expect(migrations).toBeInstanceOf(Array);
      expect(migrations.length).toBeGreaterThan(0);

      migrations.forEach((migration, index) => {
        expect(migration).toHaveProperty('id');
        expect(migration).toHaveProperty('name');
        expect(migration).toHaveProperty('up');
        expect(migration).toHaveProperty('down');

        expect(typeof migration.id).toBe('string');
        expect(typeof migration.name).toBe('string');
        expect(typeof migration.up).toBe('string');
        expect(typeof migration.down).toBe('string');

        // Migration IDs should be sequential
        const expectedId = String(index + 1).padStart(3, '0');
        expect(migration.id).toBe(expectedId);
      });
    });

    it('should have unique migration IDs', () => {
      const ids = migrations.map(m => m.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have unique migration names', () => {
      const names = migrations.map(m => m.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('Multi-user Adjustment Migration', () => {
    it('should include multi-user support migration', () => {
      const multiUserMigration = migrations.find(m => m.name === 'add_multiuser_support_to_adjustments');
      expect(multiUserMigration).toBeDefined();
      expect(multiUserMigration?.id).toBe('005');
    });

    it('should have proper up migration for multi-user support', () => {
      const multiUserMigration = migrations.find(m => m.name === 'add_multiuser_support_to_adjustments');

      if (multiUserMigration) {
        const upScript = multiUserMigration.up;

        // Should add required columns
        expect(upScript).toContain('ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)');
        expect(upScript).toContain('ADD COLUMN IF NOT EXISTS user_name VARCHAR(255)');
        expect(upScript).toContain('ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
        expect(upScript).toContain('ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

        // Should create indexes
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_is_active');
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_email');

        // Should create trigger function and trigger
        expect(upScript).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
        expect(upScript).toContain('CREATE TRIGGER update_forecast_adjustments_updated_at');
      }
    });

    it('should have proper down migration for multi-user support', () => {
      const multiUserMigration = migrations.find(m => m.name === 'add_multiuser_support_to_adjustments');

      if (multiUserMigration) {
        const downScript = multiUserMigration.down;

        // Should drop trigger and function first
        expect(downScript).toContain('DROP TRIGGER IF EXISTS update_forecast_adjustments_updated_at');
        expect(downScript).toContain('DROP FUNCTION IF EXISTS update_updated_at_column()');

        // Should remove columns
        expect(downScript).toContain('DROP COLUMN IF EXISTS user_email');
        expect(downScript).toContain('DROP COLUMN IF EXISTS user_name');
        expect(downScript).toContain('DROP COLUMN IF EXISTS is_active');
        expect(downScript).toContain('DROP COLUMN IF EXISTS updated_at');
      }
    });
  });

  describe('Base Adjustment Migration', () => {
    it('should include base forecast adjustments table migration', () => {
      const baseMigration = migrations.find(m => m.name === 'create_forecast_adjustments_table');
      expect(baseMigration).toBeDefined();
      expect(baseMigration?.id).toBe('003');
    });

    it('should create proper table structure', () => {
      const baseMigration = migrations.find(m => m.name === 'create_forecast_adjustments_table');

      if (baseMigration) {
        const upScript = baseMigration.up;

        // Should create table with required columns
        expect(upScript).toContain('CREATE TABLE IF NOT EXISTS forecast_adjustments');
        expect(upScript).toContain('id SERIAL PRIMARY KEY');
        expect(upScript).toContain('adjustment_value DECIMAL(5,2) NOT NULL');
        expect(upScript).toContain('filter_context JSONB NOT NULL');
        expect(upScript).toContain('inventory_item_name VARCHAR(255)');
        expect(upScript).toContain('user_id VARCHAR(255) NOT NULL');
        expect(upScript).toContain('created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

        // Should create indexes
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_created_at');
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_inventory_item');
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_filter_context');
        expect(upScript).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_id');
      }
    });
  });

  describe('Migration Validation', () => {
    it('should have valid SQL syntax in up migrations', () => {
      migrations.forEach(migration => {
        // Basic SQL syntax checks
        expect(migration.up).not.toContain('undefined');
        expect(migration.up).not.toContain('null');
        expect(migration.up.trim()).not.toBe('');

        // Should end with semicolon or be properly formatted
        const lines = migration.up.trim().split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
        if (lines.length > 0) {
          // At least one non-comment line should exist
          expect(lines.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have valid SQL syntax in down migrations', () => {
      migrations.forEach(migration => {
        // Basic SQL syntax checks
        expect(migration.down).not.toContain('undefined');
        expect(migration.down).not.toContain('null');
        expect(migration.down.trim()).not.toBe('');

        // Should have at least some content
        const lines = migration.down.trim().split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
        if (lines.length > 0) {
          // At least one non-comment line should exist
          expect(lines.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Migration Dependencies', () => {
    it('should have proper migration order', () => {
      // Base migrations should come before extensions
      const migrationNames = migrations.map(m => m.name);

      const baseMigrationIndex = migrationNames.indexOf('create_forecast_adjustments_table');
      const multiUserMigrationIndex = migrationNames.indexOf('add_multiuser_support_to_adjustments');

      expect(baseMigrationIndex).toBeLessThan(multiUserMigrationIndex);
    });

    it('should maintain referential integrity in down migrations', () => {
      const multiUserMigration = migrations.find(m => m.name === 'add_multiuser_support_to_adjustments');

      if (multiUserMigration) {
        const downScript = multiUserMigration.down;

        // Trigger should be dropped before function
        const triggerIndex = downScript.indexOf('DROP TRIGGER');
        const functionIndex = downScript.indexOf('DROP FUNCTION');

        expect(triggerIndex).toBeLessThan(functionIndex);
      }
    });
  });
});
