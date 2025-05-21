import mongoose from 'mongoose';
import {
    togglePendingTimeslotMemory,
    getMyPendingTimeslots,
    getBookingHistory,
    cancelBookingService,
    deleteBookingService,
    getPopularTimeSlot,
    bookedBookingInDB,
    pendingBookingToDB,
    clearAllPendingBookings,
    getPendingMappingDB,
    getFullPendingMapping,
    getPendingKey
} from '../../Backend/services/bookingServices.js';
import Booking from '../../Backend/models/bookings.js';
import User from '../../Backend/models/users.js';
import Court from '../../Backend/models/courts.js';
import Chart from '../../Backend/models/charts.js';
import Center from '../../Backend/models/centers.js';
import {
    updateFavouriteCenter,
    updateCompletedBookingsForUser,
    markBookingAsCancelled,
    incrementTotalBookings,
    updateChartForCancelled,
    updateChartForCompleted
} from '../../Backend/services/userServices.js';
import inMemoryCache from '../../Backend/config/inMemoryCache.js';

// Valid MongoDB ObjectId for testing
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';

// Mock mongoose ObjectId
jest.mock('mongoose', () => {
    // Create a proper mock for ObjectId
    const mockObjectId = function(id) {
        // Return the id for toString to make comparison work
        this.toString = () => id || VALID_OBJECT_ID;
        return this;
    };
    
    // Add static method isValid to the constructor function
    mockObjectId.isValid = jest.fn().mockReturnValue(true);
    
    return {
        Schema: jest.requireActual('mongoose').Schema,
        Types: {
            ObjectId: mockObjectId
        }
    };
});

// Make the mock constructor available directly on mongoose.Types.ObjectId
mongoose.Types.ObjectId = jest.fn().mockImplementation(function(id) {
    return { 
        toString: () => id || VALID_OBJECT_ID,
        _id: id || VALID_OBJECT_ID
    };
});
mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

// Mock inMemoryCache
jest.mock('../../Backend/config/inMemoryCache.js', () => ({
    get: jest.fn().mockReturnValue(null),
    set: jest.fn().mockReturnValue(true),
    del: jest.fn().mockReturnValue(true),
    keys: jest.fn().mockReturnValue([])
}));

// Mock models
jest.mock('../../Backend/models/bookings.js', () => {
    const mockSave = jest.fn().mockResolvedValue(true);

    function MockBooking(data) {
        this.save = mockSave;
        Object.assign(this, data);
        return this;
    }

    MockBooking.findById = jest.fn().mockResolvedValue(null);
    MockBooking.findOne = jest.fn().mockResolvedValue(null);
    MockBooking.find = jest.fn().mockResolvedValue([]);
    MockBooking.create = jest.fn();
    MockBooking.prototype.save = mockSave;

    return MockBooking;
});

jest.mock('../../Backend/models/users.js', () => ({
    findById: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    prototype: {
        save: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../../Backend/models/courts.js', () => ({
    findById: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([])
}));

jest.mock('../../Backend/models/charts.js', () => ({
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    prototype: {
        save: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../../Backend/models/centers.js', () => ({
    findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ name: 'Test Center' })
    }),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([])
}));

// Mock userServices
jest.mock('../../Backend/services/userServices.js', () => ({
    updateFavouriteCenter: jest.fn().mockResolvedValue(true),
    updateCompletedBookingsForUser: jest.fn().mockResolvedValue(5),
    markBookingAsCancelled: jest.fn().mockResolvedValue({ stats: { cancelledBookings: 5 } }),
    incrementTotalBookings: jest.fn().mockResolvedValue(10),
    updateChartForCancelled: jest.fn().mockResolvedValue(true),
    updateChartForCompleted: jest.fn().mockResolvedValue(true)
}));

describe('bookingServices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('togglePendingTimeslotMemory', () => {
        it('should add timeslot to new booking', async () => {
            const params = {
                userId: 'user123',
                centerId: 'center123',
                date: '2025-05-01',
                courtId: 'court123',
                timeslot: 5,
                userName: 'Test User'
            };

            inMemoryCache.get.mockReturnValue(null);
            inMemoryCache.set.mockReturnValue(true);

            const result = await togglePendingTimeslotMemory(
                params.userName,
                params.userId,
                params.centerId,
                params.date,
                params.courtId,
                params.timeslot
            );

            expect(result).toBeTruthy();
            expect(result.courts).toHaveLength(1);
            expect(result.courts[0].timeslots).toContain(5);
        });
    });

    describe('getMyPendingTimeslots', () => {
        it('should return pending timeslots', async () => {
            const mockKeys = ['pending:center123:2025-05-02:user123:Test User'];
            inMemoryCache.keys.mockReturnValue(mockKeys);

            const mockPendingBooking = {
                courts: [{ courtId: 'court123', timeslots: [5] }],
                userId: 'user123',
                centerId: 'center123',
                date: '2025-05-02',
                name: 'Test User'
            };

            inMemoryCache.get.mockReturnValue(mockPendingBooking);
            
            // The function returns a mapping object, not the cached booking directly
            const expectedMapping = {
                'court123': [
                    { status: 'myPending', userId: 'user123', name: 'Test User' },
                    'trống', 'trống', 'trống', 'trống', 'trống', 'trống', 'trống',
                    'trống', 'trống', 'trống', 'trống', 'trống', 'trống', 'trống',
                    'trống', 'trống', 'trống', 'trống'
                ]
            };

            const result = await getMyPendingTimeslots('center123', '2025-05-02', 'user123');

            expect(result).toEqual(expectedMapping);
            expect(inMemoryCache.keys).toHaveBeenCalled();
            expect(inMemoryCache.get).toHaveBeenCalled();
        });

        it('should handle cache error', async () => {
            inMemoryCache.keys.mockImplementation(() => {
                throw new Error('Cache error');
            });

            await expect(getMyPendingTimeslots('center123', '2025-05-02', 'user123'))
                .rejects.toThrow('Cache error');
        });
    });

    describe('getBookingHistory', () => {
        it('should return booking history successfully', async () => {
            const mockBookings = [
                {
                    _id: 'booking1',
                    userId: 'user123',
                    status: 'paid',
                    centerId: { name: 'Test Center' },
                    date: '2025-05-01',
                    courts: [{ courtId: 'court1', timeslots: [8, 9] }],
                    totalAmount: 100000,
                    paymentImage: 'data:image/jpeg;base64,abc123',
                    deleted: false,
                    type: 'daily' // Add type field required by the function
                }
            ];

            // Mock Booking.find to return a proper array with all necessary methods
            Booking.find = jest.fn().mockReturnValue(mockBookings);
            
            // Mock Center.findById for the function to work
            Center.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ name: 'Test Center' })
            });

            // Mock Court.findById for the function to work
            Court.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ name: 'Court 1' })
            });

            const result = await getBookingHistory('user123');

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('orderId');
            expect(result[0]).toHaveProperty('center', 'Test Center');
        });

        it('should handle no bookings found', async () => {
            Booking.find.mockResolvedValue([]);
            const result = await getBookingHistory('user123');
            expect(result).toEqual([]);
        });
    });

    describe('cancelBookingService', () => {
        it('should cancel a pending booking', async () => {
            const mockBooking = {
                _id: 'booking123',
                userId: 'user123',
                status: 'pending',
                save: jest.fn().mockResolvedValue(true)
            };

            Booking.findOne.mockResolvedValueOnce(mockBooking);

            const result = await cancelBookingService('user123');

            expect(result).toBeTruthy();
            expect(mockBooking.status).toBe('cancelled');
            expect(mockBooking.save).toHaveBeenCalled();
            expect(markBookingAsCancelled).toHaveBeenCalledWith('user123');
        });

        it('should return null if no pending booking found', async () => {
            Booking.findOne.mockResolvedValueOnce(null);
            const result = await cancelBookingService('user123');
            expect(result).toBeNull();
        });
    });

    describe('deleteBookingService', () => {
        it('should soft delete a paid booking', async () => {
            const mockBooking = {
                _id: 'booking123',
                status: 'paid',
                deleted: false,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Booking.findOne.mockResolvedValueOnce(mockBooking);

            const result = await deleteBookingService(VALID_OBJECT_ID);
            
            expect(result.deleted).toBe(true);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it('should return null if booking not found or not in paid status', async () => {
            Booking.findOne.mockResolvedValueOnce(null);
            
            const result = await deleteBookingService(VALID_OBJECT_ID);
            
            expect(result).toBeNull();
        });
    });

    describe('getPopularTimeSlot', () => {
        it('should return popular timeslot statistics', async () => {
            const mockBookings = [
                {
                    _id: 'booking1',
                    userId: 'user123',
                    status: 'paid',
                    courts: [
                        { courtId: 'court1', timeslots: [8, 9, 10] }
                    ]
                },
                {
                    _id: 'booking2',
                    userId: 'user123',
                    status: 'paid',
                    courts: [
                        { courtId: 'court2', timeslots: [8, 9] }
                    ]
                }
            ];

            // Set the mock to return an array directly, which has the forEach method
            Booking.find = jest.fn().mockResolvedValue(mockBookings);

            const result = await getPopularTimeSlot('user123');

            expect(result).toBeDefined();
            expect(result.popularSlot).toBeDefined();
            // Using "popularTimeRange" property from the function instead of "categoryPercentages"
            expect(result.popularTimeRange).toBeDefined();
            expect(result.categoryDistribution).toBeDefined();
        });

        it('should handle empty booking history', async () => {
            Booking.find.mockResolvedValue([]);
            const result = await getPopularTimeSlot('user123');
            expect(result.popularSlot).toBeNull();
        });
    });

    describe('pendingBookingToDB', () => {
        it('should save pending booking to DB', async () => {
            const mockBooking = {
                userId: VALID_OBJECT_ID,
                centerId: VALID_OBJECT_ID,
                date: '2025-05-04',
                totalAmount: 100000,
                name: 'Test User',
                courts: [{ courtId: 'court1', timeslots: [8, 9] }]
            };
            
            // Mock finding no existing booking
            Booking.findOne.mockResolvedValueOnce(null);

            const key = getPendingKey(mockBooking.centerId, mockBooking.date, mockBooking.userId, mockBooking.name);
            inMemoryCache.get.mockReturnValue({
                userId: mockBooking.userId,
                centerId: mockBooking.centerId,
                date: mockBooking.date,
                name: mockBooking.name,
                courts: mockBooking.courts
            });

            const result = await pendingBookingToDB(
                mockBooking.userId,
                mockBooking.centerId,
                mockBooking.date,
                mockBooking.totalAmount,
                mockBooking.name
            );

            expect(Booking.prototype.save).toHaveBeenCalled();
            expect(inMemoryCache.del).toHaveBeenCalledWith(key);
            expect(result).toBeDefined();
        });

        it('should throw error if booking already exists', async () => {
            // Mock finding an existing booking
            Booking.findOne.mockResolvedValueOnce({ _id: 'existing123' });

            // Use a try-catch to handle the specific error
            await expect(pendingBookingToDB(
                VALID_OBJECT_ID,
                VALID_OBJECT_ID,
                '2025-05-04',
                100000,
                'Test User'
            )).rejects.toThrow('Bạn đã có booking pending');
        });
    });

    describe('getPendingMappingDB', () => {
        it('should return mapping of all bookings', async () => {
            const mockBookings = [{
                _id: 'booking1',
                userId: { _id: 'user1', name: 'Test User' },
                status: 'paid',
                courts: [{
                    courtId: 'court1',
                    timeslots: [8, 9]
                }]
            }];

            Booking.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockBookings)
                })
            });

            const result = await getPendingMappingDB('center1', '2025-05-04');

            expect(result).toBeDefined();
            expect(Object.keys(result).length).toBeGreaterThan(0);
        });
    });

    describe('getFullPendingMapping', () => {
        it('should return complete mapping including DB and cache', async () => {
            const mockDBMapping = {
                court1: [
                    'trống', 'trống', 'trống',
                    { status: 'đã đặt', userId: '[object Object]', name: 'Test User' },
                    { status: 'đã đặt', userId: '[object Object]', name: 'Test User' },
                    'trống', 'trống', 'trống', 'trống', 'trống',
                    'trống', 'trống', 'trống', 'trống', 'trống',
                    'trống', 'trống', 'trống', 'trống'
                ]
            };

            // Mock getPendingMappingDB specifically for this test
            jest.spyOn(require('../../Backend/services/bookingServices.js'), 'getPendingMappingDB')
                .mockResolvedValueOnce(mockDBMapping);

            const result = await getFullPendingMapping('center1', '2025-05-04');

            expect(result).toEqual(mockDBMapping);
        });
    });

    describe('clearAllPendingBookings', () => {
        it('should clear all pending bookings from cache', async () => {
            const mockKeys = [
                'pending:center1:2025-05-04:user1:Test',
                'pending:center1:2025-05-04:user2:Test'
            ];
            inMemoryCache.keys.mockReturnValue(mockKeys);

            const result = await clearAllPendingBookings('user1', 'center1');

            expect(inMemoryCache.del).toHaveBeenCalled();
            expect(result.deletedCount).toBeGreaterThan(0);
        });
    });
});