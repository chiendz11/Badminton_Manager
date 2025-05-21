import {
  importStock,
  getStockHistory,
  getInventoryList,
  sellStock,
} from '../../Backend/services/inventoriesService.js';
import Inventory from '../../Backend/models/Inventories.js';
import StockHistory from '../../Backend/models/stockhistory.js';

// Keep track of mock state
let mockState = {
  inventory1: {
    _id: 'inventory1',
    centerId: 'center1',
    name: 'Item 1',
    category: 'Category 1',
    unitImport: 'box',
    unitImportQuantity: 10,
    unitSell: 'unit',
    quantity: 50,
    importPrice: 1000
  }
};

// Initialize mock state for each test
const initMockState = () => {
  mockState = {
    inventory1: {
      _id: 'inventory1',
      centerId: 'center1',
      name: 'Item 1',
      category: 'Category 1',
      unitImport: 'box',
      unitImportQuantity: 10,
      unitSell: 'unit',
      quantity: 50,
      importPrice: 1000
    }
  };
};

// Mock các model
jest.mock('../../Backend/models/Inventories.js', () => ({
  findById: jest.fn().mockImplementation((id) => ({
    lean: jest.fn().mockImplementation(() => Promise.resolve({ ...mockState[id] }))
  })),
  findOne: jest.fn().mockImplementation((query) => ({
    lean: jest.fn().mockImplementation(() =>
      query._id === 'inventory1' && query.centerId === 'center1'
        ? Promise.resolve({ ...mockState.inventory1 })
        : Promise.resolve(null)
    )
  })),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(() => Promise.resolve([{ ...mockState.inventory1 }]))
  }),
  findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
    if (mockState[id]) {
      mockState[id] = {
        ...mockState[id],
        ...update
      };
      return Promise.resolve({ ...mockState[id] });
    }
    return Promise.resolve(null);
  })
}));

jest.mock('../../Backend/models/stockhistory.js', () => ({
  create: jest.fn().mockImplementation((data) => Promise.resolve({
    _id: 'history1',
    ...data,
    createdAt: new Date('2025-04-01T00:00:00.000Z')
  })),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{
      _id: 'history1',
      inventoryId: {
        _id: 'inventory1',
        name: 'Item 1',
        category: 'Category 1',
        unitSell: 'unit'
      },
      centerId: {
        _id: 'center1',
        name: 'Center 1',
        location: 'Location 1'
      },
      supplier: 'Supplier 1',
      quantityImport: 5,
      unitImport: 'box',
      unitImportQuantity: 10,
      totalAdded: 50,
      importPrice: 1000,
      totalCost: 5000,
      createdAt: new Date('2025-04-01T00:00:00.000Z')
    }])
  })
}));

describe('inventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initMockState();
  });

  describe('importStock', () => {
    it('should import stock and create history successfully with positive quantity', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 1000,
      };

      const result = await importStock(params);

      expect(result.item.quantity).toBe(100); // 50 + (5 * 10)
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5
      }));
    });

    it('should throw an error if inventoryId is missing', async () => {
      const params = {
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('Cannot read properties of undefined');
    });

    it('should throw an error if item is not found', async () => {
      Inventory.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });

      const params = {
        inventoryId: 'invalid-id',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('Không tìm thấy mặt hàng');
    });

    it('should throw an error if quantityImport is zero', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 0,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('Số lượng trong kho không đủ');
      expect(StockHistory.create).not.toHaveBeenCalled();
    });

    it('should throw an error if quantityImport is negative', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: -5,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('Số lượng trong kho không đủ');
      expect(StockHistory.create).not.toHaveBeenCalled();
    });

    it('should throw an error if importPrice is negative', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: -1000,
      };

      const result = await importStock(params);
      const expectedQuantity = mockState.inventory1.quantity + (5 * 10);

      expect(result.item.quantity).toBe(100); // 50 + (5 * 10)
      expect(result.item.importPrice).toBe(-1000);
      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        'inventory1',
        { quantity: 100, importPrice: -1000 },
        { new: true }
      );
    });

    it('should throw an error if saving item fails', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        category: 'Category 1',
        unitImport: 'box',
        unitImportQuantity: 10,
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      Inventory.findByIdAndUpdate.mockRejectedValueOnce(new Error('Save failed'));

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('Save failed');
    });

    it('should throw an error if creating history fails', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        category: 'Category 1',
        unitImport: 'box',
        unitImportQuantity: 10,
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      StockHistory.create.mockRejectedValueOnce(new Error('History creation failed'));

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 1000,
      };

      await expect(importStock(params)).rejects.toThrow('History creation failed');
    });

    it('should handle large quantity import', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 1000,
        importPrice: 1000,
      };

      const result = await importStock(params);

      expect(result.item.quantity).toBe(10050); // 50 + (1000 * 10)
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 1000,
        importPrice: 1000,
        totalAdded: 10000,
        totalCost: 1000000
      }));
    });

    it('should handle zero import price', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 0,
      };

      const result = await importStock(params);

      expect(result.item.quantity).toBe(100); // 50 + (5 * 10)
      expect(result.item.importPrice).toBe(0);
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: 'Supplier 1',
        quantityImport: 5,
        importPrice: 0,
        totalCost: 0
      }));
    });

    it('should handle empty supplier', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: '',
        quantityImport: 5,
        importPrice: 1000,
      };

      const result = await importStock(params);

      expect(result.item.quantity).toBe(100); // 50 + (5 * 10)
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: '',
        quantityImport: 5,
        importPrice: 1000
      }));
    });
  });

  describe('getStockHistory', () => {
    it('should return stock history with both inventoryId and centerId filters', async () => {
      const mockHistory = {
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
        supplier: 'Supplier 1',
        quantityImport: 5,
        unitImport: 'box',
        unitImportQuantity: 10,
        totalAdded: 50,
        importPrice: 1000,
        totalCost: 5000,
        createdAt: new Date('2025-04-01'),
      };

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistory]),
            }),
          }),
        }),
      });

      const filter = { inventoryId: 'inventory1', centerId: 'center1' };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({ inventoryId: 'inventory1', centerId: 'center1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
        supplier: 'Supplier 1',
      });
    });

    it('should return stock history with only inventoryId filter', async () => {
      const mockHistory = {
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
        supplier: 'Supplier 1',
        quantityImport: 5,
        unitImport: 'box',
        unitImportQuantity: 10,
        totalAdded: 50,
        importPrice: 1000,
        totalCost: 5000,
        createdAt: new Date('2025-04-01'),
      };

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistory]),
            }),
          }),
        }),
      });

      const filter = { inventoryId: 'inventory1' };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({ inventoryId: 'inventory1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
      });
    });

    it('should return stock history with only centerId filter', async () => {
      const mockHistory = {
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
        supplier: 'Supplier 1',
        quantityImport: 5,
        unitImport: 'box',
        unitImportQuantity: 10,
        totalAdded: 50,
        importPrice: 1000,
        totalCost: 5000,
        createdAt: new Date('2025-04-01'),
      };

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistory]),
            }),
          }),
        }),
      });

      const filter = { centerId: 'center1' };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({ centerId: 'center1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'history1',
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
      });
    });

    it('should return stock history with no filters', async () => {
      const mockHistory = {
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
        supplier: 'Supplier 1',
        quantityImport: 5,
        unitImport: 'box',
        unitImportQuantity: 10,
        totalAdded: 50,
        importPrice: 1000,
        totalCost: 5000,
        createdAt: new Date('2025-04-01'),
      };

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistory]),
            }),
          }),
        }),
      });

      const filter = {};
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'history1',
        inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
        centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
      });
    });

    it('should return empty array if no history found', async () => {
      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const filter = { inventoryId: 'invalid-id' };
      const result = await getStockHistory(filter);

      expect(result).toEqual([]);
    });

    it('should throw an error if query fails', async () => {
      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      const filter = { inventoryId: 'inventory1' };
      await expect(getStockHistory(filter)).rejects.toThrow('Database error');
    });

    it('should sort history by createdAt in descending order', async () => {
      const mockHistories = [
        {
          _id: 'history1',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          createdAt: new Date('2025-04-01'),
        },
        {
          _id: 'history2',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          createdAt: new Date('2025-03-01'),
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockHistories),
      };

      StockHistory.find.mockReturnValue(mockQuery);

      const filter = { inventoryId: 'inventory1' };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({ inventoryId: 'inventory1' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('history1');
      expect(result[1]._id).toBe('history2');
    });

    it('should filter history by date range', async () => {
      const mockHistories = [
        {
          _id: 'history1',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          createdAt: new Date('2025-04-01'),
        },
        {
          _id: 'history2',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          createdAt: new Date('2025-03-01'),
        },
      ];

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistories[0]]),
            }),
          }),
        }),
      });

      const filter = {
        inventoryId: 'inventory1',
        year: 2025,
        month: 4
      };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({
        inventoryId: 'inventory1',
        createdAt: {
          $gte: new Date('2025-04-01'),
          $lt: new Date('2025-05-01')
        }
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('history1');
    });

    it('should filter history by supplier', async () => {
      const mockHistories = [
        {
          _id: 'history1',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          supplier: 'Supplier 1',
          createdAt: new Date('2025-04-01'),
        },
        {
          _id: 'history2',
          inventoryId: { _id: 'inventory1', name: 'Item 1', category: 'Category 1', unitSell: 'unit' },
          centerId: { _id: 'center1', name: 'Center 1', location: 'Location 1' },
          supplier: 'Supplier 2',
          createdAt: new Date('2025-03-01'),
        },
      ];

      StockHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockHistories[0]]),
            }),
          }),
        }),
      });

      const filter = {
        inventoryId: 'inventory1',
        supplier: 'Supplier 1'
      };
      const result = await getStockHistory(filter);

      expect(StockHistory.find).toHaveBeenCalledWith({
        inventoryId: 'inventory1',
        supplier: 'Supplier 1'
      });
      expect(result).toHaveLength(1);
      expect(result[0].supplier).toBe('Supplier 1');
    });
  });

  describe('getInventoryList', () => {
    it('should return inventory list with both centerId and category filters', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
        category: 'Category 1',
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItem]),
          }),
        }),
      });

      const filter = { centerId: 'center1', category: 'Category 1' };
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({ centerId: 'center1', category: 'Category 1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
        category: 'Category 1',
      });
    });

    it('should return inventory list with only centerId filter', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
        category: 'Category 1',
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItem]),
          }),
        }),
      });

      const filter = { centerId: 'center1' };
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({ centerId: 'center1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
      });
    });

    it('should return inventory list with only category filter', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
        category: 'Category 1',
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItem]),
          }),
        }),
      });

      const filter = { category: 'Category 1' };
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({ category: 'Category 1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'inventory1',
        category: 'Category 1',
      });
    });

    it('should return inventory list with no filters', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
        category: 'Category 1',
        unitSell: 'unit',
        quantity: 50,
        importPrice: 1000,
      };

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItem]),
          }),
        }),
      });

      const filter = {};
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: 'inventory1',
        centerId: { _id: 'center1', name: 'Center 1' },
        name: 'Item 1',
      });
    });

    it('should return empty array if no inventory found', async () => {
      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const filter = { centerId: 'invalid-center' };
      const result = await getInventoryList(filter);

      expect(result).toEqual([]);
    });

    it('should throw an error if query fails', async () => {
      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const filter = { centerId: 'center1' };
      await expect(getInventoryList(filter)).rejects.toThrow('Database error');
    });

    it('should sort inventory list by name in ascending order', async () => {
      const mockItems = [
        {
          _id: 'inventory2',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item B',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 30,
          importPrice: 1500,
        },
        {
          _id: 'inventory1',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item A',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 50,
          importPrice: 1000,
        },
      ];

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItems[1], mockItems[0]]), // Đảm bảo thứ tự đúng
          }),
        }),
      });

      const filter = { centerId: 'center1' };
      const result = await getInventoryList(filter);

      expect(Inventory.find().sort).toHaveBeenCalledWith({ name: 1 });
      expect(result[0].name).toBe('Item A');
      expect(result[1].name).toBe('Item B');
    });

    it('should filter inventory by name', async () => {
      const mockItems = [
        {
          _id: 'inventory1',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item A',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 50,
          importPrice: 1000,
        },
        {
          _id: 'inventory2',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item B',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 30,
          importPrice: 1500,
        },
      ];

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItems[0]]),
          }),
        }),
      });

      const filter = {
        centerId: 'center1',
        name: 'Item A'
      };
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({
        centerId: 'center1',
        name: { $regex: 'Item A', $options: 'i' }
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item A');
    });

    it('should filter inventory by price range', async () => {
      const mockItems = [
        {
          _id: 'inventory1',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item A',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 50,
          importPrice: 1000,
          price: 1500,
        },
        {
          _id: 'inventory2',
          centerId: { _id: 'center1', name: 'Center 1' },
          name: 'Item B',
          category: 'Category 1',
          unitSell: 'unit',
          quantity: 30,
          importPrice: 1500,
          price: 2000,
        },
      ];

      Inventory.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockItems[0]]),
          }),
        }),
      });

      const filter = {
        centerId: 'center1',
        minPrice: 1000,
        maxPrice: 1500
      };
      const result = await getInventoryList(filter);

      expect(Inventory.find).toHaveBeenCalledWith({
        centerId: 'center1',
        price: { $gte: 1000, $lte: 1500 }
      });
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(1500);
    });
  });

  describe('sellStock', () => {
    beforeEach(() => {
      initMockState();
    });

    it('should sell stock successfully with sufficient quantity', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      const result = await sellStock(params);

      expect(result.quantity).toBe(30); // 50 - 20
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 20,
        price: 1500,
        type: 'export'
      }));
    });

    it('should throw an error if inventoryId is missing', async () => {
      const params = {
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Cannot read properties of undefined');
    });

    it('should throw an error if inventory is not found', async () => {
      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const params = {
        inventoryId: 'invalid-id',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Không tìm thấy kho hàng');
    });

    it('should throw an error if quantityExport is greater than available quantity', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 10,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Số lượng trong kho không đủ');
    });

    it('should throw an error if quantityExport is zero', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 50,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 0,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Số lượng trong kho không đủ');
      expect(StockHistory.create).not.toHaveBeenCalled();
    });

    it('should throw an error if quantityExport is negative', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 50,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: -20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Số lượng trong kho không đủ');
      expect(StockHistory.create).not.toHaveBeenCalled();
    });

    it('should handle edge case when quantityExport equals available quantity', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 50,
        exportPrice: 1500,
      };

      const result = await sellStock(params);

      expect(result.quantity).toBe(0); // 50 - 50
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 50,
        price: 1500,
        type: 'export'
      }));
    });

    it('should throw an error if exportPrice is negative', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 50,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      StockHistory.create = jest.fn().mockResolvedValue({
        _id: 'history1',
        inventoryId: 'inventory1',
        centerId: 'center1',
        supplier: null,
        quantity: 20,
        price: -1500,
        type: 'export',
        date: expect.any(Date),
      });

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: -1500,
      };

      const result = await sellStock(params);

      expect(result.quantity).toBe(30); // 50 - 20
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 20,
        price: -1500,
        type: 'export'
      }));
    });

    it('should throw an error if saving inventory fails', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 50,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      Inventory.findByIdAndUpdate.mockRejectedValueOnce(new Error('Save failed'));

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('Save failed');
    });

    it('should throw an error if creating history fails', async () => {
      const mockItem = {
        _id: 'inventory1',
        centerId: 'center1',
        name: 'Item 1',
        quantity: 50,
      };

      Inventory.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockItem),
      });

      StockHistory.create = jest.fn().mockRejectedValue(new Error('History creation failed'));

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
      };

      await expect(sellStock(params)).rejects.toThrow('History creation failed');
    });

    it('should handle zero export price', async () => {
      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 0,
      };

      StockHistory.create = jest.fn().mockResolvedValue({
        _id: 'history1',
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 20,
        price: 0,
        type: 'export',
        date: new Date()
      });

      const result = await sellStock(params);

      expect(result.quantity).toBe(30); // 50 - 20
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 20,
        price: 0,
        type: 'export'
      }));
    });

    it('should handle large quantity export', async () => {
      // Set up initial state with higher quantity
      mockState.inventory1.quantity = 1000;

      // Update findOne mock to use current mockState
      const findOneMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockState.inventory1 })
      });
      Inventory.findOne = findOneMock;

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 500,
        exportPrice: 1500,
      };

      const result = await sellStock(params);

      expect(result.quantity).toBe(500); // 1000 - 500
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 500,
        price: 1500,
        type: 'export'
      }));
    });

    it('should handle empty customer info', async () => {
      // Reset mock state to initial values
      initMockState();

      // Reset findOne mock to use initial state
      Inventory.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockState.inventory1 })
      });

      const params = {
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantityExport: 20,
        exportPrice: 1500,
        customer: { name: '', contact: '' }
      };

      const result = await sellStock(params);

      expect(result.quantity).toBe(30); // 50 - 20
      expect(StockHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        inventoryId: 'inventory1',
        centerId: 'center1',
        quantity: 20,
        price: 1500,
        type: 'export'
      }));
    });
  });
});