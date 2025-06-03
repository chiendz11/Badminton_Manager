import { createContactService, getContactsService } from '../../Backend/services/contactServices.js';
import Contact from '../../Backend/models/contacts.js';

// Mock Contact model
jest.mock('../../Backend/models/contacts.js', () => {
  const mockContactInstance = jest.fn();
  return jest.fn().mockImplementation((data) => {
    const instance = {
      ...data,
      save: jest.fn(),
    };
    mockContactInstance(instance);
    return instance;
  });
});

describe('createContactService', () => {
  beforeEach(() => {
    // Reset mocks trước mỗi test case
    Contact.mockClear();
    jest.clearAllMocks();

    // Mock console.error để tránh log trong output test
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Khôi phục console.error sau mỗi test
    console.error.mockRestore();
  });

  describe('createContactService', () => {
    it('should create and return a new contact successfully', async () => {
      const contactData = {
        userId: 'user123',
        topic: 'Support Request',
        content: 'I need help with my account.',
      };

      // Mock hành vi của save cho instance được tạo trong createContactService
      const mockInstance = {};
      Contact.mockImplementationOnce((data) => {
        mockInstance.data = data;
        mockInstance.save = jest.fn().mockResolvedValue({
          ...data,
          _id: 'contact123',
        });
        return mockInstance;
      });

      const result = await createContactService(contactData);

      // Kiểm tra xem Contact constructor đã được gọi với dữ liệu đúng
      expect(Contact).toHaveBeenCalledWith(contactData);
      // Kiểm tra xem save đã được gọi
      expect(mockInstance.save).toHaveBeenCalled();
      // Kiểm tra kết quả trả về
      expect(result).toEqual({
        userId: 'user123',
        topic: 'Support Request',
        content: 'I need help with my account.',
        _id: 'contact123',
      });
    });

    it('should throw an error if userId is missing', async () => {
      const contactData = {
        userId: undefined,
        topic: 'Support Request',
        content: 'I need help with my account.',
      };

      const mockInstance = {};
      Contact.mockImplementationOnce((data) => {
        mockInstance.data = data;
        mockInstance.save = jest.fn().mockRejectedValue(new Error('Validation failed: userId is required'));
        return mockInstance;
      });

      await expect(createContactService(contactData)).rejects.toThrow(
        'Validation failed: userId is required'
      );

      expect(Contact).toHaveBeenCalledWith(contactData);
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('should throw an error if topic is missing', async () => {
      const contactData = {
        userId: 'user123',
        topic: undefined,
        content: 'I need help with my account.',
      };

      const mockInstance = {};
      Contact.mockImplementationOnce((data) => {
        mockInstance.data = data;
        mockInstance.save = jest.fn().mockRejectedValue(new Error('Validation failed: topic is required'));
        return mockInstance;
      });

      await expect(createContactService(contactData)).rejects.toThrow(
        'Validation failed: topic is required'
      );

      expect(Contact).toHaveBeenCalledWith(contactData);
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('should throw an error if content is missing', async () => {
      const contactData = {
        userId: 'user123',
        topic: 'Support Request',
        content: undefined,
      };

      const mockInstance = {};
      Contact.mockImplementationOnce((data) => {
        mockInstance.data = data;
        mockInstance.save = jest.fn().mockRejectedValue(new Error('Validation failed: content is required'));
        return mockInstance;
      });

      await expect(createContactService(contactData)).rejects.toThrow(
        'Validation failed: content is required'
      );

      expect(Contact).toHaveBeenCalledWith(contactData);
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('should throw an error if database save fails', async () => {
      const contactData = {
        userId: 'user123',
        topic: 'Support Request',
        content: 'I need help with my account.',
      };

      const mockInstance = {};
      Contact.mockImplementationOnce((data) => {
        mockInstance.data = data;
        mockInstance.save = jest.fn().mockRejectedValue(new Error('Database error'));
        return mockInstance;
      });

      await expect(createContactService(contactData)).rejects.toThrow('Database error');

      expect(Contact).toHaveBeenCalledWith(contactData);
      expect(mockInstance.save).toHaveBeenCalled();
    });
  });
});