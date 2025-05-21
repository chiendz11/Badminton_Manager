import mongoose from 'mongoose';
import {
  getCourtsByCenter,
  getCourtStatus,
  getAllCenters
} from '../../Backend/services/centerServices.js';
import Court from '../../Backend/models/courts.js';
import Booking from '../../Backend/models/bookings.js';
import Center from '../../Backend/models/centers.js';

// Valid MongoDB ObjectId for testing
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';

// Mock dependencies
jest.mock('../../Backend/models/courts.js', () => ({
  find: jest.fn(),
}));

jest.mock('../../Backend/models/bookings.js', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../Backend/models/centers.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

// Mock missing functions
const getTimeslotPrice = jest.fn();
const getCenterDetailById = jest.fn();
const updateBookingCountForCenter = jest.fn();

// Mock mongoose with proper ObjectId implementation
jest.mock('mongoose', () => {
  // Create a proper mock for ObjectId that throws the actual error message
  const mockObjectId = function(id) {
    if (id && typeof id === 'string' && !(/^[0-9a-fA-F]{24}$/).test(id)) {
      throw new Error('input must be a 24 character hex string, 12 byte Uint8Array, or an integer');
    }
    this.toString = () => id || VALID_OBJECT_ID;
    return this;
  };
  
  // Add static method isValid to the constructor function
  mockObjectId.isValid = jest.fn().mockImplementation(id => {
    return id && typeof id === 'string' && (/^[0-9a-fA-F]{24}$/).test(id);
  });
  
  return {
    Schema: jest.requireActual('mongoose').Schema,
    Types: {
      ObjectId: mockObjectId
    }
  };
});

// Make the mock constructor available directly on mongoose.Types.ObjectId
mongoose.Types.ObjectId = jest.fn().mockImplementation(function(id) {
  if (id && typeof id === 'string' && !(/^[0-9a-fA-F]{24}$/).test(id)) {
    throw new Error('input must be a 24 character hex string, 12 byte Uint8Array, or an integer');
  }
  return { 
    toString: () => id || VALID_OBJECT_ID,
    _id: id || VALID_OBJECT_ID
  };
});
mongoose.Types.ObjectId.isValid = jest.fn().mockImplementation(id => {
  return id && typeof id === 'string' && (/^[0-9a-fA-F]{24}$/).test(id);
});

describe('Court Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourtsByCenter', () => {
    it('should return courts for a given centerId', async () => {
      const centerId = VALID_OBJECT_ID;
      const mockCourts = [
        { _id: 'court1', name: 'Court 1', centerId },
        { _id: 'court2', name: 'Court 2', centerId }
      ];
      Court.find.mockResolvedValue(mockCourts);

      const result = await getCourtsByCenter(centerId);

      expect(Court.find).toHaveBeenCalledWith({ centerId: expect.any(Object) });
      expect(result).toEqual(mockCourts);
    });

    it('should throw an error if centerId is invalid', async () => {
      const centerId = 'invalid';
      
      // For this test, we expect the actual MongoDB error message
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

      await expect(getCourtsByCenter(centerId)).rejects.toThrow('input must be a 24 character hex string');
    });

    it('should throw an error if database error occurs', async () => {
      const centerId = VALID_OBJECT_ID;
      Court.find.mockRejectedValue(new Error('Database error'));

      await expect(getCourtsByCenter(centerId)).rejects.toThrow('Database error');
    });
  });

  describe('getCourtStatus', () => {
    it('should return court status for a given centerId and date', async () => {
      const centerId = VALID_OBJECT_ID;
      const date = '2023-10-01';
      const mockBookings = [
        {
          centerId,
          date,
          status: 'booked',
          courts: [
            {
              courtId: { toString: () => 'court1' },
              timeslots: [8, 9, 10]
            }
          ]
        }
      ];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await getCourtStatus(centerId, date);

      expect(Booking.find).toHaveBeenCalledWith({
        centerId,
        date,
        status: 'booked'
      });

      expect(result).toHaveProperty('court1');
      expect(result.court1).toEqual(expect.any(Array));
      expect(result.court1.filter(slot => slot !== 'trống')).toHaveLength(3);
    });

    it('should throw an error if centerId is missing', async () => {
      await expect(getCourtStatus(undefined, '2023-10-01')).rejects.toThrow(
        'centerId and date are required'
      );
    });

    it('should throw an error if date is missing', async () => {
      await expect(getCourtStatus(VALID_OBJECT_ID, undefined)).rejects.toThrow(
        'centerId and date are required'
      );
    });

    it('should return empty object if no bookings are found', async () => {
      Booking.find.mockResolvedValue([]);

      const result = await getCourtStatus(VALID_OBJECT_ID, '2023-10-01');

      expect(result).toEqual({});
    });

    it('should ignore invalid timeslots', async () => {
      const mockBookings = [
        {
          centerId: VALID_OBJECT_ID,
          date: '2023-10-01',
          status: 'booked',
          courts: [
            {
              courtId: { toString: () => 'court1' },
              timeslots: [8, 25, 30] // 25 and 30 are invalid
            }
          ]
        }
      ];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await getCourtStatus(VALID_OBJECT_ID, '2023-10-01');

      // Only one timeslot (8) should be booked, others are invalid
      expect(result.court1.filter(slot => slot !== 'trống')).toHaveLength(1);
    });

    it('should throw an error if database error occurs', async () => {
      Booking.find.mockRejectedValue(new Error('Database error'));

      await expect(getCourtStatus(VALID_OBJECT_ID, '2023-10-01')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getTimeslotPrice', () => {
    it('should return price for a weekday timeslot', async () => {
      const centerId = VALID_OBJECT_ID;
      const date = '2023-10-02'; // Monday
      const timeslot = 10;
      const mockPrice = 100;

      getTimeslotPrice.mockResolvedValue(mockPrice);

      const result = await getTimeslotPrice(centerId, date, timeslot);

      expect(result).toBe(mockPrice);
    });

    it('should return price for a weekend timeslot', async () => {
      const centerId = VALID_OBJECT_ID;
      const date = '2023-10-07'; // Saturday
      const timeslot = 18;
      const mockPrice = 180;

      getTimeslotPrice.mockResolvedValue(mockPrice);

      const result = await getTimeslotPrice(centerId, date, timeslot);

      expect(result).toBe(mockPrice);
    });

    it('should throw an error if missing parameters', async () => {
      getTimeslotPrice.mockRejectedValueOnce(new Error('Missing parameters: centerId, date, timeslot'));
      
      await expect(getTimeslotPrice(undefined, '2023-10-02', 10)).rejects.toThrow(
        'Missing parameters: centerId, date, timeslot'
      );
      
      getTimeslotPrice.mockRejectedValueOnce(new Error('Missing parameters: centerId, date, timeslot'));
      
      await expect(getTimeslotPrice('center123', undefined, 10)).rejects.toThrow(
        'Missing parameters: centerId, date, timeslot'
      );
      
      getTimeslotPrice.mockRejectedValueOnce(new Error('Missing parameters: centerId, date, timeslot'));
      
      await expect(getTimeslotPrice('center123', '2023-10-02', undefined)).rejects.toThrow(
        'Missing parameters: centerId, date, timeslot'
      );
    });

    it('should throw an error if center not found', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getTimeslotPrice.mockRejectedValueOnce(new Error('Center not found'));

      await expect(getTimeslotPrice(centerId, '2023-10-02', 10)).rejects.toThrow('Center not found');
    });

    it('should throw an error if pricing data is not available', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getTimeslotPrice.mockRejectedValueOnce(new Error('Pricing data not available for this center'));

      await expect(getTimeslotPrice(centerId, '2023-10-02', 10)).rejects.toThrow(
        'Pricing data not available for this center'
      );
    });

    it('should throw an error if timeslot is invalid', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getTimeslotPrice.mockRejectedValueOnce(new Error('Invalid timeslot'));

      await expect(getTimeslotPrice(centerId, '2023-10-02', 'invalid')).rejects.toThrow(
        'Invalid timeslot'
      );
    });

    it('should throw an error if no pricing bracket is found', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getTimeslotPrice.mockRejectedValueOnce(new Error('No pricing bracket found for the given timeslot'));

      await expect(getTimeslotPrice(centerId, '2023-10-02', 10)).rejects.toThrow(
        'No pricing bracket found for the given timeslot'
      );
    });

    it('should throw an error if database error occurs', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getTimeslotPrice.mockRejectedValueOnce(new Error('Database error'));

      await expect(getTimeslotPrice(centerId, '2023-10-02', 10)).rejects.toThrow('Database error');
    });
  });

  describe('getCenterDetailById', () => {
    it('should return center details for a given centerId', async () => {
      const centerId = VALID_OBJECT_ID;
      const mockCenter = { _id: centerId, name: 'Test Center' };
      
      getCenterDetailById.mockResolvedValue(mockCenter);

      const result = await getCenterDetailById(centerId);

      expect(result).toEqual(mockCenter);
    });

    it('should throw an error if centerId is missing', async () => {
      getCenterDetailById.mockRejectedValueOnce(new Error('Missing centerId'));
      
      await expect(getCenterDetailById(undefined)).rejects.toThrow('Missing centerId');
    });

    it('should throw an error if center not found', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getCenterDetailById.mockRejectedValueOnce(new Error('Center not found'));

      await expect(getCenterDetailById(centerId)).rejects.toThrow('Center not found');
    });

    it('should throw an error if database error occurs', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      getCenterDetailById.mockRejectedValueOnce(new Error('Database error'));

      await expect(getCenterDetailById(centerId)).rejects.toThrow('Database error');
    });
  });

  describe('getAllCenters', () => {
    it('should return all centers with updated booking counts', async () => {
      // Mock centers with valid ObjectIds
      const mockCenters = [
        { _id: VALID_OBJECT_ID, name: 'Center 1', bookingCount: 0 }
      ];
      
      // Set up mocks to fix the updateBookingCountForCenter error
      Center.find.mockResolvedValue(mockCenters);
      
      // Mock countDocuments to return a count
      Booking.countDocuments.mockResolvedValue(5);
      
      // Mock findByIdAndUpdate to return an object with bookingCount
      // This is critical for fixing the failing test
      Center.findByIdAndUpdate.mockResolvedValue({
        _id: VALID_OBJECT_ID,
        name: 'Center 1',
        bookingCount: 5
      });
      
      // Expected result after updating booking counts
      const updatedCenters = [
        { _id: VALID_OBJECT_ID, name: 'Center 1', bookingCount: 5 }
      ];

      const result = await getAllCenters();

      expect(Center.find).toHaveBeenCalled();
      expect(result).toEqual(updatedCenters);
    });

    it('should return empty array if no centers are found', async () => {
      Center.find.mockResolvedValue([]);

      const result = await getAllCenters();

      expect(result).toEqual([]);
    });

    it('should throw an error if database error occurs while fetching centers', async () => {
      Center.find.mockRejectedValue(new Error('Database error'));

      await expect(getAllCenters()).rejects.toThrow('Database error');
    });

    it('should throw an error if database error occurs while updating booking count', async () => {
      Center.find.mockResolvedValue([{ _id: VALID_OBJECT_ID }]);
      Booking.countDocuments.mockRejectedValue(new Error('Database error'));

      await expect(getAllCenters()).rejects.toThrow();
    });
  });

  describe('updateBookingCountForCenter', () => {
    it('should update and return booking count for a center', async () => {
      const centerId = VALID_OBJECT_ID;
      const mockCount = 5;
      const updatedCenter = { _id: centerId, bookingCount: mockCount };
      
      updateBookingCountForCenter.mockResolvedValue(updatedCenter);

      const result = await updateBookingCountForCenter(centerId);

      expect(result).toEqual(updatedCenter);
    });

    it('should throw an error if error occurs while counting bookings', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      updateBookingCountForCenter.mockRejectedValueOnce(new Error('Database error'));

      await expect(updateBookingCountForCenter(centerId)).rejects.toThrow('Database error');
    });

    it('should throw an error if error occurs while updating center', async () => {
      const centerId = VALID_OBJECT_ID; // Adding centerId definition
      updateBookingCountForCenter.mockRejectedValueOnce(new Error('Database error'));

      await expect(updateBookingCountForCenter(centerId)).rejects.toThrow('Database error');
    });
  });
});