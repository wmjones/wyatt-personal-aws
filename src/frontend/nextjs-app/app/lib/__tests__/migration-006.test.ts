/**
 * Test for migration 006 - add_adjustment_time_window_columns
 * This test verifies the migration syntax and structure
 */
import { migrations } from '../migrations';

describe('Migration 006 - Adjustment Time Window Columns', () => {
  const migration006 = migrations.find(m => m.id === '006');

  it('should exist and have correct structure', () => {
    expect(migration006).toBeDefined();
    expect(migration006?.id).toBe('006');
    expect(migration006?.name).toBe('add_adjustment_time_window_columns');
    expect(migration006?.up).toBeDefined();
    expect(migration006?.down).toBeDefined();
  });

  it('should have correct up migration SQL', () => {
    const upSQL = migration006?.up;

    // Check for ADD COLUMN statements
    expect(upSQL).toContain('ALTER TABLE forecast_adjustments');
    expect(upSQL).toContain('ADD COLUMN IF NOT EXISTS adjustment_start_date DATE');
    expect(upSQL).toContain('ADD COLUMN IF NOT EXISTS adjustment_end_date DATE');

    // Check for index creation
    expect(upSQL).toContain('CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_date_range');
    expect(upSQL).toContain('ON forecast_adjustments(adjustment_start_date, adjustment_end_date)');
    expect(upSQL).toContain('WHERE adjustment_start_date IS NOT NULL');

    // Check for documentation comments
    expect(upSQL).toContain('COMMENT ON COLUMN forecast_adjustments.adjustment_start_date');
    expect(upSQL).toContain('COMMENT ON COLUMN forecast_adjustments.adjustment_end_date');
  });

  it('should have correct down migration SQL', () => {
    const downSQL = migration006?.down;

    // Check for index removal (should come before column removal)
    expect(downSQL).toContain('DROP INDEX IF EXISTS idx_forecast_adjustments_date_range');

    // Check for column removal
    expect(downSQL).toContain('ALTER TABLE forecast_adjustments');
    expect(downSQL).toContain('DROP COLUMN IF EXISTS adjustment_start_date');
    expect(downSQL).toContain('DROP COLUMN IF EXISTS adjustment_end_date');

    // Verify order: index dropped before columns
    const indexDropPos = downSQL?.indexOf('DROP INDEX') || 0;
    const columnDropPos = downSQL?.indexOf('DROP COLUMN') || 0;
    expect(indexDropPos).toBeLessThan(columnDropPos);
  });

  it('should use IF NOT EXISTS/IF EXISTS for idempotency', () => {
    const upSQL = migration006?.up;
    const downSQL = migration006?.down;

    // Up migration should use IF NOT EXISTS
    expect(upSQL).toContain('ADD COLUMN IF NOT EXISTS');
    expect(upSQL).toContain('CREATE INDEX IF NOT EXISTS');

    // Down migration should use IF EXISTS
    expect(downSQL).toContain('DROP INDEX IF EXISTS');
    expect(downSQL).toContain('DROP COLUMN IF EXISTS');
  });

  it('should be properly positioned in migration sequence', () => {
    const migration005 = migrations.find(m => m.id === '005');
    const migration007 = migrations.find(m => m.id === '007');

    // Should come after migration 005
    expect(migration005).toBeDefined();

    // Should be the latest migration (007 shouldn't exist yet)
    expect(migration007).toBeUndefined();

    // Verify migrations are in order
    const migrationIds = migrations.map(m => m.id);
    const sorted = [...migrationIds].sort();
    expect(migrationIds).toEqual(sorted);
  });

  it('should follow migration naming conventions', () => {
    expect(migration006?.id).toMatch(/^\d{3}$/); // Three digit format
    expect(migration006?.name).toMatch(/^[a-z_]+$/); // Lowercase with underscores
    expect(migration006?.name).not.toContain(' '); // No spaces
  });
});
