/**
 * Unit tests for adjustment validation logic
 */

// Validation helper functions
export const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
  }
  
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
  
  return { start, end };
};

export const validateAdjustmentDateRange = (
  adjustmentStart: string,
  adjustmentEnd: string,
  mainStart: string,
  mainEnd: string
) => {
  const { start: adjStart, end: adjEnd } = validateDateRange(adjustmentStart, adjustmentEnd);
  const { start: mainStartDate, end: mainEndDate } = validateDateRange(mainStart, mainEnd);
  
  if (adjStart < mainStartDate || adjEnd > mainEndDate) {
    throw new Error('Adjustment date range must be within the main filter date range');
  }
  
  return { adjStart, adjEnd };
};

// Tests
describe('Date Range Validation', () => {
  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      expect(() => validateDateRange('2025-01-01', '2025-03-31')).not.toThrow();
    });

    it('should reject invalid date formats', () => {
      expect(() => validateDateRange('invalid', '2025-03-31')).toThrow('Invalid date format');
      expect(() => validateDateRange('2025-01-01', 'invalid')).toThrow('Invalid date format');
    });

    it('should reject when start date is after end date', () => {
      expect(() => validateDateRange('2025-03-31', '2025-01-01')).toThrow('Start date must be before end date');
    });

    it('should reject when start date equals end date', () => {
      expect(() => validateDateRange('2025-01-01', '2025-01-01')).toThrow('Start date must be before end date');
    });
  });

  describe('validateAdjustmentDateRange', () => {
    const mainStart = '2025-01-01';
    const mainEnd = '2025-03-31';

    it('should validate adjustment range within main range', () => {
      expect(() => validateAdjustmentDateRange(
        '2025-01-15', '2025-02-15', mainStart, mainEnd
      )).not.toThrow();
    });

    it('should reject adjustment range starting before main range', () => {
      expect(() => validateAdjustmentDateRange(
        '2024-12-01', '2025-02-15', mainStart, mainEnd
      )).toThrow('Adjustment date range must be within the main filter date range');
    });

    it('should reject adjustment range ending after main range', () => {
      expect(() => validateAdjustmentDateRange(
        '2025-01-15', '2025-04-15', mainStart, mainEnd
      )).toThrow('Adjustment date range must be within the main filter date range');
    });

    it('should reject adjustment range completely outside main range', () => {
      expect(() => validateAdjustmentDateRange(
        '2024-01-01', '2024-03-31', mainStart, mainEnd
      )).toThrow('Adjustment date range must be within the main filter date range');
    });

    it('should validate adjustment range that exactly matches main range', () => {
      expect(() => validateAdjustmentDateRange(
        mainStart, mainEnd, mainStart, mainEnd
      )).not.toThrow();
    });
  });
});