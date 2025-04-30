import { getAllUsersService, deleteUser } from '../services/userManageServices.js';
import User from '../models/users.js';

// Mock mô hình User
jest.mock('../models/users.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
}));

describe('User Management Services', () => {
  beforeEach(() => {
    // Reset tất cả mock trước mỗi bài kiểm thử
    User.find.mockReset();
    User.findById.mockReset();
    User.deleteOne.mockReset();
  });

  describe('getAllUsersService', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'user2', name: 'Jane Doe', email: 'jane@example.com' },
      ];
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await getAllUsersService();

      expect(User.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsers);
    });

    it('should throw an error if no users are found (empty array)', async () => {
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await expect(getAllUsersService()).rejects.toThrow('Không tìm thấy người dùng nào');
    });

    it('should throw an error if users is null', async () => {
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(getAllUsersService()).rejects.toThrow('Không tìm thấy người dùng nào');
    });

    it('should throw a generic error if an exception occurs', async () => {
      User.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(getAllUsersService()).rejects.toThrow('Database error');
    });

    it('should throw a generic error with default message if error has no message', async () => {
      User.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error()),
      });

      await expect(getAllUsersService()).rejects.toThrow('Lỗi khi lấy danh sách người dùng');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = 'user123';
      const mockUser = { _id: userId, name: 'John Doe' };
      User.findById.mockResolvedValue(mockUser);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteUser(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual({ success: true, message: 'Xóa người dùng thành công' });
    });

    it('should throw an error if user does not exist', async () => {
      const userId = 'user123';
      User.findById.mockResolvedValue(null);

      await expect(deleteUser(userId)).rejects.toEqual({
        success: false,
        message: 'Người dùng không tồn tại',
        error: { success: false, message: 'Người dùng không tồn tại' }, // Thêm error vào kỳ vọng
      });
    });

    it('should throw an error if user is not deleted (deletedCount: 0)', async () => {
      const userId = 'user123';
      const mockUser = { _id: userId, name: 'John Doe' };
      User.findById.mockResolvedValue(mockUser);
      User.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(deleteUser(userId)).rejects.toEqual({
        success: false,
        message: 'Không thể xóa người dùng vì không tìm thấy',
        error: { success: false, message: 'Không thể xóa người dùng vì không tìm thấy' }, // Thêm error vào kỳ vọng
      });
    });

    it('should throw a generic error if an exception occurs during findById', async () => {
      const userId = 'user123';
      User.findById.mockRejectedValue(new Error('Database error'));

      await expect(deleteUser(userId)).rejects.toEqual({
        success: false,
        message: 'Database error',
        error: expect.any(Error),
      });
    });

    it('should throw a generic error if an exception occurs during deleteOne', async () => {
      const userId = 'user123';
      const mockUser = { _id: userId, name: 'John Doe' };
      User.findById.mockResolvedValue(mockUser);
      User.deleteOne.mockRejectedValue(new Error('Database error'));

      await expect(deleteUser(userId)).rejects.toEqual({
        success: false,
        message: 'Database error',
        error: expect.any(Error),
      });
    });

    it('should throw a generic error with default message if error has no message', async () => {
      const userId = 'user123';
      const mockUser = { _id: userId, name: 'John Doe' };
      User.findById.mockResolvedValue(mockUser);
      User.deleteOne.mockRejectedValue(new Error());

      await expect(deleteUser(userId)).rejects.toEqual({
        success: false,
        message: 'Lỗi khi xóa người dùng',
        error: expect.any(Error),
      });
    });
  });
});