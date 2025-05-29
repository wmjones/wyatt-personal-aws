import { dropdownKeys } from '../queryKeys';

describe('Dropdown Query Keys', () => {
  describe('dropdownKeys.all', () => {
    it('should return base key for all dropdown queries', () => {
      expect(dropdownKeys.all).toEqual(['dropdownOptions']);
    });
  });

  describe('dropdownKeys.states', () => {
    it('should return query key for states', () => {
      expect(dropdownKeys.states()).toEqual(['dropdownOptions', 'states']);
    });
  });

  describe('dropdownKeys.dmas', () => {
    it('should return query key for DMAs without filters', () => {
      expect(dropdownKeys.dmas()).toEqual(['dropdownOptions', 'dmas', {}]);
    });

    it('should return query key for DMAs with state filter', () => {
      expect(dropdownKeys.dmas({ stateId: 'CA' })).toEqual([
        'dropdownOptions',
        'dmas',
        { stateId: 'CA' }
      ]);
    });

    it('should handle undefined filters', () => {
      expect(dropdownKeys.dmas(undefined)).toEqual(['dropdownOptions', 'dmas', {}]);
    });
  });

  describe('dropdownKeys.dcs', () => {
    it('should return query key for DCs without filters', () => {
      expect(dropdownKeys.dcs()).toEqual(['dropdownOptions', 'dcs', {}]);
    });

    it('should return query key for DCs with state filter only', () => {
      expect(dropdownKeys.dcs({ stateId: 'TX' })).toEqual([
        'dropdownOptions',
        'dcs',
        { stateId: 'TX' }
      ]);
    });

    it('should return query key for DCs with DMA filter only', () => {
      expect(dropdownKeys.dcs({ dmaId: 'DMA001' })).toEqual([
        'dropdownOptions',
        'dcs',
        { dmaId: 'DMA001' }
      ]);
    });

    it('should return query key for DCs with both filters', () => {
      expect(dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA002' })).toEqual([
        'dropdownOptions',
        'dcs',
        { stateId: 'CA', dmaId: 'DMA002' }
      ]);
    });
  });

  describe('dropdownKeys.inventoryItems', () => {
    it('should return query key for inventory items', () => {
      expect(dropdownKeys.inventoryItems()).toEqual(['dropdownOptions', 'inventoryItems']);
    });
  });

  describe('dropdownKeys.restaurants', () => {
    it('should return query key for restaurants', () => {
      expect(dropdownKeys.restaurants()).toEqual(['dropdownOptions', 'restaurants']);
    });
  });

  describe('Query Key Uniqueness', () => {
    it('should generate unique keys for different query types', () => {
      const keys = [
        dropdownKeys.states(),
        dropdownKeys.dmas(),
        dropdownKeys.dcs(),
        dropdownKeys.inventoryItems(),
        dropdownKeys.restaurants(),
      ];

      // Convert to strings for comparison
      const stringKeys = keys.map(key => JSON.stringify(key));
      const uniqueKeys = new Set(stringKeys);

      // All keys should be unique
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should generate different keys for same type with different filters', () => {
      const key1 = dropdownKeys.dmas({ stateId: 'CA' });
      const key2 = dropdownKeys.dmas({ stateId: 'TX' });
      const key3 = dropdownKeys.dmas();

      expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
      expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key3));
      expect(JSON.stringify(key2)).not.toBe(JSON.stringify(key3));
    });
  });

  describe('Query Key Stability', () => {
    it('should generate consistent keys for same inputs', () => {
      const key1 = dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA001' });
      const key2 = dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA001' });

      expect(key1).toEqual(key2);
    });

    it('should generate consistent keys for same filter values', () => {
      const key1 = dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA001' });
      const key2 = dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA001' });

      // Keys should be identical for same input values
      expect(key1).toEqual(key2);

      // Note: Property order in objects may vary, so we don't test string equality
      // React Query handles this correctly by comparing object contents, not string representation
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct filter types at compile time', () => {
      // These should compile without errors
      dropdownKeys.dmas({ stateId: 'CA' });
      dropdownKeys.dcs({ stateId: 'CA' });
      dropdownKeys.dcs({ dmaId: 'DMA001' });
      dropdownKeys.dcs({ stateId: 'CA', dmaId: 'DMA001' });

      // The following would cause TypeScript errors if uncommented:
      // dropdownKeys.dmas({ dmaId: 'DMA001' }); // dmaId not allowed for dmas
      // dropdownKeys.dcs({ invalidProp: 'value' }); // invalidProp not allowed
    });
  });
});
