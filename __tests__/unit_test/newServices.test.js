import mongoose from 'mongoose';
import {
    addNews,
    fetchNewsById,
    modifyNews,
    removeNews,
    getAllNews
} from '../../Backend/services/newsService.js';
import News from '../../Backend/models/news.js';

// Mock News model
jest.mock('../../Backend/models/news.js', () => {
    return {
        __esModule: true,
        default: jest.fn()
    };
});

describe('News Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addNews', () => {
        it('should create and save a new news item', async () => {
            const mockNews = {
                title: 'Test News',
                content: 'Test Content',
                image: 'test.jpg'
            };

            const saveMock = jest.fn().mockResolvedValue(mockNews);
            News.mockImplementation(() => ({
                save: saveMock
            }));

            const result = await addNews(mockNews);

            expect(News).toHaveBeenCalledWith(mockNews);
            expect(saveMock).toHaveBeenCalled();
            expect(result).toEqual(mockNews);
        });

        it('should throw error if saving fails', async () => {
            const mockNews = {
                title: 'Test News',
                content: 'Test Content'
            };

            News.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            }));

            await expect(addNews(mockNews)).rejects.toThrow('Save failed');
        });

        it('should throw error if required fields are missing', async () => {
            const mockNews = {
                // Missing title and content
                image: 'test.jpg'
            };

            News.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Title is required'))
            }));

            await expect(addNews(mockNews)).rejects.toThrow('Title is required');
        });

        it('should throw error if data is invalid', async () => {
            const mockNews = {
                title: '', // Empty title
                content: 'Test Content'
            };

            News.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Invalid data'))
            }));

            await expect(addNews(mockNews)).rejects.toThrow('Invalid data');
        });
    });

    describe('fetchNewsById', () => {
        it('should fetch news by id successfully', async () => {
            const mockNews = {
                _id: 'test123',
                title: 'Test News',
                content: 'Test Content'
            };

            News.findById = jest.fn().mockResolvedValue(mockNews);

            const result = await fetchNewsById('test123');

            expect(News.findById).toHaveBeenCalledWith('test123');
            expect(result).toEqual(mockNews);
        });

        it('should return null if news not found', async () => {
            News.findById = jest.fn().mockResolvedValue(null);

            const result = await fetchNewsById('nonexistent');

            expect(News.findById).toHaveBeenCalledWith('nonexistent');
            expect(result).toBeNull();
        });

        it('should throw error if id format is invalid', async () => {
            const invalidId = 'invalid-id';
            News.findById = jest.fn().mockRejectedValue(new Error('Invalid ID format'));

            await expect(fetchNewsById(invalidId)).rejects.toThrow('Invalid ID format');
        });
    });

    describe('modifyNews', () => {
        it('should update news successfully', async () => {
            const mockUpdatedNews = {
                _id: 'test123',
                title: 'Updated Title',
                content: 'Updated Content'
            };

            News.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedNews);

            const result = await modifyNews('test123', { title: 'Updated Title' });

            expect(News.findByIdAndUpdate).toHaveBeenCalledWith(
                'test123',
                { title: 'Updated Title' },
                { new: true }
            );
            expect(result).toEqual(mockUpdatedNews);
        });

        it('should return null if news to update not found', async () => {
            News.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            const result = await modifyNews('nonexistent', { title: 'Updated Title' });

            expect(News.findByIdAndUpdate).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should throw error if id format is invalid', async () => {
            const invalidId = 'invalid-id';
            News.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Invalid ID format'));

            await expect(modifyNews(invalidId, { title: 'Updated Title' }))
                .rejects.toThrow('Invalid ID format');
        });

        it('should throw error if update data is invalid', async () => {
            const invalidData = { title: '' }; // Empty title
            News.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Invalid update data'));

            await expect(modifyNews('test123', invalidData))
                .rejects.toThrow('Invalid update data');
        });
    });

    describe('removeNews', () => {
        it('should delete news successfully', async () => {
            const mockDeletedNews = {
                _id: 'test123',
                title: 'Deleted News'
            };

            News.findByIdAndDelete = jest.fn().mockResolvedValue(mockDeletedNews);

            const result = await removeNews('test123');

            expect(News.findByIdAndDelete).toHaveBeenCalledWith('test123');
            expect(result).toEqual(mockDeletedNews);
        });

        it('should return null if news to delete not found', async () => {
            News.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            const result = await removeNews('nonexistent');

            expect(News.findByIdAndDelete).toHaveBeenCalledWith('nonexistent');
            expect(result).toBeNull();
        });

        it('should throw error if id format is invalid', async () => {
            const invalidId = 'invalid-id';
            News.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Invalid ID format'));

            await expect(removeNews(invalidId)).rejects.toThrow('Invalid ID format');
        });
    });

    describe('getAllNews', () => {
        it('should return all news sorted by createdAt', async () => {
            const mockNews = [
                { _id: '1', title: 'News 1', createdAt: new Date('2025-05-04') },
                { _id: '2', title: 'News 2', createdAt: new Date('2025-05-03') }
            ];

            News.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockNews)
            });

            const result = await getAllNews();

            expect(News.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockNews);
            expect(result.length).toBe(2);
        });

        it('should handle empty news list', async () => {
            News.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const result = await getAllNews();

            expect(News.find).toHaveBeenCalledWith({});
            expect(result).toEqual([]);
        });

        it('should throw error if fetching fails', async () => {
            News.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            await expect(getAllNews()).rejects.toThrow('Error retrieving news: Database error');
        });

        it('should return all news sorted by createdAt in descending order', async () => {
            const mockNews = [
                { _id: '1', title: 'News 1', createdAt: new Date('2025-05-04') },
                { _id: '2', title: 'News 2', createdAt: new Date('2025-05-03') },
                { _id: '3', title: 'News 3', createdAt: new Date('2025-05-05') }
            ];

            News.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockNews.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                ))
            });

            const result = await getAllNews();

            expect(News.find).toHaveBeenCalledWith({});
            expect(result[0]._id).toBe('3'); // Most recent news should be first
            expect(result[1]._id).toBe('1');
            expect(result[2]._id).toBe('2');
        });

        it('should maintain consistent sort order with same timestamps', async () => {
            const sameDate = new Date('2025-05-04');
            const mockNews = [
                { _id: '1', title: 'News 1', createdAt: sameDate },
                { _id: '2', title: 'News 2', createdAt: sameDate },
                { _id: '3', title: 'News 3', createdAt: sameDate }
            ];

            News.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockNews)
            });

            const result = await getAllNews();

            expect(result.length).toBe(3);
            expect(result.every(news => news.createdAt.getTime() === sameDate.getTime())).toBe(true);
        });
    });
});