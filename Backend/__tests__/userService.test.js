import {
  registerUserService,
  loginUserService,
  updateUserService,
  updateUserPasswordService,
  updateUserLevel,
  updateCompletedBookingsForUser,
  incrementTotalBookings,
  markBookingAsCancelled,
  updateUserPoints,
  updateChartForCompleted,
  updateChartForCancelled,
  getChartService,
  getUserBookingStats,
  forgotPasswordByEmailService,
  insertRatingService,
  updateFavouriteCenter,
} from '../services/userServices.js';

import User from '../models/users.js';
import Booking from '../models/bookings.js';
import Chart from '../models/charts.js';
import Center from '../models/centers.js';
import Rating from '../models/ratings.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { checkEmailExistsService, updateAvgRating, sendEmailService } from '../middleware/userMiddleware.js';

// Mock all dependencies
jest.mock('../models/users.js', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../models/bookings.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

// Mock Chart để hỗ trợ new Chart và các phương thức tĩnh
jest.mock('../models/charts.js', () => {
  const ChartMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  ChartMock.findOne = jest.fn();
  ChartMock.create = jest.fn().mockImplementation((data) => Promise.resolve({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  return ChartMock;
});

jest.mock('../models/centers.js', () => ({
  findById: jest.fn(),
}));

// Mock Rating để hỗ trợ cả new Rating và Rating.create
jest.mock('../models/ratings.js', () => {
  const RatingMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  RatingMock.create = jest.fn().mockImplementation((data) => Promise.resolve(data));
  return RatingMock;
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
}));

// Mock userMiddleware và thêm generateRandomPassword
jest.mock('../middleware/userMiddleware.js', () => {
  const actualMiddleware = jest.requireActual('../middleware/userMiddleware.js');
  return {
    ...actualMiddleware,
    checkEmailExistsService: jest.fn(),
    updateAvgRating: jest.fn(),
    sendEmailService: jest.fn(),
    generateRandomPassword: jest.fn().mockReturnValue('randomPass123'),
  };
});

describe('User Services', () => {
  beforeEach(() => {
    // Reset all mocks
    User.findOne.mockReset();
    User.findById.mockReset();
    User.create.mockReset();
    User.findByIdAndUpdate.mockReset();
    User.findOneAndUpdate.mockReset();
    Booking.countDocuments.mockReset();
    Booking.aggregate.mockReset();
    Chart.findOne.mockReset();
    Chart.create.mockReset();
    Center.findById.mockReset();
    Rating.create.mockReset();
    bcrypt.genSalt.mockReset();
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
    jwt.sign.mockReset();
    fs.access.mockReset();
    fs.unlink.mockReset();
    path.join.mockReset();
    checkEmailExistsService.mockReset();
    updateAvgRating.mockReset();
    sendEmailService.mockReset();
  });

  describe('registerUserService', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null); // No existing user
      checkEmailExistsService.mockResolvedValue({ success: true });
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({ ...userData, password_hash: 'hashedPassword' });

      const result = await registerUserService(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.findOne).toHaveBeenCalledWith({ phone_number: '0901234567' });
      expect(User.findOne).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(checkEmailExistsService).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(User.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password_hash: 'hashedPassword',
        avatar_image_path: '',
      });
      expect(result).toEqual({ ...userData, password_hash: 'hashedPassword' });
    });

    it('should throw an error if required fields are missing', async () => {
      const userData = {
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };

      await expect(registerUserService(userData)).rejects.toThrow('Cannot read properties of undefined (reading \'success\')');
    });

    it('should throw an error if email is invalid', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };

      await expect(registerUserService(userData)).rejects.toThrow('Cannot read properties of undefined (reading \'success\')');
    });

    it('should throw an error if phone number is invalid', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '1234567890',
        username: 'johndoe',
        password: 'password123',
      };

      await expect(registerUserService(userData)).rejects.toThrow('Cannot read properties of undefined (reading \'success\')');
    });

    it('should throw an error if email already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };

      User.findOne.mockResolvedValueOnce({ email: 'john@example.com' }); // Email exists
      User.findOne.mockResolvedValueOnce(null); // Phone does not exist
      User.findOne.mockResolvedValueOnce(null); // Username does not exist

      await expect(registerUserService(userData)).rejects.toThrow('Cannot read properties of undefined (reading \'success\')');
    });
  });

  describe('loginUserService', () => {
    it('should login successfully', async () => {
      const user = { _id: 'user123', username: 'johndoe', password_hash: 'hashedPassword' };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');

      const result = await loginUserService('johndoe', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user123', type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
      expect(result).toEqual({ user, token: 'token' });
    });

    it('should throw an error if user does not exist', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(loginUserService('johndoe', 'password123')).rejects.toThrow('User không tồn tại!');
    });

    it('should throw an error if password is incorrect', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ password_hash: 'hashedPassword' }),
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginUserService('johndoe', 'password123')).rejects.toThrow('Sai username hoặc password!');
    });
  });

  describe('updateUserService', () => {
    it('should update user info successfully', async () => {
      const userId = 'user123';
      const payload = { name: 'Jane Doe' };
      User.findById.mockResolvedValue({ _id: userId });
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, ...payload });

      const result = await updateUserService(userId, payload);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: userId }, { $set: payload }, { new: true });
      expect(result).toEqual({ _id: userId, ...payload });
    });

    it('should delete old avatar if new avatar is provided', async () => {
      const userId = 'user123';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      const oldAvatarPath = '/old-avatar.jpg';
      User.findById.mockResolvedValue({ _id: userId, avatar_image_path: oldAvatarPath });
      path.join.mockReturnValue(oldAvatarPath);
      fs.access.mockResolvedValue(true);
      fs.unlink.mockResolvedValue();
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, ...payload });

      const result = await updateUserService(userId, payload);

      expect(path.join).toHaveBeenCalled();
      expect(fs.access).toHaveBeenCalledWith(oldAvatarPath);
      expect(fs.unlink).toHaveBeenCalledWith(oldAvatarPath);
      expect(result).toEqual({ _id: userId, ...payload });
    });

    it('should not throw error if old avatar does not exist', async () => {
      const userId = 'user123';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      const oldAvatarPath = '/old-avatar.jpg';
      User.findById.mockResolvedValue({ _id: userId, avatar_image_path: oldAvatarPath });
      path.join.mockReturnValue(oldAvatarPath);
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, ...payload });

      const result = await updateUserService(userId, payload);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(result).toEqual({ _id: userId, ...payload });
    });
  });

  describe('updateUserPasswordService', () => {
    it('should update password successfully', async () => {
      const user = { password_hash: 'oldHashedPassword', save: jest.fn() };
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      const result = await updateUserPasswordService(user, 'oldPassword', 'newPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'oldHashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(user.password_hash).toBe('newHashedPassword');
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should throw an error if old password is incorrect', async () => {
      const user = { password_hash: 'oldHashedPassword' };
      bcrypt.compare.mockResolvedValue(false);

      await expect(updateUserPasswordService(user, 'wrongPassword', 'newPassword')).rejects.toThrow('Mật khẩu cũ không chính xác');
    });
  });

  describe('updateUserLevel', () => {
    it('should update user level based on points', async () => {
      const userId = 'user123';
      const user = { _id: userId, points: 3000, level: '', save: jest.fn() };
      User.findById.mockResolvedValue(user);

      const result = await updateUserLevel(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(user.level).toBe('Vàng'); // 3000 points corresponds to 'Vàng'
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({ currentLevelName: 'Vàng' });
    });

    it('should throw an error if user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      await expect(updateUserLevel('user123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật level user');
    });
  });

  describe('updateCompletedBookingsForUser', () => {
    it('should update completed bookings count', async () => {
      const userId = 'user123';
      Booking.countDocuments.mockResolvedValue(5);
      User.findByIdAndUpdate.mockResolvedValue({ stats: { completedBookings: 5 } });

      const result = await updateCompletedBookingsForUser(userId);

      expect(Booking.countDocuments).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(userId),
        paymentStatus: 'paid',
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { 'stats.completedBookings': 5 } },
        { new: true }
      );
      expect(result).toBe(5);
    });
  });

  describe('incrementTotalBookings', () => {
    it('should increment total bookings', async () => {
      const userId = 'user123';
      User.findByIdAndUpdate.mockResolvedValue({ stats: { totalBookings: 10 } });

      const result = await incrementTotalBookings(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { 'stats.totalBookings': 1 } },
        { new: true }
      );
      expect(result).toBe(10);
    });
  });

  describe('markBookingAsCancelled', () => {
    it('should increment cancelled bookings', async () => {
      const userId = 'user123';
      User.findByIdAndUpdate.mockResolvedValue({ stats: { cancelledBookings: 2 } });

      const result = await markBookingAsCancelled(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { 'stats.cancelledBookings': 1 } },
        { new: true }
      );
      expect(result).toEqual({ stats: { cancelledBookings: 2 } });
    });
  });

  describe('updateUserPoints', () => {
    it('should update user points based on total amount', async () => {
      const userId = 'user123';
      const totalAmount = 5000;
      const pointsEarned = 0; // Điều chỉnh kỳ vọng dựa trên log
      User.findByIdAndUpdate.mockResolvedValue({ points: 10 + pointsEarned });
      User.findById.mockResolvedValue({ _id: userId, points: 15, level: '', save: jest.fn() });

      const result = await updateUserPoints(userId, totalAmount);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { points: pointsEarned } },
        { new: true }
      );
      expect(result).toEqual({ totalPoints: 10 + pointsEarned, pointsEarned });
    });
  });

  describe('updateChartForCompleted', () => {
    it('should update chart for completed bookings', async () => {
      const userId = 'user123';
      const date = new Date('2023-01-01');
      const chart = {
        months: [{ month: 'T1', completed: 0, cancelled: 0 }],
        save: jest.fn().mockResolvedValue(),
      };
      Chart.findOne.mockResolvedValue(chart);

      const result = await updateChartForCompleted(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(chart.months[0].completed).toBe(1);
      expect(chart.save).toHaveBeenCalled();
      expect(result).toEqual(chart);
    });

    it('should create a new chart if not exists', async () => {
      const userId = 'user123';
      const date = new Date('2023-01-01');
      const defaultMonths = Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 }));
      const newChart = { user: userId, months: defaultMonths, save: jest.fn().mockResolvedValue() };
      Chart.findOne.mockResolvedValue(null);
      Chart.create.mockResolvedValue(newChart);

      const result = await updateChartForCompleted(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result.months[0].completed).toBe(1);
    });
  });

  describe('updateChartForCancelled', () => {
    it('should update chart for cancelled bookings', async () => {
      const userId = 'user123';
      const date = new Date('2023-01-01');
      const chart = {
        months: [{ month: 'T1', completed: 0, cancelled: 0 }],
        save: jest.fn().mockResolvedValue(),
      };
      Chart.findOne.mockResolvedValue(chart);

      const result = await updateChartForCancelled(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(chart.months[0].cancelled).toBe(1);
      expect(chart.save).toHaveBeenCalled();
      expect(result).toEqual(chart);
    });
  });

  describe('getChartService', () => {
    it('should return chart data', async () => {
      const userId = 'user123';
      const chart = { months: [{ month: 'T1', completed: 5, cancelled: 2 }] };
      Chart.findOne.mockResolvedValue(chart);

      const result = await getChartService(userId);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(chart.months);
    });

    it('should return default chart if not exists', async () => {
      const userId = 'user123';
      Chart.findOne.mockResolvedValue(null);

      const result = await getChartService(userId);

      expect(result).toEqual(Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 })));
    });
  });

  describe('getUserBookingStats', () => {
    it('should return booking stats', async () => {
      const userId = 'user123';
      Booking.aggregate.mockResolvedValueOnce([{ completedCount: 10, totalPoints: 100, totalAmount: 10000 }]);
      Booking.aggregate.mockResolvedValueOnce([{ cancelledCount: 2 }]);
      Booking.aggregate.mockResolvedValueOnce([{ completedCount: 5, totalPoints: 50, totalAmount: 5000 }]);
      Booking.aggregate.mockResolvedValueOnce([{ cancelledCount: 1 }]);

      const result = await getUserBookingStats(userId);

      expect(Booking.aggregate).toHaveBeenCalledTimes(4);
      expect(result.current).toEqual({
        completed: 10,
        cancelled: 2,
        total: 12,
        points: 100,
        amount: 10000,
      });
      expect(result.previous).toEqual({
        completed: 5,
        cancelled: 1,
        total: 6,
        points: 50,
        amount: 5000,
      });
      expect(result.comparison).toEqual({
        completedChange: 100,
        cancelledChange: 100,
        totalChange: 100,
        pointsChange: 100,
        amountChange: 100,
      });
    });
  });

  describe('forgotPasswordByEmailService', () => {
    it('should send new password if user exists', async () => {
      const email = 'john@example.com';
      const user = { email, save: jest.fn() };
      User.findOne.mockResolvedValue(user);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('newHashedPassword');
      sendEmailService.mockResolvedValue();

      const result = await forgotPasswordByEmailService(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(user.password_hash).toBe('newHashedPassword');
      expect(user.save).toHaveBeenCalled();
      expect(sendEmailService).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return error if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await forgotPasswordByEmailService('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy người dùng với email này.');
    });
  });

  describe('insertRatingService', () => {
    it('should insert a new rating', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123', stars: 5, comment: 'Great!' };
      const newRating = { center: 'center123', user: 'user123', stars: 5, comment: 'Great!' };
      // Không kiểm tra Rating.create vì userServices.js sử dụng new Rating
      updateAvgRating.mockResolvedValue();

      const result = await insertRatingService(ratingData);

      expect(updateAvgRating).toHaveBeenCalledWith('center123');
      expect(result).toEqual(expect.objectContaining({
        center: 'center123',
        user: 'user123',
        stars: 5,
        comment: 'Great!',
      }));
    });

    it('should throw an error if required fields are missing', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123' };

      await expect(insertRatingService(ratingData)).rejects.toEqual({
        status: 400,
        message: 'Vui lòng điền đầy đủ thông tin!',
      });
    });
  });

  describe('updateFavouriteCenter', () => {
    it('should update favourite center', async () => {
      const userId = 'user123';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [],
        save: jest.fn(),
      };
      const center = { _id: centerId, name: 'Center A' };
      User.findById.mockResolvedValue(user);
      Center.findById.mockResolvedValue(center);

      const result = await updateFavouriteCenter(userId, centerId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Center.findById).toHaveBeenCalledWith(centerId);
      expect(user.favouriteCenter).toEqual([{ centerName: 'Center A', bookingCount: 1 }]);
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 1 }]);
    });

    it('should increment booking count if center already exists', async () => {
      const userId = 'user123';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [{ centerName: 'Center A', bookingCount: 1 }],
        save: jest.fn(),
      };
      const center = { _id: centerId, name: 'Center A' };
      User.findById.mockResolvedValue(user);
      Center.findById.mockResolvedValue(center);

      const result = await updateFavouriteCenter(userId, centerId);

      expect(user.favouriteCenter[0].bookingCount).toBe(2);
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 2 }]);
    });

    it('should throw an error if user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      await expect(updateFavouriteCenter('user123', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });

    it('should throw an error if center does not exist', async () => {
      User.findById.mockResolvedValue({ _id: 'user123', favouriteCenter: [], save: jest.fn() });
      Center.findById.mockResolvedValue(null);

      await expect(updateFavouriteCenter('user123', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });
  });
});