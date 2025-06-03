// Import các module cần thiết
import User from '../../Backend/models/users.js';
import Booking from '../../Backend/models/bookings.js';
import Chart from '../../Backend/models/charts.js';
import Center from '../../Backend/models/centers.js';
import Rating from '../../Backend/models/ratings.js';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { checkEmailExistsService, updateAvgRating, sendEmailService, checkEmailUniqueness } from '../../Backend/middleware/userMiddleware.js';
import crypto from 'crypto';

// Import userServices sau mock
import * as userServices from '../../Backend/services/userServices.js';
console.log('userServices:', userServices);

// Mock các model để ghi đè mock mặc định từ jest.setup.js nếu cần
jest.mock('../../Backend/models/users.js', () => {
  const UserMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };
  return UserMock;
});

jest.mock('../../Backend/models/bookings.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../Backend/models/charts.js', () => {
  const ChartMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  ChartMock.findOne = jest.fn();
  ChartMock.findOneAndUpdate = jest.fn();
  return ChartMock;
});

jest.mock('../../Backend/models/centers.js', () => ({
  findById: jest.fn(),
}));

jest.mock('../../Backend/models/ratings.js', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
});

// Mock userMiddleware
jest.mock('../../Backend/middleware/userMiddleware.js', () => ({
  checkEmailExistsService: jest.fn().mockResolvedValue({ success: true, message: 'Email hợp lệ!' }),
  checkEmailUniqueness: jest.fn().mockResolvedValue({ success: true, message: 'Email chưa được sử dụng!' }),
  updateAvgRating: jest.fn().mockResolvedValue(),
  sendEmailService: jest.fn(),
}));

describe('Dịch vụ Người dùng', () => {
  let mockObjectId;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-06T01:09:48.571Z'));
    // Mock ObjectId để trả về chuỗi thay vì ObjectId thực
    mockObjectId = jest.spyOn(mongoose.Types, 'ObjectId').mockImplementation((id) => id);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockObjectId.mockRestore();
  });

  test('Kiểm tra mock bcrypt', async () => {
    const bcrypt = require('bcryptjs');
    const result = await bcrypt.compare('Password123!', 'hashed-Password123!');
    expect(result).toBe(true);
  });

  describe('registerUserService', () => {
    it('Nên đăng ký người dùng mới thành công', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'Password123!',
        avatar_image_path: '',
      };

      User.find.mockResolvedValue([]);
      User.create.mockResolvedValue({
        ...userData,
        _id: '507f1f77bcf86cd799439011',
        password_hash: 'hashed-Password123!',
        toObject: () => ({ ...userData, _id: '507f1f77bcf86cd799439011', password_hash: 'hashed-Password123!' }),
      });

      const result = await userServices.registerUserService(userData);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { email: 'john@example.com' },
          { phone_number: '0901234567' },
          { username: 'johndoe' },
        ],
      });
      expect(require('bcryptjs').genSalt).toHaveBeenCalledWith(10);
      expect(require('bcryptjs').hash).toHaveBeenCalledWith('Password123!', 'salt');
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashed-Password123!',
      }));
      expect(result).toMatchObject({
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('Nên ném lỗi nếu thiếu các trường bắt buộc', async () => {
      const userData = { email: 'john@example.com', password: 'Password123!' };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { name: 'Vui lòng nhập Họ và tên' },
      });
    });

    it('Nên ném lỗi nếu email không hợp lệ', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'Password123!',
      };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { email: 'Email không hợp lệ' },
      });
    });

    it('Nên ném lỗi nếu số điện thoại không hợp lệ', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '123456789',
        username: 'johndoe',
        password: 'Password123!',
      };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { phone_number: 'Số điện thoại phải bắt đầu bằng 0 hoặc +84!' },
      });
    });

    it('Nên ném lỗi nếu email đã tồn tại', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'Password123!',
      };
      User.find.mockResolvedValue([{ email: 'john@example.com' }]);
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { email: 'Email đã được sử dụng!' },
      });
    });
  });

  describe('loginUserService', () => {
    it('Nên đăng nhập thành công', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        password_hash: 'hashed-Password123!',
        failed_login_attempts: 0,
        lock_until: null,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
        }),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const result = await userServices.loginUserService('johndoe', 'Password123!');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(User.findOne().select).toHaveBeenCalledWith('+password_hash +failed_login_attempts +lock_until');
      expect(require('bcryptjs').compare).toHaveBeenCalledWith('Password123!', 'hashed-Password123!');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '507f1f77bcf86cd799439011', type: 'user' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({
        token: 'mocked-token',
        user: { _id: '507f1f77bcf86cd799439011', username: 'johndoe' },
      });
    });

    it('Nên ném lỗi nếu người dùng không tồn tại', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      await expect(userServices.loginUserService('johndoe', 'Password123!')).rejects.toThrow('User không tồn tại!');
    });

    it('Nên ném lỗi nếu mật khẩu sai', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        password_hash: 'hashed-wrongpassword',
        failed_login_attempts: 0,
        lock_until: null,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({}),
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });
      await expect(userServices.loginUserService('johndoe', 'Password123!')).rejects.toThrow('Sai mật khẩu! Bạn còn 4 lần thử trước khi tài khoản bị khóa.');
    });
  });

  describe('updateUserService', () => {
    it('Nên cập nhật thông tin người dùng thành công', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { name: 'Jane Doe' };
      const user = { _id: userId, email: 'old@example.com', avatar_image_path: '' };
      const updatedUser = {
        _id: userId,
        name: 'Jane Doe',
        toObject: jest.fn().mockReturnValue({ _id: userId, name: 'Jane Doe' }),
      };
      User.findById.mockResolvedValue(user);
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateUserService(userId, payload);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        { $set: payload },
        { new: true }
      );
      expect(result).toEqual({ _id: userId, name: 'Jane Doe' });
    });

    it('Nên xóa ảnh đại diện cũ nếu cung cấp ảnh mới', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      const user = { _id: userId, email: 'old@example.com', avatar_image_path: '/old-avatar.jpg' };
      const updatedUser = {
        _id: userId,
        avatar_image_path: '/new-avatar.jpg',
        toObject: jest.fn().mockReturnValue({ _id: userId, avatar_image_path: '/new-avatar.jpg' }),
      };
      User.findById.mockResolvedValue(user);
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateUserService(userId, payload);

      expect(fs.access).toHaveBeenCalledWith('/mocked/path/to/old-avatar.jpg');
      expect(fs.unlink).toHaveBeenCalledWith('/mocked/path/to/old-avatar.jpg');
      expect(result).toEqual({ _id: userId, avatar_image_path: '/new-avatar.jpg' });
    });

    it('Không nên ném lỗi nếu ảnh đại diện cũ không tồn tại', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      const user = { _id: userId, email: 'old@example.com', avatar_image_path: '/old-avatar.jpg' };
      const updatedUser = {
        _id: userId,
        avatar_image_path: '/new-avatar.jpg',
        toObject: jest.fn().mockReturnValue({ _id: userId, avatar_image_path: '/new-avatar.jpg' }),
      };
      User.findById.mockResolvedValue(user);
      fs.access.mockRejectedValueOnce({ code: 'ENOENT' });
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateUserService(userId, payload);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(result).toEqual({ _id: userId, avatar_image_path: '/new-avatar.jpg' });
    });

    it('Nên ném lỗi nếu người dùng không tồn tại', async () => {
      User.findById.mockResolvedValue(null);
      await expect(userServices.updateUserService('507f1f77bcf86cd799439011', {})).rejects.toThrow('Không tìm thấy người dùng!');
    });
  });

  describe('updateUserPasswordService', () => {
    it('Nên cập nhật mật khẩu thành công', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        password_hash: 'hashed-Password123!',
        save: jest.fn().mockResolvedValue(true),
      };

      await userServices.updateUserPasswordService(user, 'Password123!', 'newPassword123');

      expect(require('bcryptjs').compare).toHaveBeenCalledWith('Password123!', 'hashed-Password123!');
      expect(require('bcryptjs').genSalt).toHaveBeenCalledWith(10);
      expect(require('bcryptjs').hash).toHaveBeenCalledWith('newPassword123', 'salt');
      expect(user.password_hash).toBe('hashed-newPassword123');
      expect(user.save).toHaveBeenCalled();
    });

    it('Nên ném lỗi nếu mật khẩu cũ không chính xác', async () => {
      const user = { password_hash: 'hashed-wrongpassword', save: jest.fn() };
      await expect(userServices.updateUserPasswordService(user, 'Password123!', 'newPassword123')).rejects.toThrow('Mật khẩu cũ không chính xác');
    });
  });

  describe('updateUserLevel', () => {
    it('Nên cập nhật level người dùng dựa trên điểm', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = {
        _id: userId,
        points: 3000,
        level: '',
        save: jest.fn().mockResolvedValue(true),
      };
      const updatedUser = {
        _id: userId,
        level: 'Vàng',
      };
      User.findById.mockResolvedValue(user);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateUserLevel(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { level: 'Vàng' } },
        { new: true, select: 'level' }
      );
      expect(result).toEqual({ currentLevelName: 'Vàng' });
    });

    it('Nên ném lỗi nếu người dùng không tồn tại', async () => {
      User.findById.mockResolvedValue(null);
      await expect(userServices.updateUserLevel('507f1f77bcf86cd799439011')).rejects.toThrow('Có lỗi xảy ra khi cập nhật level user');
    });
  });

  describe('updateCompletedBookingsForUser', () => {
    it('Nên cập nhật số lượng booking hoàn thành', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        stats: { completedBookings: 5 },
      };
      Booking.countDocuments.mockResolvedValue(5);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateCompletedBookingsForUser(userId);

      expect(Booking.countDocuments).toHaveBeenCalledWith({
        userId: userId,
        status: 'paid',
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { 'stats.completedBookings': 5 } },
        { new: true, select: 'stats.completedBookings' }
      );
      expect(result).toBe(5);
    });

    it('Nên ném lỗi nếu có vấn đề khi đếm booking', async () => {
      const userId = '507f1f77bcf86cd799439011';
      Booking.countDocuments.mockRejectedValue(new Error('Database error'));
      await expect(userServices.updateCompletedBookingsForUser(userId)).rejects.toThrow('Database error');
    });
  });

  describe('incrementTotalBookings', () => {
    it('Nên tăng tổng số booking', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        stats: { totalBookings: 10 },
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.incrementTotalBookings(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { 'stats.totalBookings': 1 } },
        { new: true, select: 'stats.totalBookings' }
      );
      expect(result).toBe(10);
    });
  });

  describe('markBookingAsCancelled', () => {
    it('Nên tăng số booking bị hủy', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        stats: { cancelledBookings: 2 },
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.markBookingAsCancelled(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { 'stats.cancelledBookings': 1 } },
        { new: true, select: 'stats.cancelledBookings' }
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateUserPoints', () => {
    it('Nên cập nhật điểm người dùng dựa trên tổng số tiền và gọi updateUserLevel', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        points: 110,
        toObject: jest.fn().mockReturnValue({ _id: userId, points: 110 }),
      };
      const levelUser = {
        _id: userId,
        points: 110,
        level: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);
      User.findById.mockResolvedValue(levelUser);

      const result = await userServices.updateUserPoints(userId, 150000);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { points: 100 } },
        { new: true }
      );
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ totalPoints: 110, pointsEarned: 100 });
    });

    it('Không nên thêm điểm nếu tổng số tiền dưới ngưỡng', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        points: 10,
        toObject: jest.fn().mockReturnValue({ _id: userId, points: 10 }),
      };
      const levelUser = {
        _id: userId,
        points: 10,
        level: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);
      User.findById.mockResolvedValue(levelUser);

      const result = await userServices.updateUserPoints(userId, 50000);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { points: 0 } },
        { new: true }
      );
      expect(result).toEqual({ totalPoints: 10, pointsEarned: 0 });
    });
  });

  describe('updateChartForCompleted', () => {
    it('Nên cập nhật biểu đồ cho booking hoàn thành', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      const chart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: i === 0 ? 1 : 0,
          cancelled: 0,
        })),
      };
      Chart.findOneAndUpdate.mockResolvedValue(chart);

      const result = await userServices.updateChartForCompleted(userId, date);

      expect(Chart.findOneAndUpdate).toHaveBeenCalledWith(
        { user: userId, 'months.month': 'T1' },
        { $inc: { 'months.$.completed': 1 } },
        { new: true, upsert: true }
      );
      expect(result).toEqual(chart);
    });

    it('Nên tạo biểu đồ mới nếu chưa tồn tại', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      Chart.findOneAndUpdate.mockResolvedValue(null);
      Chart.findOne.mockResolvedValue(null);
      const newChart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: i === 0 ? 0 : 0,
          cancelled: 0,
        })),
        save: jest.fn().mockResolvedValue(true),
      };
      Chart.mockImplementationOnce(() => newChart);

      const result = await userServices.updateChartForCompleted(userId, date);

      expect(Chart.findOneAndUpdate).toHaveBeenCalledWith(
        { user: userId, 'months.month': 'T1' },
        { $inc: { 'months.$.completed': 1 } },
        { new: true, upsert: true }
      );
      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result.months[0].completed).toBe(1);
      expect(result.save).toHaveBeenCalled();
    });
  });

  describe('updateChartForCancelled', () => {
    it('Nên cập nhật biểu đồ cho booking bị hủy', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      const chart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: 0,
          cancelled: i === 0 ? 1 : 0,
        })),
      };
      Chart.findOneAndUpdate.mockResolvedValue(chart);

      const result = await userServices.updateChartForCancelled(userId, date);

      expect(Chart.findOneAndUpdate).toHaveBeenCalledWith(
        { user: userId, 'months.month': 'T1' },
        { $inc: { 'months.$.cancelled': 1 } },
        { new: true, upsert: true }
      );
      expect(result).toEqual(chart);
    });

    it('Nên tạo biểu đồ mới nếu chưa tồn tại', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      Chart.findOneAndUpdate.mockResolvedValue(null);
      Chart.findOne.mockResolvedValue(null);
      const newChart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: 0,
          cancelled: i === 0 ? 0 : 0,
        })),
        save: jest.fn().mockResolvedValue(true),
      };
      Chart.mockImplementationOnce(() => newChart);

      const result = await userServices.updateChartForCancelled(userId, date);

      expect(Chart.findOneAndUpdate).toHaveBeenCalledWith(
        { user: userId, 'months.month': 'T1' },
        { $inc: { 'months.$.cancelled': 1 } },
        { new: true, upsert: true }
      );
      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result.months[0].cancelled).toBe(1);
      expect(result.save).toHaveBeenCalled();
    });
  });

  describe('getChartService', () => {
    it('Nên trả về dữ liệu biểu đồ', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const chart = {
        months: Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: 0,
          cancelled: 0,
        })),
      };
      Chart.findOne.mockResolvedValue(chart);

      const result = await userServices.getChartService(userId);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(chart.months);
    });

    it('Nên trả về biểu đồ mặc định nếu chưa tồn tại', async () => {
      const userId = '507f1f77bcf86cd799439011';
      Chart.findOne.mockResolvedValue(null);

      const result = await userServices.getChartService(userId);

      expect(result).toEqual(
        Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          completed: 0,
          cancelled: 0,
        }))
      );
    });
  });

  describe('getUserBookingStats', () => {
    it('Nên trả về thống kê booking cho khoảng thời gian tháng', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const now = new Date('2025-05-06T01:09:48.571Z');
      Booking.aggregate.mockResolvedValue([
        {
          currentPeriodStats: [
            { completedCount: 5, cancelledCount: 2, totalPoints: 100, totalAmount: 200 },
          ],
          previousPeriodStats: [
            { completedCount: 3, cancelledCount: 1, totalPoints: 80, totalAmount: 150 },
          ],
        },
      ]);

      const result = await userServices.getUserBookingStats(userId, 'month');

      expect(Booking.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            userId: userId,
            createdAt: {
              $gte: new Date(Date.UTC(2025, 3, 1, 0, 0, 0, 0)),
              $lte: now,
            },
          },
        },
        {
          $facet: {
            currentPeriodStats: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Date.UTC(2025, 4, 1, 0, 0, 0, 0)),
                    $lte: now,
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  completedCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                  cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                  totalPoints: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$pointEarned', 0] } },
                  totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } },
                },
              },
            ],
            previousPeriodStats: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Date.UTC(2025, 3, 1, 0, 0, 0, 0)),
                    $lte: new Date(Date.UTC(2025, 3, 30, 23, 59, 59, 999)),
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  completedCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                  cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                  totalPoints: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$pointEarned', 0] } },
                  totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } },
                },
              },
            ],
          },
        },
      ]);
      expect(result).toMatchObject({
        current: { completed: 5, cancelled: 2, total: 7, points: 100, amount: 200 },
        previous: { completed: 3, cancelled: 1, total: 4, points: 80, amount: 150 },
      });
    });

    it('Nên ném lỗi nếu khoảng thời gian không hợp lệ', async () => {
      const userId = '507f1f77bcf86cd799439011';
      await expect(userServices.getUserBookingStats(userId, 'invalid')).rejects.toThrow('Invalid period parameter. Use \'week\', \'month\' or \'year\'.');
    });
  });

  describe('forgotPasswordByEmailService', () => {
    it('Nên gửi mật khẩu mới nếu người dùng tồn tại', async () => {
      const email = 'john@example.com';
      const user = {
        email,
        name: 'John Doe',
        password_hash: '',
        resetPasswordToken: '',
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);
      sendEmailService.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await userServices.forgotPasswordByEmailService(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(user.save).toHaveBeenCalled();
      expect(sendEmailService).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.',
      });
    });

    it('Nên trả về lỗi nếu người dùng không tồn tại', async () => {
      User.findOne.mockResolvedValue(null);
      const result = await userServices.forgotPasswordByEmailService('nonexistent@example.com');
      expect(result).toEqual({
        success: false,
        message: 'Không tìm thấy người dùng với email này.',
      });
    });

    it('Nên trả về lỗi nếu gửi email thất bại', async () => {
      const email = 'john@example.com';
      const user = {
        email,
        password_hash: '',
        resetPasswordToken: '',
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);
      sendEmailService.mockRejectedValue(new Error('Email error'));

      const result = await userServices.forgotPasswordByEmailService(email);

      expect(result).toEqual({
        success: false,
        message: 'Lỗi khi gửi email đặt lại mật khẩu.',
      });
    });
  });

  describe('insertRatingService', () => {
    it('Nên thêm đánh giá mới', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123', stars: 5, comment: 'Great!' };
      const newRating = {
        center: 'center123',
        user: 'user123',
        stars: 5,
        comment: 'Great!',
        save: jest.fn().mockResolvedValue(true),
      };
      Rating.mockImplementationOnce(() => newRating);
      updateAvgRating.mockResolvedValue();

      const result = await userServices.insertRatingService(ratingData);

      expect(result).toMatchObject({
        center: 'center123',
        user: 'user123',
        stars: 5,
        comment: 'Great!',
      });
      expect(updateAvgRating).toHaveBeenCalledWith('center123');
    });

    it('Nên ném lỗi nếu thiếu các trường bắt buộc', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123' };
      await expect(userServices.insertRatingService(ratingData)).rejects.toMatchObject({
        status: 400,
        message: 'Vui lòng điền đầy đủ thông tin!',
      });
    });

    it('Nên ném lỗi nếu số sao ngoài khoảng cho phép', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123', stars: 6 };
      await expect(userServices.insertRatingService(ratingData)).rejects.toMatchObject({
        status: 400,
        message: 'Số sao phải từ 1 đến 5!',
      });
    });
  });

  describe('updateFavouriteCenter', () => {
    it('Nên cập nhật trung tâm yêu thích', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [],
        save: jest.fn().mockResolvedValue(true),
      };
      const center = { _id: centerId, name: 'Center A' };
      const updatedUser = {
        _id: userId,
        favouriteCenter: [{ centerName: 'Center A', bookingCount: 1 }],
      };
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(updatedUser),
        exec: jest.fn().mockResolvedValue(user),
      }));
      Center.findById.mockResolvedValue(center);
      User.updateOne
        .mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0 })
        .mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });

      const result = await userServices.updateFavouriteCenter(userId, centerId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Center.findById).toHaveBeenCalledWith(centerId);
      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: userId, 'favouriteCenter.centerName': 'Center A' },
        { $inc: { 'favouriteCenter.$.bookingCount': 1 } }
      );
      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $push: { favouriteCenter: { centerName: 'Center A', bookingCount: 1 } } }
      );
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 1 }]);
    });

    it('Nên tăng số lần đặt sân nếu trung tâm đã tồn tại', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [{ centerName: 'Center A', bookingCount: 1 }],
        save: jest.fn().mockResolvedValue(true),
      };
      const center = { _id: centerId, name: 'Center A' };
      const updatedUser = {
        _id: userId,
        favouriteCenter: [{ centerName: 'Center A', bookingCount: 2 }],
      };
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(updatedUser),
        exec: jest.fn().mockResolvedValue(user),
      }));
      Center.findById.mockResolvedValue(center);
      User.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const result = await userServices.updateFavouriteCenter(userId, centerId);

      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: userId, 'favouriteCenter.centerName': 'Center A' },
        { $inc: { 'favouriteCenter.$.bookingCount': 1 } }
      );
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 2 }]);
    });

    it('Nên ném lỗi nếu người dùng không tồn tại', async () => {
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
        exec: jest.fn().mockResolvedValue(null),
      }));
      await expect(userServices.updateFavouriteCenter('507f1f77bcf86cd799439011', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });

    it('Nên ném lỗi nếu trung tâm không tồn tại', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', favouriteCenter: [], save: jest.fn() };
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(user),
        exec: jest.fn().mockResolvedValue(user),
      }));
      Center.findById.mockResolvedValue(null);
      await expect(userServices.updateFavouriteCenter('507f1f77bcf86cd799439011', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });
  });
});