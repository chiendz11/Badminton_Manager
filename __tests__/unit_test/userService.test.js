

// Import các module khác sau khi mock được thiết lập
const { default: User } = await import('../../Backend/models/users.js');
const { default: Booking } = await import('../../Backend/models/bookings.js');
const { default: Chart } = await import('../../Backend/models/charts.js');
const { default: Center } = await import('../../Backend/models/centers.js');
const { default: Rating } = await import('../../Backend/models/ratings.js');
const { default: jwt } = await import('jsonwebtoken');
const { default: fs } = await import('fs/promises');
const { default: mongoose } = await import('mongoose');
const { checkEmailExistsService, updateAvgRating, sendEmailService, generateRandomPassword } = await import('../../Backend/middleware/userMiddleware.js');
const { default: axios } = await import('axios');
const { default: path } = await import('path');

// Import userServices sau mock
const userServices = await import('../../Backend/services/userServices.js');
console.log('userServices:', userServices);

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      data: {
        status: 'valid',
        disposable: false,
        block: false,
        score: 75,
      },
    },
  }),
}));

jest.mock('../../Backend/models/users.js', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  select: jest.fn().mockReturnThis(),
}));

jest.mock('../../Backend/models/bookings.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../Backend/models/charts.js', () => {
  const ChartMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  ChartMock.findOne = jest.fn();
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

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token123'),
  verify: jest.fn().mockReturnValue({ id: 'user123', type: 'user' }),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(),
}));

jest.mock('../../Backend/middleware/userMiddleware.js', () => ({
  checkEmailExistsService: jest.fn().mockImplementation((email) => {
    console.log(`checkEmailExistsService called with email: ${email}`);
    return Promise.resolve({ success: true, message: 'Email hợp lệ!' });
  }),
  updateAvgRating: jest.fn().mockResolvedValue(),
  sendEmailService: jest.fn().mockImplementation((to, subject, html) => {
    console.log(`sendEmailService called with to: ${to}, subject: ${subject}`);
    return Promise.resolve({ messageId: 'test-message-id' });
  }),
  generateRandomPassword: jest.fn().mockReturnValue('randomPass123'),
}));

describe('User Services', () => {
  let mockObjectId;


  beforeEach(async () => {
    jest.resetModules(); // Xóa cache module
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-06T01:09:48.571Z'));
    mockObjectId = jest.spyOn(mongoose.Types, 'ObjectId').mockImplementation((id) => ({
      toString: () => id,
      equals: (other) => other.toString() === id,
      buffer: Buffer.from(id, 'hex'),
    }));

  });

  afterEach(() => {
    jest.useRealTimers();
    mockObjectId.mockRestore();
    jest.restoreAllMocks();
  });

  test('bcrypt mock test', async () => {
    const result = await bcrypt.compare('abc', 'hashed-abc');
    expect(result).toBe(true); // ✅ nếu mock hoạt động
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

      User.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null) // phone_number check
        .mockResolvedValueOnce(null); // username check
      
      User.create.mockResolvedValue({
        ...userData,
        password_hash: 'hashed-password123',
        avatar_image_path: '',
      });

      const result = await userServices.registerUserService(userData);

      expect(User.findOne).toHaveBeenNthCalledWith(1, { email: 'john@example.com' });
      expect(User.findOne).toHaveBeenNthCalledWith(2, { phone_number: '0901234567' });
      expect(User.findOne).toHaveBeenNthCalledWith(3, { username: 'johndoe' });
      expect(checkEmailExistsService).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashed-password123',
      }));
      expect(result).toHaveProperty('password_hash', 'hashed-password123');
    });

    it('should throw an error if required fields are missing', async () => {
      const userData = { email: 'john@example.com', password: 'password123' };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { name: 'Vui lòng nhập Họ và tên' },
      });
    });

    it('should throw an error if email is invalid', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { email: 'Email không hợp lệ' },
      });
    });

    it('should throw an error if phone number is invalid', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '123456789',
        username: 'johndoe',
        password: 'password123',
      };
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { phone_number: 'Số điện thoại phải bắt đầu bằng 0 hoặc +84!' },
      });
    });

    it('should throw an error if email already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0901234567',
        username: 'johndoe',
        password: 'password123',
      };
      User.findOne.mockResolvedValueOnce({ email: 'john@example.com' });
      await expect(userServices.registerUserService(userData)).rejects.toMatchObject({
        status: 400,
        errors: { email: 'Email đã được sử dụng!' },
      });
    });
  });

  describe('loginUserService', () => {
    it('should login successfully', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        password_hash: 'hashed-password123',
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
        }),
      };
      
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const result = await userServices.loginUserService('johndoe', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '507f1f77bcf86cd799439011', type: 'user' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(result).toEqual({
        token: 'token123',
        user: { _id: '507f1f77bcf86cd799439011', username: 'johndoe' },
      });
    });

    it('should throw an error if user does not exist', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await expect(userServices.loginUserService('johndoe', 'password123')).rejects.toThrow('User không tồn tại!');
    });

    it('should throw an error if password is incorrect', async () => {
      const user = { password_hash: 'hashed-wrongpassword', toObject: jest.fn().mockReturnValue({}) };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
      await expect(userServices.loginUserService('johndoe', 'wrongpassword')).rejects.toThrow('Sai username hoặc password!');
    });
  });

  describe('updateUserService', () => {
    it('should update user info successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { name: 'Jane Doe' };
      User.findById.mockResolvedValue({ _id: userId });
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, name: 'Jane Doe' });

      const result = await userServices.updateUserService(userId, payload);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: userId }, { $set: payload }, { new: true });
      expect(result).toEqual({ _id: userId, name: 'Jane Doe' });
    });

    it('should delete old avatar if new avatar is provided', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      User.findById.mockResolvedValue({ _id: userId, avatar_image_path: '/old-avatar.jpg' });
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, avatar_image_path: '/new-avatar.jpg' });

      const result = await userServices.updateUserService(userId, payload);

      expect(fs.access).toHaveBeenCalledWith('/mocked/path/to/old-avatar.jpg');
      expect(fs.unlink).toHaveBeenCalledWith('/mocked/path/to/old-avatar.jpg');
      expect(result).toEqual({ _id: userId, avatar_image_path: '/new-avatar.jpg' });
    });

    it('should not throw error if old avatar does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload = { avatar_image_path: '/new-avatar.jpg' };
      User.findById.mockResolvedValue({ _id: userId, avatar_image_path: '/old-avatar.jpg' });
      fs.access.mockRejectedValueOnce({ code: 'ENOENT' });
      User.findOneAndUpdate.mockResolvedValue({ _id: userId, avatar_image_path: '/new-avatar.jpg' });

      const result = await userServices.updateUserService(userId, payload);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(result).toEqual({ _id: userId, avatar_image_path: '/new-avatar.jpg' });
    });

    it('should throw an error if user does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      User.findById.mockResolvedValue(null);
      await expect(userServices.updateUserService(userId, {})).rejects.toThrow('Không tìm thấy người dùng!');
    });
  });

  describe('updateUserPasswordService', () => {
    it('should update password successfully', async () => {
      const user = {
        password_hash: 'hashed-password123',
        save: jest.fn().mockResolvedValue(true),
      };

      
      await userServices.updateUserPasswordService(user, 'password123', 'newPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password123');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 'valid-salt');
      expect(user.password_hash).toBe('hashed-newPassword');
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw an error if old password is incorrect', async () => {
      const user = { password_hash: 'hashed-wrongpassword', save: jest.fn() };
      await expect(userServices.updateUserPasswordService(user, 'wrongpassword', 'newPassword')).rejects.toThrow('Mật khẩu cũ không chính xác');
    });
  });

  describe('updateUserLevel', () => {
    it('should update user level based on points', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = { _id: userId, points: 3000, level: '', save: jest.fn().mockResolvedValue(true) };
      User.findById.mockResolvedValue(user);

      const result = await userServices.updateUserLevel(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(user.level).toBe('Vàng');
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({ currentLevelName: 'Vàng' });
    });

    it('should throw an error if user does not exist', async () => {
      User.findById.mockResolvedValue(null);
      await expect(userServices.updateUserLevel('507f1f77bcf86cd799439011')).rejects.toThrow('Có lỗi xảy ra khi cập nhật level user');
    });
  });

  describe('updateCompletedBookingsForUser', () => {
    it('should update completed bookings count', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updatedUser = {
        _id: userId,
        stats: { completedBookings: 5 },
      };
      User.findById.mockResolvedValue({ _id: userId });
      Booking.countDocuments.mockResolvedValue(5);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await userServices.updateCompletedBookingsForUser(userId);

      expect(Booking.countDocuments).toHaveBeenCalledWith({
        userId: expect.objectContaining({ toString: expect.any(Function) }),
        paymentStatus: 'paid',
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { 'stats.completedBookings': 5 } },
        { new: true }
      );
      expect(result).toBe(5);
    });

    it('should throw an error if there is an issue with counting bookings', async () => {
      const userId = '507f1f77bcf86cd799439011';
      Booking.countDocuments.mockRejectedValue(new Error('Database error'));
      await expect(userServices.updateCompletedBookingsForUser(userId)).rejects.toThrow('Database error');
    });
  });

  describe('incrementTotalBookings', () => {
    it('should increment total bookings', async () => {
      const userId = '507f1f77bcf86cd799439011';
      User.findByIdAndUpdate.mockResolvedValue({ _id: userId, stats: { totalBookings: 10 } });

      const result = await userServices.incrementTotalBookings(userId);

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
      const userId = '507f1f77bcf86cd799439011';
      User.findByIdAndUpdate.mockResolvedValue({ _id: userId, stats: { cancelledBookings: 2 } });

      const result = await userServices.markBookingAsCancelled(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { 'stats.cancelledBookings': 1 } },
        { new: true }
      );
      expect(result).toEqual({ _id: userId, stats: { cancelledBookings: 2 } });
    });
  });

  describe('updateUserPoints', () => {
    it('should update user points based on total amount and call updateUserLevel', async () => {
      const userId = '507f1f77bcf86cd799439011';
      User.findByIdAndUpdate.mockResolvedValue({ _id: userId, points: 110 });
      User.findById.mockResolvedValue({ _id: userId, points: 110, level: '', save: jest.fn().mockResolvedValue(true) });

      const result = await userServices.updateUserPoints(userId, 150000);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $inc: { points: 100 } },
        { new: true }
      );
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ totalPoints: 110, pointsEarned: 100 });
    });

    it('should not add points if total amount is below threshold', async () => {
      const userId = '507f1f77bcf86cd799439011';
      User.findByIdAndUpdate.mockResolvedValue({ _id: userId, points: 10 });
      User.findById.mockResolvedValue({ _id: userId, points: 10, level: '', save: jest.fn().mockResolvedValue(true) });

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
    it('should update chart for completed bookings', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      const chart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 })),
        save: jest.fn().mockResolvedValue(true),
      };
      Chart.findOne.mockResolvedValue(chart);

      const result = await userServices.updateChartForCompleted(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(chart.months[0].completed).toBe(1);
      expect(chart.save).toHaveBeenCalled();
      expect(result).toEqual(chart);
    });

    it('should create a new chart if not exists', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      Chart.findOne.mockResolvedValue(null);
      Chart.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data),
      }));

      const result = await userServices.updateChartForCompleted(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result.months[0].completed).toBe(1);
      expect(result.save).toHaveBeenCalled();
    });
  });

  describe('updateChartForCancelled', () => {
    it('should update chart for cancelled bookings', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      const chart = {
        user: userId,
        months: Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 })),
        save: jest.fn().mockResolvedValue(true),
      };
      Chart.findOne.mockResolvedValue(chart);

      const result = await userServices.updateChartForCancelled(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(chart.months[0].cancelled).toBe(1);
      expect(chart.save).toHaveBeenCalled();
      expect(result).toEqual(chart);
    });

    it('should create a new chart if not exists', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const date = new Date('2023-01-01');
      Chart.findOne.mockResolvedValue(null);
      Chart.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data),
      }));

      const result = await userServices.updateChartForCancelled(userId, date);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result.months[0].cancelled).toBe(1);
      expect(result.save).toHaveBeenCalled();
    });
  });

  describe('getChartService', () => {
    it('should return chart data', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const chart = { months: Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 })) };
      Chart.findOne.mockResolvedValue(chart);

      const result = await userServices.getChartService(userId);

      expect(Chart.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(chart.months);
    });

    it('should return default chart if not exists', async () => {
      const userId = '507f1f77bcf86cd799439011';
      Chart.findOne.mockResolvedValue(null);

      const result = await userServices.getChartService(userId);

      expect(result).toEqual(Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, completed: 0, cancelled: 0 })));
    });
  });

  describe('getUserBookingStats', () => {
    it('should return booking stats for month period', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const now = new Date('2025-05-06T01:09:48.571Z');
      const currentStart = new Date(Date.UTC(2025, 4, 1, 0, 0, 0, 0));
      const previousStart = new Date(Date.UTC(2025, 3, 1, 0, 0, 0, 0));
      const previousEnd = new Date(Date.UTC(2025, 3, 30, 23, 59, 59, 999));

      Booking.aggregate
        .mockResolvedValueOnce([{ _id: null, completedCount: 5, totalPoints: 100, totalAmount: 200 }])
        .mockResolvedValueOnce([{ _id: null, cancelledCount: 2 }])
        .mockResolvedValueOnce([{ _id: null, completedCount: 3, totalPoints: 80, totalAmount: 150 }])
        .mockResolvedValueOnce([{ _id: null, cancelledCount: 1 }]);

      const result = await userServices.getUserBookingStats(userId, 'month');

      expect(Booking.aggregate).toHaveBeenNthCalledWith(1, [
        {
          $match: {
            userId: expect.objectContaining({ toString: expect.any(Function) }),
            status: 'paid',
            createdAt: { $gte: currentStart, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            completedCount: { $sum: 1 },
            totalPoints: { $sum: '$pointEarned' },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]);
      expect(result).toMatchObject({
        current: { completed: 5, cancelled: 2, total: 7, points: 100, amount: 200 },
        previous: { completed: 3, cancelled: 1, total: 4, points: 80, amount: 150 },
      });
    });

    it('should throw an error for invalid period', async () => {
      const userId = '507f1f77bcf86cd799439011';
      await expect(userServices.getUserBookingStats(userId, 'invalid')).rejects.toThrow('Invalid period parameter. Use \'week\', \'month\' or \'year\'.');
    });
  });

  describe('forgotPasswordByEmailService', () => {
    it('should send new password if user exists', async () => {
      const email = 'john@example.com';
      const user = {
        email,
        name: 'John Doe',
        password_hash: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);

      const result = await userServices.forgotPasswordByEmailService(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(generateRandomPassword).toHaveBeenCalledWith(12);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('randomPass123', 'salt');
      expect(user.password_hash).toBe('hashed-randomPass123');
      expect(user.save).toHaveBeenCalled();
      expect(sendEmailService).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Mật khẩu mới đã được gửi đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư.',
      });
    });

    it('should return error if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);
      const result = await userServices.forgotPasswordByEmailService('nonexistent@example.com');
      expect(result).toEqual({
        success: false,
        message: 'Không tìm thấy người dùng với email này.',
      });
    });

    it('should return error if sending email fails', async () => {
      const email = 'john@example.com';
      const user = {
        email,
        password_hash: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);
      sendEmailService.mockRejectedValue(new Error('Email error'));

      const result = await userServices.forgotPasswordByEmailService(email);

      expect(result).toEqual({
        success: false,
        message: 'Lỗi khi gửi email mật khẩu mới.',
      });
    });
  });

  describe('insertRatingService', () => {
    it('should insert a new rating', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123', stars: 5, comment: 'Great!' };

      const result = await userServices.insertRatingService(ratingData);

      expect(result).toMatchObject({
        center: 'center123',
        user: 'user123',
        stars: 5,
        comment: 'Great!',
      });
      expect(updateAvgRating).toHaveBeenCalledWith('center123');
    });

    it('should throw an error if required fields are missing', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123' };
      await expect(userServices.insertRatingService(ratingData)).rejects.toMatchObject({
        status: 400,
        message: 'Vui lòng điền đầy đủ thông tin!',
      });
    });

    it('should throw an error if stars are out of range', async () => {
      const ratingData = { centerId: 'center123', userId: 'user123', stars: 6 };
      await expect(userServices.insertRatingService(ratingData)).rejects.toMatchObject({
        status: 400,
        message: 'Số sao phải từ 1 đến 5!',
      });
    });
  });

  describe('updateFavouriteCenter', () => {
    it('should update favourite center', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [],
        save: jest.fn().mockResolvedValue(true),
      };
      const center = { _id: centerId, name: 'Center A' };
      User.findById.mockResolvedValue(user);
      Center.findById.mockResolvedValue(center);

      const result = await userServices.updateFavouriteCenter(userId, centerId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Center.findById).toHaveBeenCalledWith(centerId);
      expect(user.favouriteCenter).toEqual([{ centerName: 'Center A', bookingCount: 1 }]);
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 1 }]);
    });

    it('should increment booking count if center already exists', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const centerId = 'center123';
      const user = {
        _id: userId,
        favouriteCenter: [{ centerName: 'Center A', bookingCount: 1 }],
        save: jest.fn().mockResolvedValue(true),
      };
      const center = { _id: centerId, name: 'Center A' };
      User.findById.mockResolvedValue(user);
      Center.findById.mockResolvedValue(center);

      const result = await userServices.updateFavouriteCenter(userId, centerId);

      expect(user.favouriteCenter[0].bookingCount).toBe(2);
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual([{ centerName: 'Center A', bookingCount: 2 }]);
    });

    it('should throw an error if user does not exist', async () => {
      User.findById.mockResolvedValue(null);
      await expect(userServices.updateFavouriteCenter('507f1f77bcf86cd799439011', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });

    it('should throw an error if center does not exist', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', favouriteCenter: [], save: jest.fn() };
      User.findById.mockResolvedValue(user);
      Center.findById.mockResolvedValue(null);
      await expect(userServices.updateFavouriteCenter('507f1f77bcf86cd799439011', 'center123')).rejects.toThrow('Có lỗi xảy ra khi cập nhật danh sách yêu thích');
    });
  });
});