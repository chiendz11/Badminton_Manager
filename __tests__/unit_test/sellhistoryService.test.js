import { getAllSellHistories, createSellHistory } from '../../Backend/services/sellhistoryService.js';
import SellHistory from '../../Backend/models/sellhistory.js';
import Inventory from '../../Backend/models/Inventories.js';

// Mock models
jest.mock('../../Backend/models/sellhistory.js', () => {
  const MockSellHistory = class {
    constructor(data) {
      this._id = 'sh_mock_id';
      this.createdAt = new Date();
      Object.assign(this, data); // Giữ lại tất cả các trường từ data
    }
    save() {
      return Promise.resolve(this);
    }
  };
  MockSellHistory.find = jest.fn(() => ({
    populate: jest.fn(() => ({
      sort: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue([]) // Mặc định trả về mảng rỗng
      }))
    }))
  }));
  
  return {
    __esModule: true,
    default: MockSellHistory
  };
});

jest.mock('../../Backend/models/Inventories.js', () => {
  return {
    findById: jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent_id') return Promise.resolve(null);
      const inventory = {
        _id: 'inv_mock_id',
        name: 'Mock Item',
        quantity: 10, // Khởi tạo quantity
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };
      return Promise.resolve(inventory);
    })
  };
});

describe('SellHistory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock của Inventory để đảm bảo quantity bắt đầu từ 10
    jest.resetModules();
    jest.mock('../../Backend/models/Inventories.js', () => {
      let inventoryState = {
        _id: 'inv_mock_id',
        name: 'Mock Item',
        quantity: 10
      };

      return {
        findById: jest.fn().mockImplementation((id) => {
          if (id === 'nonexistent_id') return Promise.resolve(null);
          const inventory = { ...inventoryState };
          inventory.save = jest.fn().mockImplementation(function() {
            inventoryState.quantity = this.quantity; // Cập nhật trạng thái quantity
            return Promise.resolve(this);
          });
          return Promise.resolve(inventory);
        })
      };
    });
  });

  describe('getAllSellHistories', () => {
    it('should get all sell histories in descending order', async () => {
      const mockData = [
        { _id: '1', createdAt: new Date('2023-01-02') },
        { _id: '2', createdAt: new Date('2023-01-01') }
      ];

      SellHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockData)
      });

      const result = await getAllSellHistories();
      
      expect(result).toEqual(mockData);
      expect(SellHistory.find().populate).toHaveBeenCalledWith('items.inventoryId');
      expect(SellHistory.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return empty array when no sell histories exist', async () => {
      SellHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      const result = await getAllSellHistories();
      
      expect(result).toEqual([]);
      expect(SellHistory.find().populate).toHaveBeenCalledWith('items.inventoryId');
      expect(SellHistory.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should sort sell histories by creation date in descending order', async () => {
      const mockData = [
        { _id: '1', createdAt: new Date('2023-01-02') },
        { _id: '2', createdAt: new Date('2023-01-01') }
      ];

      SellHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockData)
      });

      const result = await getAllSellHistories();
      
      expect(result).toEqual(mockData);
      expect(SellHistory.find().populate).toHaveBeenCalledWith('items.inventoryId');
      expect(SellHistory.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt > result[1].createdAt).toBe(true);
    });
  });

  describe('createSellHistory', () => {
    const mockSellData = {
      invoiceNumber: 'INV001',
      centerId: 'center1',
      items: [
        {
          inventoryId: 'inv_mock_id',
          quantity: 2,
          unitPrice: 50
        }
      ],
      paymentMethod: 'Cash',
      customer: { name: 'Test Customer', contact: '1234567890' }
    };

    it('should create a new sell history and update inventory', async () => {
      const result = await createSellHistory(mockSellData);
      
      expect(result).toBeTruthy();
      expect(result._id).toBe('sh_mock_id');
      expect(result.invoiceNumber).toBe('INV001');
      expect(result.centerId).toBe('center1');
      expect(result.items[0].totalPrice).toBe(100);
      expect(result.totalAmount).toBe(100);
      expect(result.paymentMethod).toBe('Cash');
      expect(result.customer.name).toBe('Test Customer');
      expect(Inventory.findById).toHaveBeenCalledWith('inv_mock_id');
      
      // Check inventory update
      const inventory = await Inventory.findById('inv_mock_id');
      expect(inventory.quantity).toBe(8); // 10 - 2
      expect(inventory.save).toHaveBeenCalled();
    });

    it('should throw error if inventory not found', async () => {
      const invalidData = {
        ...mockSellData,
        items: [{
          ...mockSellData.items[0],
          inventoryId: 'nonexistent_id'
        }]
      };

      await expect(createSellHistory(invalidData))
        .rejects
        .toThrow('Inventory nonexistent_id không tồn tại');
    });

    it('should throw error if insufficient inventory', async () => {
      const largeQuantityData = {
        ...mockSellData,
        items: [{
          ...mockSellData.items[0],
          quantity: 100
        }]
      };

      await expect(createSellHistory(largeQuantityData))
        .rejects
        .toThrow('Tồn kho không đủ cho sản phẩm Mock Item');
    });

    it('should calculate total price correctly for multiple items', async () => {
      const multiItemData = {
        ...mockSellData,
        items: [
          { inventoryId: 'inv_mock_id', quantity: 2, unitPrice: 50 },
          { inventoryId: 'inv_mock_id', quantity: 3, unitPrice: 30 }
        ]
      };

      const result = await createSellHistory(multiItemData);

      expect(result.items[0].totalPrice).toBe(100); // 2 * 50
      expect(result.items[1].totalPrice).toBe(90); // 3 * 30
      expect(result.totalAmount).toBe(190); // 100 + 90
    });

    it('should update inventory quantity correctly for multiple items', async () => {
      const multiItemData = {
        ...mockSellData,
        items: [
          { inventoryId: 'inv_mock_id', quantity: 2, unitPrice: 50 },
          { inventoryId: 'inv_mock_id', quantity: 3, unitPrice: 30 }
        ]
      };

      await createSellHistory(multiItemData);

      const inventory = await Inventory.findById('inv_mock_id');
      expect(inventory.quantity).toBe(5); // 10 - (2 + 3)
      expect(inventory.save).toHaveBeenCalledTimes(2); // Gọi save 2 lần cho 2 mục
    });
  });
});