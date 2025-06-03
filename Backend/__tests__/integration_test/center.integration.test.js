import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Center from '../../src/models/centers.js';
import Court from '../../src/models/courts.js';
import Booking from '../../src/models/bookings.js';
import * as db from '../test-utils/db.js';

jest.mock('../../src/config/socket.js', () => ({
  initializeSocket: jest.fn(),
}));
jest.mock('../../src/config/dbChangeStream.js', () => ({
  setupBookingChangeStream: jest.fn(),
  closeBookingChangeStream: jest.fn(),
  watchBookingChanges: jest.fn(),
}));

describe('Center Routes Functional Tests (with MongoDB Local)', () => {
  let cookies = ''; // Store session cookies

  beforeAll(async () => {
    await db.connect();
    console.log('DEBUG: Bắt đầu tạo dữ liệu giả lập.');
    console.log('DEBUG: Trạng thái kết nối Mongoose trước Center.save():', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB: Kết nối không sẵn sàng (readyState: ${mongoose.connection.readyState})`);
    }
    console.log('MongoDB: Database name:', mongoose.connection.db.databaseName);
    console.log('MongoDB: Collections:', await mongoose.connection.db.listCollections().toArray());
  }, 60000);

  beforeEach(async () => {
    await db.clearDatabase();
    cookies = ''; // Reset cookies before each test
  });

  afterAll(async () => {
    await db.closeDatabase();
  }, 20000);

  const createCenterAndCourts = async () => {
    try {
      const center = await new Center({
        name: "Nhà thi đấu quận Thanh Xuân",
        address: "166 Khuất Duy Tiến– Nhân Chính - Thanh Xuân - Hà Nội",
        phone: "0977123456",
        totalCourts: 4,
        avgRating: 4.818181818181818,
        location: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.7787234089237!2d105.79467477503064!3d21.001505280641073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135aca4d912cf21%3A0x1618049eb0b739cc!2sThanh%20Xu%C3%A2n%20Community%20Center!5e0!3m2!1sen!2s!4v1743087169765!5m2!1sen!2s",
        pricing: {
          weekday: [
            { startTime: "5:00", endTime: "17:00", price: 70000 },
            { startTime: "17:00", endTime: "22:00", price: 130000 },
            { startTime: "22:00", endTime: "24:00", price: 100000 }
          ],
          weekend: [
            { startTime: "5:00", endTime: "17:00", price: 80000 },
            { startTime: "17:00", endTime: "22:00", price: 140000 },
            { startTime: "22:00", endTime: "24:00", price: 110000 }
          ]
        },
        imgUrl: ["/images/center2.jpg"],
        description: 'Test',
        facilities: ["Bãi đỗ xe"],
        bookingCount: 0,
      }).save();

      console.log('MongoDB: Created center:', center._id);

      const court1 = await new Court({
        centerId: center._id,
        name: 'Sân 1 - Test'
      }).save();
      const court2 = await new Court({
        centerId: center._id,
        name: 'Sân 2 - Test'
      }).save();

      console.log('MongoDB: Created courts:', court1._id, court2._id);

      const centerCount = await Center.countDocuments({ _id: center._id });
      const courtCount = await Court.countDocuments({ centerId: center._id });
      console.log('MongoDB: Center count:', centerCount, 'Court count:', courtCount);

      if (centerCount === 0 || courtCount !== 2) {
        throw new Error('Failed to create mock data: Center or courts not found in database');
      }

      return { centerId: center._id.toString(), courtId1: court1._id.toString(), courtId2: court2._id.toString() };
    } catch (error) {
      console.error('MongoDB: Error creating mock data:', error.message);
      throw error;
    }
  };

  const getCsrfToken = async () => {
    const response = await global.request.get('/api/csrf-token').set('Cookie', cookies);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('csrfToken');
    // Store session cookie from response)
    cookies = response.headers['set-cookie'] || cookies;
    return response.body.csrfToken;
  };

  describe('GET /api/centers/getCourts', () => {
    it('should return courts for a specific center', async () => {
      const { centerId, courtId1, courtId2 } = await createCenterAndCourts();
      const response = await global.request.get('/api/centers/getCourts').query({ centerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('_id', courtId1);
      expect(response.body.data[1]).toHaveProperty('_id', courtId2);
    }, 40000);

    it('should return empty array if centerId does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await global.request.get('/api/centers/getCourts').query({ centerId: nonExistentId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    }, 40000);
  });

  describe('POST /api/centers/slotPrice', () => {
    it('should return timeslot price for weekday (5:00-17:00)', async () => {
      const { centerId } = await createCenterAndCourts();
      const csrfToken = await getCsrfToken();
      const response = await global.request
        .post('/api/centers/slotPrice')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookies)
        .send({ centerId, date: '2025-05-27', timeslot: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('price', 70000);
    }, 40000);

    it('should return timeslot price for weekend (5:00-17:00)', async () => {
      const { centerId } = await createCenterAndCourts();
      const csrfToken = await getCsrfToken();
      const response = await global.request
        .post('/api/centers/slotPrice')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookies)
        .send({ centerId, date: '2025-05-25', timeslot: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('price', 80000);
    }, 40000);

    it('should return error for invalid centerId', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const csrfToken = await getCsrfToken();
      const response = await global.request
        .post('/api/centers/slotPrice')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookies)
        .send({ centerId: nonExistentId, date: '2025-05-27', timeslot: 10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Center not found');
    }, 40000);

    it('should return error for missing CSRF token', async () => {
      const { centerId } = await createCenterAndCourts();
      const response = await global.request
        .post('/api/centers/slotPrice')
        .set('Cookie', cookies)
        .send({ centerId, date: '2025-05-27', timeslot: 10 });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid CSRF token');
    }, 40000);

    it('should return error for invalid CSRF token', async () => {
      const { centerId } = await createCenterAndCourts();
      const response = await global.request
        .post('/api/centers/slotPrice')
        .set('X-CSRF-Token', 'invalid-token')
        .set('Cookie', cookies)
        .send({ centerId, date: '2025-05-27', timeslot: 10 });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid CSRF token');
    }, 40000);
  });

  describe('GET /api/centers/pricing', () => {
    it('should return center pricing by ID', async () => {
      const { centerId } = await createCenterAndCourts();
      const response = await global.request.get('/api/centers/pricing').query({ centerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.pricing.weekday[0]).toHaveProperty('price', 70000);
    }, 40000);

    it('should return error if center not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await global.request.get('/api/centers/pricing').query({ centerId: nonExistentId });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Center not found');
    }, 40000);
  });

  describe('GET /api/centers/infoing', () => {
    it('should return center info by ID', async () => {
      const { centerId } = await createCenterAndCourts();
      const response = await global.request.get('/api/centers/infoing').query({ centerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Nhà thi đấu quận Thanh Xuân');
    }, 40000);

    it('should return error if center not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toHexString();
      const response = await global.request.get('/api/centers/infoing').query({ centerId: nonExistentId });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Center not found');
    }, 40000);
  });

  describe('GET /api/centers/getAllCenters', () => {
    it('should return all centers including booking count', async () => {
      const { centerId, courtId1 } = await createCenterAndCourts();
      await new Booking({
        userId: new mongoose.Types.ObjectId(),
        centerId,
        date: new Date('2025-06-17'),
        courts: [{ courtId: courtId1, timeslots: [20] }],
        totalAmount: 100000,
        status: 'processing',
        type: 'daily',
        bookingCode: '#Bill2025052215448851',
        pointEarned: 0,
      }).save();

      const bookingCount = await Booking.countDocuments({ centerId });
      console.log('MongoDB: Booking count:', bookingCount);

      const response = await global.request.get('/api/centers/getAllCenters');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('bookingCount', 0);

      await new Booking({
        userId: new mongoose.Types.ObjectId(),
        centerId,
        date: new Date('2025-06-18'),
        courts: [{ courtId: courtId1, timeslots: [8] }],
        totalAmount: 50000,
        status: 'paid',
        bookingCode: '#BOOKED_TEST_CODE',
        type: 'daily'
      }).save();

      const responseAfter = await global.request.get('/api/centers/getAllCenters');
      expect(responseAfter.status).toBe(200);
      expect(responseAfter.body).toHaveProperty('success', true);
      expect(responseAfter.body.data[0]).toHaveProperty('bookingCount', 1);
    }, 60000);
  });
});