
import mongoose from 'mongoose';
import db from '../test-utils/db.js';
import User from '../../src/models/users.js';
import Center from '../../src/models/centers.js';
import Court from '../../src/models/courts.js';
import Booking from '../../src/models/bookings.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import inMemoryCache from '../../src/config/inMemoryCache.js';

// Mock external dependencies
jest.mock('../../src/config/socket.js', () => ({
  initializeSocket: jest.fn(),
}));
jest.mock('../../src/config/dbChangeStream.js', () => ({
  setupBookingChangeStream: jest.fn(),
  closeBookingChangeStream: jest.fn(),
  watchBookingChanges: jest.fn(),
}));
jest.mock('../../src/middleware/userMiddleware.js', () => ({
  sendEmailService: jest.fn().mockResolvedValue(true),
  checkEmailExistsService: jest.fn().mockResolvedValue({ success: true }),
  checkEmailUniqueness: jest.fn().mockResolvedValue({ success: true }),
  updateAvgRating: jest.fn().mockResolvedValue(true),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));
jest.mock('../../src/services/userServices.js', () => ({
  updateCompletedBookingsForUser: jest.fn().mockResolvedValue(true),
  updateChartForCompleted: jest.fn().mockResolvedValue(true),
  updateFavouriteCenter: jest.fn().mockResolvedValue(true),
  markBookingAsCancelled: jest.fn().mockResolvedValue(true),
  incrementTotalBookings: jest.fn().mockResolvedValue(true),
  updateChartForCancelled: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/services/bookingServices.js', () => {
  const originalModule = jest.requireActual('../../src/services/bookingServices.js');
  return {
    ...originalModule,
    getPendingKey: jest.fn().mockImplementation((centerId, date, userId, name) => {
      return `pending:${centerId}:${date}:${userId}:${name}`;
    }),
  };
});

// Mock console.log to capture logs if needed
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Booking API Integration Tests', () => {
  let token;
  let cookies = [];
  let csrfToken;
  let user;
  let center;
  let court1;
  let court2;

  const currentTestFileDir = path.dirname(fileURLToPath(import.meta.url));
  const samplePaymentImageFilePath = path.join(currentTestFileDir, '..', 'encoded.txt');
  let samplePaymentImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    await db.connect();
    console.log('MongoDB: Connected for Booking API tests');

    try {
      const fileContent = fs.readFileSync(samplePaymentImageFilePath, 'utf8').trim();
      const matches = fileContent.match(/^data:(.*);base64,(.*)$/);
      if (matches && matches.length === 3) {
        samplePaymentImage = fileContent;
      }
    } catch (error) {
      console.error('Error reading encoded.txt or invalid format:', error);
    }
  }, 36000);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    await db.clearDatabase();
    inMemoryCache.flushAll();
    cookies = [];

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    user = await User.create({
      _id: new mongoose.Types.ObjectId('67bd323489acfa439c4d7947'),
      name: 'HuyHoàng',
      email: 'thuha25121976@gmail.com',
      phone_number: '0901234567',
      username: 'user07',
      password_hash: hashedPassword,
      avatar_image_path: '/Uploads/1748233605549-Screenshot_2025-03-21_230225.png',
      level: 'Bạch kim',
      points: 4600,
      stats: {
        totalBookings: 463,
        completedBookings: 0,
        cancelledBookings: 3,
        averagePlayTime: '0 phút',
      },
    });
    console.log('MongoDB: Created user:', user._id);

    center = await Center.create({
      _id: new mongoose.Types.ObjectId('67ca6e3cfc964efa218ab7d8'),
      name: 'Nhà thi đấu quận Thanh Xuân',
      address: '166 Khuất Duy Tiến – Nhân Chính - Thanh Xuân - Hà Nội',
      phone: '0977123456',
      totalCourts: 4,
      avgRating: 4.818181818181818,
      location: 'https://www.google.com/maps/embed?...',
      pricing: {
        weekday: [
          { startTime: '5:00', endTime: '17:00', price: 70000 },
          { startTime: '17:00', endTime: '22:00', price: 130000 },
          { startTime: '22:00', endTime: '24:00', price: 100000 },
        ],
        weekend: [
          { startTime: '5:00', endTime: '17:00', price: 80000 },
          { startTime: '17:00', endTime: '22:00', price: 140000 },
          { startTime: '22:00', endTime: '24:00', price: 110000 },
        ],
      },
      imgUrl: ['/images/center2.jpg', '/images/center2-1.jpg'],
      description: 'Nhà thi đấu quận Thanh Xuân...',
      facilities: ['Bãi đỗ xe rộng', 'Huấn luyện viên'],
      bookingCount: 0,
    });
    console.log('MongoDB: Created center:', center._id);

    court1 = await Court.create({
      _id: new mongoose.Types.ObjectId('68380fd4e63f0940c30dee6c'),
      centerId: center._id,
      name: 'Sân 1 - Test',
    });
    court2 = await Court.create({
      _id: new mongoose.Types.ObjectId('68380fd4e63f0940c30dee88'),
      centerId: center._id,
      name: 'Sân 2 - Test',
    });
    console.log('MongoDB: Created courts:', court1._id, court2._id);

    const loginResponse = await global.request
      .post('/api/users/login')
      .send({ username: 'user07', password: 'Password123!' })
      .expect(200);
    cookies = loginResponse.headers['set-cookie'] || [];
    if (!cookies.length) {
      throw new Error('No cookies received from /api/users/login');
    }
    const tokenMatch = cookies.find(c => c.includes('token='))?.match(/token=([^;]+)/);
    token = tokenMatch ? tokenMatch[1] : null;
    if (!token) {
      throw new Error('No JWT token found in cookies');
    }
    console.log('JWT token:', token);

    const csrfResponse = await global.request
      .get('/api/csrf-token')
      .set('Cookie', cookies)
      .expect(200);
    expect(csrfResponse.body).toHaveProperty('csrfToken');
    csrfToken = csrfResponse.body.csrfToken;
    console.log('CSRF token:', csrfToken);

    const sidMatch = csrfResponse.headers['set-cookie']?.find(c => c.includes('connect.sid'))?.match(/connect\.sid=([^;]+)/);
    const connectSid = sidMatch ? sidMatch[1] : null;
    if (connectSid) {
      cookies.push(`connect.sid=${connectSid}`);
    }
    console.log('Cookies:', cookies);
  }, 36000);

  afterAll(async () => {
    await db.closeDatabase();
    console.log('MongoDB: Disconnected after tests');
  }, 12000);

  const getCsrfToken = async () => {
    const response = await global.request
      .get('/api/csrf-token')
      .set('Cookie', cookies)
      .expect(200);
    expect(response.body).toHaveProperty('csrfToken');
    csrfToken = response.body.csrfToken;
    console.log('Updated CSRF token:', csrfToken);

    const sidMatch = response.headers['set-cookie']?.find(c => c.includes('connect.sid'))?.match(/connect\.sid=([^;]+)/);
    const connectSid = sidMatch ? sidMatch[1] : null;
    if (connectSid) {
      cookies.push(`connect.sid=${connectSid}`);
    }
    return csrfToken;
  };

  describe('POST /api/booking/pending/toggle', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      inMemoryCache.flushAll();
    });

    it('should toggle timeslot to pending successfully', async () => {
      const response = await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 10,
          ttl: 60,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.status).toBe('pending');
      expect(response.body.booking.userId).toBe(user._id.toString());
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );
    });

    it('should return 400 for invalid timeslot', async () => {
      const response = await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: -1,
          ttl: 60,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Timeslot không hợp lệ');
    });

    it('should return 400 for invalid courtId', async () => {
      const invalidCourtId = new mongoose.Types.ObjectId().toString();
      const response = await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: invalidCourtId,
          timeslot: 10,
          ttl: 60,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Court không tồn tại');
    });

    it('should return 400 if centerId is missing', async () => {
      const response = await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 10,
          ttl: 60,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('CenterId là bắt buộc');
    });
  });

  describe('POST /api/booking/pending/pendingBookingToDB', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      inMemoryCache.flushAll();
      const cacheKey = `pending:${center._id.toString()}:2025-05-29:${user._id.toString()}:${user.name}`;
      inMemoryCache.set(
        cacheKey,
        {
          name: user.name,
          userId: user._id.toString(),
          centerId: center._id.toString(),
          date: '2025-05-29',
          status: 'pending',
          courts: [{ courtId: court1._id.toString(), timeslots: [10] }],
        },
        60
      );
    });

    it('should save pending booking to DB successfully', async () => {
      const response = await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.status).toBe('pending');
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );
    });

    it('should return 400 if cache is empty', async () => {
      inMemoryCache.flushAll();
      const response = await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy booking pending trong cache');
    });

    it('should return 400 if timeslot is already booked', async () => {
      await Booking.create({
        userId: new mongoose.Types.ObjectId(),
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'paid',
        courts: [{ courtId: court1._id, timeslots: [10] }],
        totalAmount: 140000,
      });

      const response = await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Timeslot đã được đặt');
    });

    it('should return 400 if user has existing pending booking for the same day', async () => {
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'pending',
        courts: [{ courtId: court2._id, timeslots: [11] }],
        totalAmount: 140000,
      });

      const response = await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Bạn đã có booking pending trên trung tâm này');
    });
  });

  describe('POST /api/booking/pending/bookedBookingInDB', () => {
    let pendingBooking;

    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      inMemoryCache.flushAll();
      const cacheKey = `pending:${center._id.toString()}:2025-05-29:${user._id.toString()}:${user.name}`;
      inMemoryCache.set(
        cacheKey,
        {
          name: user.name,
          userId: user._id.toString(),
          centerId: center._id.toString(),
          date: '2025-05-29',
          status: 'pending',
          courts: [{ courtId: court1._id.toString(), timeslots: [10] }],
        },
        60
      );

      const response = await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(200);

      pendingBooking = response.body.booking;
    });

    it('should confirm booking with paymentImage successfully', async () => {
      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          paymentImage: samplePaymentImage,
          note: 'Test booking',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.status).toBe('processing');
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );
    });

    it('should return 400 if no paymentImage is provided', async () => {
      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          note: 'Test booking',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Dữ liệu ảnh thanh toán không đúng định dạng');
    });

    it('should return 400 if pending booking does not exist', async () => {
      await Booking.deleteMany({});
      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          paymentImage: samplePaymentImage,
          note: 'Test booking',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy booking pending trong DB');
    });

    it('should return 400 if note is too long', async () => {
      const longNote = 'A '.repeat(501);
      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          paymentImage: samplePaymentImage,
          note: longNote,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ghi chú không được vượt quá 500 từ');
    });

    it('should return 400 if paymentImage is invalid', async () => {
      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          paymentImage: 'invalid_base64',
          note: 'Test booking',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Dữ liệu ảnh thanh toán không đúng định dạng');
    });

    it('should return 400 if timeslot conflicts with another booking', async () => {
      await Booking.create({
        userId: new mongoose.Types.ObjectId(),
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'paid',
        courts: [{ courtId: court1._id, timeslots: [10] }],
        totalAmount: 140000,
      });

      await Booking.deleteMany({ userId: user._id });
      await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
        })
        .expect(200);

      const response = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 140000,
          paymentImage: samplePaymentImage,
          note: 'Test booking',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Timeslot đã bị đặt bởi người khác');
    });
  });

  describe('POST /api/booking/pending/clear-all', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 9,
          ttl: 60,
        })
        .expect(200);
      await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 10,
          ttl: 60,
        })
        .expect(200);
    });

    it('should clear all pending timeslots for user at a center', async () => {
      let myPending = await global.request
        .get(`/api/booking/pending/my-timeslots?centerId=${center._id.toString()}&date=2025-05-29`)
        .set('Cookie', cookies)
        .expect(200);

      expect(myPending.body.success).toBe(true);
      expect(myPending.body.mapping).toBeDefined();
      expect(myPending.body.mapping[court1._id.toString()]).toBeDefined();
      expect(myPending.body.mapping[court1._id.toString()][4]).toEqual(expect.objectContaining({ status: 'myPending' }));

      const response = await global.request
        .post('/api/booking/pending/clear-all')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ centerId: center._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('deletedCount');
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );

      myPending = await global.request
        .get(`/api/booking/pending/my-timeslots?centerId=${center._id.toString()}&date=2025-05-29`)
        .set('Cookie', cookies)
        .expect(200);

      expect(myPending.body.success).toBe(true);
      expect(myPending.body.mapping[court1._id.toString()] || []).toEqual([]);
    });

    it('should return 400 for invalid centerId', async () => {
      const response = await global.request
        .post('/api/booking/pending/clear-all')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ centerId: 'invalid-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid centerId');
    });
  });

  describe('GET /api/booking/pending/my-timeslots', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 10,
          ttl: 60,
        })
        .expect(200);
    });

    it('should retrieve user’s pending timeslots', async () => {
      const response = await global.request
        .get(`/api/booking/pending/my-timeslots?centerId=${center._id.toString()}&date=2025-05-29`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mapping[court1._id.toString()]).toBeDefined();
      expect(response.body.mapping[court1._id.toString()][5]).toEqual(expect.objectContaining({
        status: 'myPending',
        userId: user._id.toString(),
        name: user.name,
      }));
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );
    });

    it('should return empty mapping if centerId or date is missing', async () => {
      const response = await global.request
        .get(`/api/booking/pending/my-timeslots?centerId=${center._id.toString()}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mapping).toEqual({});
    });
  });

  describe('GET /api/booking/pending/mapping', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'pending',
        courts: [{ courtId: court1._id, timeslots: [10] }],
        totalAmount: 140000,
      });
    });

    it('should retrieve full pending mapping for center and date', async () => {
      const response = await global.request
        .get(`/api/booking/pending/mapping?centerId=${center._id.toString()}&date=2025-05-29`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mapping).toBeDefined();
      expect(response.body.mapping[court1._id.toString()]).toBeDefined();
      expect(response.body.mapping[court1._id.toString()][5]).toEqual(expect.objectContaining({
        status: 'pending',
        userId: user._id.toString(),
        name: user.name,
      }));
    });

    it('should return 400 for invalid date', async () => {
      const response = await global.request
        .get(`/api/booking/pending/mapping?centerId=${center._id.toString()}&date=invalid-date`)
        .set('Cookie', cookies)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid date');
    });
  });

  describe('GET /api/booking/pending/exists', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'pending',
        courts: [{ courtId: court1._id, timeslots: [10] }],
        totalAmount: 140000,
      });
    });

    it('should check if pending booking exists', async () => {
      const response = await global.request
        .get(`/api/booking/pending/exists?centerId=${center._id.toString()}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.exists).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.userId.toString()).toBe(user._id.toString());
    });

    it('should return exists=false if no pending booking', async () => {
      await Booking.deleteMany({});
      const response = await global.request
        .get(`/api/booking/pending/exists?centerId=${center._id.toString()}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.exists).toBe(false);
      expect(response.body.booking).toBe(null);
    });

    it('should return 400 for invalid centerId', async () => {
      const response = await global.request
        .get(`/api/booking/pending/exists?centerId=invalid-id`)
        .set('Cookie', cookies)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid centerId');
    });
  });

  describe('GET /api/booking/popular-times', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'paid',
        courts: [{ courtId: court1._id, timeslots: [10, 11] }],
        totalAmount: 140000,
      });
    });

    it('should retrieve popular timeslots for user', async () => {
      const response = await global.request
        .get('/api/booking/popular-times')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.popularSlot).toBeDefined();
      expect(response.body.data.categoryDistribution).toBeDefined();
    });
  });

  describe('GET /api/booking/get-booking-history', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        courts: [{ courtId: court1._id, timeslots: [10, 11] }],
        date: new Date('2025-05-25T00:00:00.000Z'),
        status: 'paid',
        totalAmount: 140000,
        bookingCode: '#Bill2025052500000001',
        deleted: false,
        type: 'daily',
        paymentMethod: 'banking',
      });
    });

    it('should retrieve booking history for logged-in user', async () => {
      const response = await global.request
        .get('/api/booking/get-booking-history?page=1&limit=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookingHistory.length).toBeGreaterThanOrEqual(1);
      expect(response.body.bookingHistory[0]).toMatchObject({
        bookingId: expect.any(String),
        orderId: '#Bill2025052500000001',
        status: 'paid',
        orderType: 'daily',
        center: center.name,
        court_time: `${court1.name} - 10, 11`,
        date: '2025-05-25T00:00:00.000Z',
        price: 140000,
      });
    });
  });

  describe('POST /api/booking/delete-booking', () => {
    let booking;

    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      booking = await Booking.create({
        userId: user._id,
        centerId: center._id,
        courts: [{ courtId: court1._id, timeslots: [10] }],
        date: new Date('2025-05-29'),
        status: 'paid',
        totalAmount: 140000,
        bookingCode: '#Bill2025052500000002',
      });
    });

    it('should soft delete a paid booking', async () => {
      const response = await global.request
        .post('/api/booking/delete-booking')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ bookingId: booking._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking._id.toString()).toBe(booking._id.toString());
    });

    it('should return 404 if bookingId does not exist', async () => {
      const response = await global.request
        .post('/api/booking/delete-booking')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ bookingId: new mongoose.Types.ObjectId().toString() })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Booking not found or not in paid status');
    });

    it('should return 400 for invalid bookingId', async () => {
      const response = await global.request
        .post('/api/booking/delete-booking')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ bookingId: 'invalid-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid bookingId format');
    });
  });

  describe('POST /api/booking/cancel', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      await Booking.create({
        userId: user._id,
        centerId: center._id,
        date: new Date('2025-05-29'),
        status: 'pending',
        courts: [{ courtId: court1._id, timeslots: [10] }],
        totalAmount: 140000,
      });
    });

    it('should cancel a pending booking successfully', async () => {
      const response = await global.request
        .post('/api/booking/cancel')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ centerId: center._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xóa booking cancel thành công');
    });

    it('should return 200 if no pending booking exists', async () => {
      await Booking.deleteMany({});
      const response = await global.request
        .post('/api/booking/cancel')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ centerId: center._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xóa booking cancel thành công');
    });
  });

  describe('Full Booking Flow', () => {
    beforeEach(async () => {
      csrfToken = await getCsrfToken();
      inMemoryCache.flushAll();
    });

    it('should complete the full booking cycle', async () => {
      await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 8,
          ttl: 60,
        })
        .expect(200);

      await global.request
        .post('/api/booking/pending/toggle')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          name: user.name,
          centerId: center._id.toString(),
          date: '2025-05-29',
          courtId: court1._id.toString(),
          timeslot: 9,
          ttl: 60,
        })
        .expect(200);

      await global.request
        .post('/api/booking/pending/pendingBookingToDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 200000,
        })
        .expect(200);

      const bookedBookingResponse = await global.request
        .post('/api/booking/pending/bookedBookingInDB')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          centerId: center._id.toString(),
          date: '2025-05-29',
          totalAmount: 200000,
          paymentImage: samplePaymentImage,
          note: 'Full flow test',
        })
        .expect(200);

      expect(bookedBookingResponse.body.success).toBe(true);
      expect(bookedBookingResponse.body.booking).toBeDefined();
      expect(bookedBookingResponse.body.booking.status).toBe('processing');
      expect(require('../../src/services/bookingServices.js').getPendingKey).toHaveBeenCalledWith(
        center._id.toString(),
        '2025-05-29',
        user._id.toString(),
        user.name
      );
    });
  });
});
    
