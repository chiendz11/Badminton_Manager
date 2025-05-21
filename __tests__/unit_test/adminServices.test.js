import mongoose from 'mongoose';
import { authenticateAdmin } from '../../Backend/services/adminServices.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock JWT secret
process.env.JWT_SECRET = 'test_secret_key';

// Mock Admin model
const mockAdminData = {
  _id: 'admin123',
  username: 'admin',
  password_hash: '$2a$10$abcdefghijklmnopqrstuv',
  role: 'admin',
  centers: [],
  avatar: 'https://example.com/default-avatar.png',
  createdAt: new Date(),
  updatedAt: new Date()
};
jest.mock('bcryptjs', () => {
  const bcryptMock = {
    genSalt: jest.fn().mockImplementation(async () => {
      console.log('bcrypt.genSalt called');
      return 'salt';
    }),
    hash: jest.fn().mockImplementation(async (password, salt) => {
      console.log(`bcrypt.hash called with password: ${password}, salt: ${salt}`);
      if (salt !== 'salt') throw new Error('Invalid salt value');
      return `hashed-${password}`;
    }),
    compare: jest.fn().mockImplementation(async (plainPass, hashedPass) => {
      console.log(`bcrypt.compare called with plainPass: ${plainPass}, hashedPass: ${hashedPass}`);
      const result = hashedPass === `hashed-${plainPass}`;
      console.log(`bcrypt.compare result: ${result}`);
      return result;
    }),
  };
  return bcryptMock;
});

jest.mock('../../Backend/models/admin.js', () => ({
  findOne: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(mockAdminData)
  }))
}));

// Mock jwt.sign
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token')
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockImplementation((password, hash) => Promise.resolve(password === 'password123'))
}));

describe('adminServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateAdmin', () => {
    it('should authenticate admin with correct credentials', async () => {
      const result = await authenticateAdmin('admin', 'password123');

      expect(result).toEqual({
        token: 'mock_token',
        admin: {
          _id: 'admin123',
          username: 'admin',
          avatar: 'https://example.com/default-avatar.png',
          centers: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'admin123', type: 'admin' },
        'test_secret_key',
        { expiresIn: '30d' }
      );
    });

    it('should throw error with incorrect credentials', async () => {
      bcrypt.compare.mockImplementationOnce(() => Promise.resolve(false));
      await expect(authenticateAdmin('admin', 'wrong')).rejects.toThrow('Sai username hoặc password!');
    });

    it('should throw error if admin not found', async () => {
      // Temporarily override the findOne mock for this test
      const Admin = require('../../Backend/models/admin.js');
      Admin.findOne.mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValue(null)
      }));
      await expect(authenticateAdmin('wrong', 'wrong')).rejects.toThrow('Admin không tồn tại!');
    });

    it('should throw error if jwt.sign fails', async () => {
      jwt.sign.mockImplementationOnce(() => {
        throw new Error('JWT error');
      });

      await expect(authenticateAdmin('admin', 'password123')).rejects.toThrow('JWT error');
    });
  });
});