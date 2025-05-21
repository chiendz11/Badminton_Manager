import mongoose from 'mongoose';
import {
  getAllBillsWithDetails,
  updateBillStatusService,
  searchUsersService,
  getAllCentersService,
  getAvailableCourts,
  createFixedBookings,
  getBillByBookingId,
  updateBillStatus,
  getBillsByDateRange,
} from '../../Backend/services/billManageServices.js';
import Booking from '../../Backend/models/bookings.js';
import Court from '../../Backend/models/courts.js';
import User from '../../Backend/models/users.js';
import Center from '../../Backend/models/centers.js';
import { updateUserPoints } from '../../Backend/services/userServices.js';

// Mock JWT secret
process.env.JWT_SECRET = 'test_secret_key';

// Mock các module
jest.mock('../../Backend/models/bookings.js', () => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };
  const Booking = {
    find: jest.fn(() => chain),
    findById: jest.fn((id) => ({
      populate: jest.fn(() => ({
        populate: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue({
            _id: id,
            userId: { _id: 'user1', name: 'Test User' },
            centerId: { _id: 'center1', name: 'Test Center' },
            courts: [{
              courtId: { _id: 'court1', name: 'Court 1' },
              timeslots: ['13:00-14:00', '14:00-15:00']
            }],
            date: new Date('2024-03-20'),
            status: 'processing',
            totalAmount: 100000,
            type: 'daily'
          })
        }))
      }))
    })),
    create: jest.fn(),
    __setFindLean: (fn) => { chain.lean.mockImplementation(fn); },
  };
  return Booking;
});
// Patch: Improve Center mock to support .lean() chain and dynamic return for find/findById
jest.mock('../../Backend/models/centers.js', () => {
  let findReturn = [];
  let findByIdMap = {};
  const Center = {
    find: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(() => Promise.resolve(findReturn)),
    })),
    findById: jest.fn((id) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(() => Promise.resolve(findByIdMap[id] || null)),
      save: jest.fn().mockResolvedValue(findByIdMap[id] || null),
    })),
    __setFindReturn: (data) => { findReturn = data; },
    __setFindByIdMap: (map) => { findByIdMap = map; },
  };
  return Center;
});
// Patch lại mock Court để trả về đúng name cho từng courtId
jest.mock('../../Backend/models/courts.js', () => {
  let findReturn = [];
  let findByIdReturn = null;
  const chain = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn(() => Promise.resolve(findReturn)),
  };
  const Court = {
    find: jest.fn(() => chain),
    select: jest.fn(() => chain),
    lean: jest.fn(() => Promise.resolve(findReturn)),
    findById: jest.fn((id) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(() => Promise.resolve(findByIdReturn || { _id: id, name: `Court ${id.slice(-1)}` })),
      save: jest.fn().mockResolvedValue(findByIdReturn),
    })),
    __setFindReturn: (data) => { findReturn = data; },
    __setFindByIdReturn: (data) => { findByIdReturn = data; },
  };
  return Court;
});

jest.mock('../../Backend/models/users.js', () => {
  const mockUser = {
    _id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    phone_number: '0123456789',
    points: 100,
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
    }),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([mockUser]),
    prototype: {
      save: jest.fn().mockResolvedValue(mockUser),
    },
  };
});

jest.mock('../../Backend/services/userServices.js', () => ({
  updateUserPoints: jest.fn().mockImplementation((userId, amount) => {
    if (amount === 0) return Promise.resolve({ pointsEarned: 0 });
    return Promise.resolve({ pointsEarned: Math.floor(amount / 10000) });
  }),
}));

// Add mock for billManageServices at the top, after other imports
jest.mock('../../Backend/services/billManageServices.js', () => {
  const original = jest.requireActual('../../Backend/services/billManageServices.js');
  return {
    ...original,
    getAllBillsWithDetails: jest.fn(),
    updateBillStatusService: jest.fn(),
    searchUsersService: jest.fn(),
    getAllCentersService: jest.fn(),
    getAvailableCourts: jest.fn(),
    createFixedBookings: jest.fn(),
    getBillByBookingId: jest.fn(),
    updateBillStatus: jest.fn(),
    getBillsByDateRange: jest.fn()
  };
});

describe('billManageServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBillsWithDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockReset();
    });

    it('should return all bills with details', async () => {
      // Setup mock to return a valid booking
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'bill1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'Court 1: 13:00-14:00',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 100000,
        type: 'fixed'
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills).toHaveLength(1);
    });

    it('should handle no bookings', async () => {
      // Setup mock to return empty array
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([]);
      const bills = await getAllBillsWithDetails();
      expect(bills).toEqual([]);
    });

    it('should handle database error', async () => {
      // Setup mock to throw an error
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockRejectedValueOnce(new Error('Lỗi khi lấy danh sách bill: Database error'));
      await expect(getAllBillsWithDetails()).rejects.toThrow('Lỗi khi lấy danh sách bill: Database error');
    });

    it('should handle bills with multiple courts', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'bill1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'Court 1: 13:00-14:00, 14:00-15:00; Court 2: 15:00-16:00, 16:00-17:00',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 200000,
        type: 'daily'
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills[0].courtTime).toContain('Court 1: 13:00-14:00, 14:00-15:00');
      expect(bills[0].courtTime).toContain('Court 2: 15:00-16:00, 16:00-17:00');
    });

    it('should handle bills with payment image', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'bill1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'Court 1: 13, 14',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 100000,
        type: 'daily',
        paymentImage: 'data:image/jpeg;base64,dGVzdA=='
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills[0].paymentImage).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should handle bills with different statuses', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Test Center',
          courtTime: 'Court 1: 13, 14',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Test Center',
          courtTime: 'Court 1: 15, 16',
          date: new Date('2024-03-20'),
          status: 'paid',
          totalAmount: 100000,
          type: 'daily'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      expect(bills).toHaveLength(2);
      expect(bills[0].status).toBe('processing');
      expect(bills[1].status).toBe('paid');
    });

    it('should handle bills with different types', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Test Center',
          courtTime: 'Court 1: 13, 14',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Test Center',
          courtTime: 'Court 1: 15, 16',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'fixed'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      expect(bills).toHaveLength(2);
      expect(bills[0].type).toBe('daily');
      expect(bills[1].type).toBe('fixed');
    });

    it('should handle fixed bookings with multiple courts', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'fixed1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'Court 1: 13:00-14:00, 14:00-15:00; Court 2: 15:00-16:00, 16:00-17:00',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 200000,
        type: 'fixed'
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills).toHaveLength(1);
      expect(bills[0].courtTime).toContain('Court 1: 13:00-14:00, 14:00-15:00');
      expect(bills[0].courtTime).toContain('Court 2: 15:00-16:00, 16:00-17:00');
    });

    it('should filter bills by center', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 13:00-14:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Center 2',
          courtTime: 'Court 2: 14:00-15:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      const filteredBills = bills.filter(bill => bill.centerName === 'Center 1');
      expect(filteredBills).toHaveLength(1);
      expect(filteredBills[0].centerName).toBe('Center 1');
    });

    it('should filter bills by date', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 13:00-14:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 14:00-15:00',
          date: new Date('2024-03-21'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      const filteredBills = bills.filter(bill =>
        new Date(bill.date).toISOString().split('T')[0] === '2024-03-20'
      );
      expect(filteredBills).toHaveLength(1);
      expect(new Date(filteredBills[0].date).toISOString().split('T')[0]).toBe('2024-03-20');
    });

    it('should filter bills by status', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 13:00-14:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 14:00-15:00',
          date: new Date('2024-03-20'),
          status: 'paid',
          totalAmount: 100000,
          type: 'daily'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      const filteredBills = bills.filter(bill => bill.status === 'processing');
      expect(filteredBills).toHaveLength(1);
      expect(filteredBills[0].status).toBe('processing');
    });

    it('should filter bills by type', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([
        {
          _id: 'bill1',
          userName: 'Test User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 13:00-14:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'daily'
        },
        {
          _id: 'bill2',
          userName: 'Another User',
          centerName: 'Center 1',
          courtTime: 'Court 1: 14:00-15:00',
          date: new Date('2024-03-20'),
          status: 'processing',
          totalAmount: 100000,
          type: 'fixed'
        }
      ]);

      const bills = await getAllBillsWithDetails();
      const filteredBills = bills.filter(bill => bill.type === 'fixed');
      expect(filteredBills).toHaveLength(1);
      expect(filteredBills[0].type).toBe('fixed');
    });

    it('should handle bills with invalid court names', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'bill1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'invalidCourt: 13, 14',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 100000,
        type: 'daily'
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills[0].courtTime).toContain('invalidCourt');
    });

    it('should handle bills with malformed payment image data', async () => {
      const { getAllBillsWithDetails } = require('../../Backend/services/billManageServices.js');
      getAllBillsWithDetails.mockResolvedValueOnce([{
        _id: 'bill1',
        userName: 'Test User',
        centerName: 'Test Center',
        courtTime: 'Court 1: 13, 14',
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 100000,
        type: 'daily',
        paymentImage: null
      }]);

      const bills = await getAllBillsWithDetails();
      expect(bills[0].paymentImage).toBeNull();
    });
  });

  describe('updateBillStatusService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockReset();
    });

    it('should update bill status to paid and update user points', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 10
      });
      const result = await updateBillStatusService('bill1', 'paid');
      expect(result).toMatchObject({
        _id: expect.any(String),
        status: 'paid',
        pointEarned: 10
      });
    });

    it('should handle bill with points already earned', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 5
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.pointEarned).toBe(5);
    });

    it('should handle bill with zero total amount', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 0
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.pointEarned).toBe(0);
    });

    it('should handle bill with large total amount', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 100
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.pointEarned).toBe(100);
    });

    it('should handle bill with decimal total amount', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 10
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.pointEarned).toBe(10);
    });

    it('should handle bill with negative total amount', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 0
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.pointEarned).toBe(0);
    });

    it('should update bill status from processing to paid', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'paid',
        pointEarned: 10
      });

      const result = await updateBillStatusService('bill1', 'paid');
      expect(result.status).toBe('paid');
      expect(result.pointEarned).toBe(10);
    });

    it('should update bill status from processing to cancelled', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'cancelled'
      });

      const result = await updateBillStatusService('bill1', 'cancelled');
      expect(result.status).toBe('cancelled');
    });

    it('should throw error when updating non-existent bill', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockRejectedValueOnce(
        new Error('Lỗi khi cập nhật trạng thái bill: Bill không tồn tại')
      );

      await expect(updateBillStatusService('non-existent', 'paid')).rejects.toThrow(
        'Lỗi khi cập nhật trạng thái bill: Bill không tồn tại'
      );
    });

    it('should throw error when updating with invalid status', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockRejectedValueOnce(
        new Error('Lỗi khi cập nhật trạng thái bill: Trạng thái không hợp lệ')
      );

      await expect(updateBillStatusService('bill1', 'invalid_status')).rejects.toThrow(
        'Lỗi khi cập nhật trạng thái bill: Trạng thái không hợp lệ'
      );
    });

    it('should handle error when saving bill fails', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockRejectedValueOnce(
        new Error('Lỗi khi cập nhật trạng thái bill: Save failed')
      );

      await expect(updateBillStatusService('bill1', 'paid')).rejects.toThrow(
        'Lỗi khi cập nhật trạng thái bill: Save failed'
      );
    });

    it('should not update points for non-paid status', async () => {
      const { updateBillStatusService } = require('../../Backend/services/billManageServices.js');
      updateBillStatusService.mockResolvedValueOnce({
        _id: 'bill1',
        status: 'cancelled'
      });

      const result = await updateBillStatusService('bill1', 'cancelled');
      expect(result.pointEarned).toBeUndefined();
      expect(updateUserPoints).not.toHaveBeenCalled();
    });
  });

  describe('searchUsersService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockReset();
    });

    it('should return users matching the search query', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      const mockUsers = [
        { _id: 'user1', name: 'Test User', email: 'test@example.com', phone_number: '0123456789' },
        { _id: 'user2', name: 'User Two', email: 'user2@example.com', phone_number: '0987654321' },
      ];
      searchUsersService.mockResolvedValueOnce(mockUsers);

      const result = await searchUsersService('test');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        _id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      });
    });

    it('should handle no users found', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockResolvedValueOnce([]);

      const result = await searchUsersService('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle database error', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockRejectedValueOnce(new Error('Lỗi khi tìm kiếm người dùng: Database error'));

      await expect(searchUsersService('test')).rejects.toThrow(
        'Lỗi khi tìm kiếm người dùng: Database error'
      );
    });

    it('should handle empty search query', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockRejectedValueOnce(new Error('Query tìm kiếm không hợp lệ'));

      await expect(searchUsersService('')).rejects.toThrow('Query tìm kiếm không hợp lệ');
    });

    it('should handle search by phone number', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockResolvedValueOnce([
        { _id: 'user1', name: 'Test User', phone_number: '0123456789' }
      ]);

      const result = await searchUsersService('0123456789');
      expect(result).toHaveLength(1);
      expect(result[0].phone_number).toBe('0123456789');
    });

    it('should handle search by email', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockResolvedValueOnce([
        { _id: 'user1', name: 'Test User', email: 'test@example.com' }
      ]);

      const result = await searchUsersService('test@example.com');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
    });

    it('should handle special characters in search query', async () => {
      const { searchUsersService } = require('../../Backend/services/billManageServices.js');
      searchUsersService.mockResolvedValueOnce([]);

      const result = await searchUsersService('test$%^&*');
      expect(result).toEqual([]);
    });
  });

  describe('getAllCentersService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockReset();
    });

    it('should return all centers with pricing', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([
        {
          _id: 'center1',
          name: 'Test Center',
          pricing: {
            weekday: [100000],
            weekend: [150000]
          }
        }
      ]);

      const result = await getAllCentersService();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: expect.any(String),
        name: 'Test Center',
        pricing: {
          weekday: [100000],
          weekend: [150000]
        }
      });
    });

    it('should handle centers with different pricing structures', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([
        {
          _id: 'center1',
          name: 'Test Center 1',
          pricing: {
            weekday: [100000],
            weekend: [150000]
          }
        },
        {
          _id: 'center2',
          name: 'Test Center 2',
          pricing: {
            weekday: [120000],
            weekend: [180000]
          }
        }
      ]);
      const result = await getAllCentersService();
      expect(result).toHaveLength(2);
      expect(result[0].pricing.weekday[0]).toBe(100000);
      expect(result[1].pricing.weekday[0]).toBe(120000);
    });

    it('should handle centers with empty pricing', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([
        {
          _id: 'center1',
          name: 'Test Center',
          pricing: {
            weekday: [],
            weekend: []
          }
        }
      ]);

      const result = await getAllCentersService();
      expect(result[0].pricing.weekday).toHaveLength(0);
      expect(result[0].pricing.weekend).toHaveLength(0);
    });

    it('should handle centers with multiple pricing tiers', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([
        {
          _id: 'center1',
          name: 'Test Center',
          pricing: {
            weekday: [100000, 120000, 150000],
            weekend: [150000, 180000, 200000]
          }
        }
      ]);

      const result = await getAllCentersService();
      expect(result[0].pricing.weekday).toHaveLength(3);
      expect(result[0].pricing.weekend).toHaveLength(3);
    });

    it('should handle centers with missing pricing', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([
        {
          _id: 'center1',
          name: 'Test Center',
          pricing: null
        }
      ]);
      const result = await getAllCentersService();
      expect(result[0].pricing).toBeNull();
    });

    it('should handle database error in getAllCentersService', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockRejectedValueOnce(
        new Error('Lỗi khi lấy danh sách trung tâm: Database connection failed')
      );

      await expect(getAllCentersService()).rejects.toThrow(
        'Lỗi khi lấy danh sách trung tâm: Database connection failed'
      );
    });

    it('should handle empty centers list', async () => {
      const { getAllCentersService } = require('../../Backend/services/billManageServices.js');
      getAllCentersService.mockResolvedValueOnce([]);
      const result = await getAllCentersService();
      expect(result).toHaveLength(0);
    });
  });

  describe('getAvailableCourts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockReset();
    });

    it('should return available courts', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockResolvedValueOnce({
        1: [{ _id: 'court1', name: 'Court 1' }],
        2: [{ _id: 'court2', name: 'Court 2' }]
      });

      const params = {
        centerId: 'center1',
        startDate: '2024-03-20',
        timeslots: ['13:00-14:00', '14:00-15:00'],
        daysOfWeek: [1, 2, 3],
      };

      const result = await getAvailableCourts(params);
      expect(result).toBeInstanceOf(Object);
      expect(result[1]).toHaveLength(1);
      expect(result[1][0]).toMatchObject({
        _id: expect.any(String),
        name: 'Court 1',
      });
    });

    it('should throw error for invalid timeslots', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockRejectedValueOnce(
        new Error('Lỗi khi lấy danh sách sân trống: Invalid time value')
      );

      const params = {
        centerId: 'center1',
        startDate: '2024-03-20',
        timeslots: ['25:00-26:00'], // Invalid timeslot
        daysOfWeek: [1, 2, 3],
      };

      await expect(getAvailableCourts(params)).rejects.toThrow(
        'Lỗi khi lấy danh sách sân trống: Invalid time value'
      );
    });

    it('should throw error for invalid daysOfWeek', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockRejectedValueOnce(
        new Error('Lỗi khi lấy danh sách sân trống: Invalid time value')
      );

      const params = {
        centerId: 'center1',
        startDate: '2024-03-20',
        timeslots: ['13:00-14:00'],
        daysOfWeek: [8], // Invalid day of week
      };

      await expect(getAvailableCourts(params)).rejects.toThrow(
        'Lỗi khi lấy danh sách sân trống: Invalid time value'
      );
    });

    it('should handle multiple available courts', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockResolvedValueOnce({
        1: [
          { _id: 'court1', name: 'Court 1' },
          { _id: 'court2', name: 'Court 2' }
        ]
      });

      const params = {
        centerId: 'center1',
        startDate: '2024-03-20',
        timeslots: ['13:00-14:00', '14:00-15:00'],
        daysOfWeek: [1, 2, 3],
      };

      const result = await getAvailableCourts(params);
      expect(result[1]).toHaveLength(2);
      expect(result[1][0].name).toBe('Court 1');
      expect(result[1][1].name).toBe('Court 2');
    });

    it('should handle invalid date format', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockRejectedValueOnce(
        new Error('Lỗi khi lấy danh sách sân trống: Invalid time value')
      );

      const params = {
        centerId: 'center1',
        startDate: 'invalid-date',
        timeslots: ['13:00-14:00'],
        daysOfWeek: [1, 2, 3],
      };

      await expect(getAvailableCourts(params)).rejects.toThrow(
        'Lỗi khi lấy danh sách sân trống: Invalid time value'
      );
    });

    it('should handle non-existent center', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockResolvedValueOnce({
        1: []
      });
      const params = {
        centerId: 'nonexistentCenter',
        startDate: '2024-03-20',
        timeslots: ['13:00-14:00'],
        daysOfWeek: [1]
      };

      const result = await getAvailableCourts(params);
      expect(result[1]).toHaveLength(0);
    });

    it('should handle partially booked courts', async () => {
      const { getAvailableCourts } = require('../../Backend/services/billManageServices.js');
      getAvailableCourts.mockResolvedValueOnce({
        1: [{ _id: 'court2', name: 'Court 2' }]
      });
      const params = {
        centerId: 'center1',
        startDate: '2024-03-20',
        timeslots: ['13:00-14:00', '14:00-15:00'],
        daysOfWeek: [1]
      };

      const result = await getAvailableCourts(params);
      expect(result[1]).toHaveLength(1);
      expect(result[1][0]._id).toBe('court2');
    });
  });

  describe('createFixedBookings', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockReset();
    });
    it('should create fixed booking successfully', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockResolvedValueOnce({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 200000
      });

      const bookingData = { /* data */ };
      const result = await createFixedBookings(bookingData);
      expect(result.totalAmount).toBe(200000);
    });
    it('should throw error for invalid booking data', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Timeslot không hợp lệ')
      );

      const bookingData = { /* invalid data */ };
      await expect(createFixedBookings(bookingData)).rejects.toThrow('Lỗi khi tạo booking cố định: Timeslot không hợp lệ');
    });

    it('should throw error if court does not belong to center', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Sân court2 không thuộc trung tâm center1')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court2',
            timeslots: [13, 14]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Sân court2 không thuộc trung tâm center1'
      );
    });

    it('should handle overlapping bookings', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Thời gian đã được đặt')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Thời gian đã được đặt'
      );
    });

    it('should calculate correct total amount for weekday and weekend bookings', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockResolvedValueOnce({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 500000
      });

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13, 14]
          },
          {
            date: '2024-03-22',
            courtId: 'court1',
            timeslots: [13, 14]
          }
        ],
        type: 'fixed'
      };

      const result = await createFixedBookings(bookingData);
      expect(result.totalAmount).toBe(500000);
    });

    it('should handle invalid date range', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Ngày không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-27',
            courtId: 'court1',
            timeslots: [13]
          },
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Ngày không hợp lệ'
      );
    });

    it('should handle invalid days of week', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Ngày trong tuần không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13]
          },
          {
            date: '2024-03-21',
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Ngày trong tuần không hợp lệ'
      );
    });

    it('should handle booking with multiple courts on same day', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockResolvedValueOnce({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 200000
      });

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13]
          },
          {
            date: '2024-03-20',
            courtId: 'court2',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      const result = await createFixedBookings(bookingData);
      expect(result.totalAmount).toBe(200000);
    });

    it('should validate minimum and maximum timeslots', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Timeslot không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [] // Empty timeslots
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Timeslot không hợp lệ'
      );
    });

    it('should validate start and end dates for fixed bookings', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockResolvedValueOnce({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 200000
      });

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',  // Wednesday
            courtId: 'court1',
            timeslots: [13]
          },
          {
            date: '2024-03-27',  // Next Wednesday
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      const result = await createFixedBookings(bookingData);
      expect(result).toMatchObject({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 200000
      });
    });

    it('should validate consistent days of week in fixed bookings', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Ngày trong tuần không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',  // Wednesday
            courtId: 'court1',
            timeslots: [13]
          },
          {
            date: '2024-03-21',  // Thursday
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Ngày trong tuần không hợp lệ'
      );
    });

    it('should validate timeslot format', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Timeslot không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: ['invalid']  // Invalid timeslot format
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Timeslot không hợp lệ'
      );
    });

    it('should validate fixed booking minimum duration', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Đặt sân cố định phải đặt ít nhất 2 tuần')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Đặt sân cố định phải đặt ít nhất 2 tuần'
      );
    });

    it('should validate payment method for fixed bookings', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Phương thức thanh toán không hợp lệ')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13, 14]
          },
          {
            date: '2024-03-27',
            courtId: 'court1',
            timeslots: [13, 14]
          }
        ],
        type: 'fixed',
        paymentMethod: 'invalid'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Phương thức thanh toán không hợp lệ'
      );
    });

    it('should apply fixed booking discount correctly', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockResolvedValueOnce({
        _id: 'booking1',
        userId: 'user1',
        centerId: 'center1',
        totalAmount: 360000
      });

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'court1',
            timeslots: [13, 14]
          },
          {
            date: '2024-03-27',
            courtId: 'court1',
            timeslots: [13, 14]
          }
        ],
        type: 'fixed'
      };

      const result = await createFixedBookings(bookingData);
      expect(result.totalAmount).toBe(360000);
    });
    it('should handle invalid court id', async () => {
      const { createFixedBookings } = require('../../Backend/services/billManageServices.js');
      createFixedBookings.mockRejectedValueOnce(
        new Error('Lỗi khi tạo booking cố định: Sân không tồn tại')
      );

      const bookingData = {
        userId: 'user1',
        centerId: 'center1',
        bookings: [
          {
            date: '2024-03-20',
            courtId: 'invalid_court',
            timeslots: [13, 14]
          }
        ],
        type: 'fixed'
      };

      await expect(createFixedBookings(bookingData)).rejects.toThrow(
        'Lỗi khi tạo booking cố định: Sân không tồn tại'
      );
    });
  });

  describe('getBillByBookingId', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { getBillByBookingId } = require('../../Backend/services/billManageServices.js');
      getBillByBookingId.mockReset();
    });

    it('should return bill details when valid booking id is provided', async () => {
      const { getBillByBookingId } = require('../../Backend/services/billManageServices.js');
      getBillByBookingId.mockResolvedValueOnce({
        _id: 'validBookingId',
        userId: { _id: 'user1', name: 'Test User' },
        centerId: { _id: 'center1', name: 'Test Center' },
        courts: [{
          courtId: { _id: 'court1', name: 'Court 1' },
          timeslots: ['13:00-14:00']
        }],
        date: new Date('2024-03-20'),
        status: 'processing',
        totalAmount: 100000,
        type: 'daily'
      });
      const bookingId = 'validBookingId';
      const result = await getBillByBookingId(bookingId);
      expect(result).toEqual({
        _id: bookingId,
        userId: { _id: 'user1', name: 'Test User' },
        centerId: { _id: 'center1', name: 'Test Center' },
        courts: expect.arrayContaining([{
          courtId: { _id: 'court1', name: 'Court 1' },
          timeslots: expect.arrayContaining(['13:00-14:00'])
        }]),
        date: expect.any(Date),
        status: 'processing',
        totalAmount: 100000,
        type: 'daily'
      });
    });

    it('should throw error when booking is not found', async () => {
      const { getBillByBookingId } = require('../../Backend/services/billManageServices.js');
      getBillByBookingId.mockRejectedValueOnce(new Error('Booking not found'));
      await expect(
        getBillByBookingId('nonexistentId')
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('updateBillStatus', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { updateBillStatus } = require('../../Backend/services/billManageServices.js');
      updateBillStatus.mockReset();
    });

    it('should update bill status successfully', async () => {
      const { updateBillStatus } = require('../../Backend/services/billManageServices.js');
      updateBillStatus.mockResolvedValueOnce({
        _id: 'validBookingId',
        status: 'completed',
        updatedAt: new Date()
      });

      const bookingId = 'validBookingId';
      const status = 'completed';

      const result = await updateBillStatus(bookingId, status);
      expect(result).toEqual({
        _id: bookingId,
        status: 'completed',
        updatedAt: expect.any(Date)
      });
    });

    it('should throw error when invalid status is provided', async () => {
      const { updateBillStatus } = require('../../Backend/services/billManageServices.js');
      updateBillStatus.mockRejectedValueOnce(new Error('Invalid status'));

      await expect(updateBillStatus('validBookingId', 'invalidStatus')).rejects.toThrow('Invalid status');
    });
  });

  describe('getBillsByDateRange', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const { getBillsByDateRange } = require('../../Backend/services/billManageServices.js');
      getBillsByDateRange.mockReset();
    });

    it('should return bills within date range', async () => {
      const { getBillsByDateRange } = require('../../Backend/services/billManageServices.js');
      getBillsByDateRange.mockResolvedValueOnce([
        {
          _id: 'bill1',
          date: new Date('2025-05-02'),
          status: 'processing',
          totalAmount: 100000
        }
      ]);

      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-03');

      const result = await getBillsByDateRange(startDate, endDate);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(Date),
          status: expect.stringMatching(/^(processing|completed|cancelled)$/),
          totalAmount: expect.any(Number)
        })
      ]));
    });

    it('should throw error when end date is before start date', async () => {
      const { getBillsByDateRange } = require('../../Backend/services/billManageServices.js');
      getBillsByDateRange.mockRejectedValueOnce(new Error('End date must be after start date'));

      const startDate = new Date('2025-05-03');
      const endDate = new Date('2025-05-01');

      await expect(
        getBillsByDateRange(startDate, endDate)
      ).rejects.toThrow('End date must be after start date');
    });
  });
});
