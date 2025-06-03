import mongoose from 'mongoose';
import Rating from '../../Backend/models/ratings.js';
import {
    getRatingsByCenter,
    deleteRatingById,
    getCommentsForCenterService
} from '../../Backend/services/ratingService.js';

// Mock Rating model
jest.mock('../../Backend/models/ratings.js', () => ({
    find: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

describe('Rating Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRatingsByCenter', () => {
        it('should fetch ratings for a center successfully', async () => {
            const mockRatings = [
                {
                    _id: 'rating1',
                    center: 'center1',
                    user: {
                        _id: 'user1',
                        username: 'testuser',
                        email: 'test@example.com'
                    },
                    stars: 5,
                    comment: 'Great center!'
                }
            ];

            Rating.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockRatings)
                })
            });

            const result = await getRatingsByCenter('center1');

            expect(Rating.find).toHaveBeenCalledWith({ center: 'center1' });
            expect(result).toEqual(mockRatings);
            expect(result[0]).toHaveProperty('user.username');
        });

        it('should return empty array when no ratings found', async () => {
            Rating.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([])
                })
            });

            const result = await getRatingsByCenter('center1');
            expect(result).toEqual([]);
        });

        it('should throw error if database query fails', async () => {
            Rating.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockRejectedValue(new Error('Database error'))
                })
            });

            await expect(getRatingsByCenter('center1')).rejects.toThrow('Database error');
        });
    });

    describe('deleteRatingById', () => {
        it('should delete rating successfully', async () => {
            const mockRating = {
                _id: 'rating1',
                center: 'center1',
                stars: 5
            };

            Rating.findByIdAndDelete.mockResolvedValue(mockRating);

            const result = await deleteRatingById('rating1');

            expect(Rating.findByIdAndDelete).toHaveBeenCalledWith('rating1');
            expect(result).toEqual(mockRating);
        });

        it('should return null if rating not found', async () => {
            Rating.findByIdAndDelete.mockResolvedValue(null);

            const result = await deleteRatingById('nonexistent');

            expect(Rating.findByIdAndDelete).toHaveBeenCalledWith('nonexistent');
            expect(result).toBeNull();
        });

        it('should throw error if deletion fails', async () => {
            Rating.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'));

            await expect(deleteRatingById('rating1')).rejects.toThrow('Delete failed');
        });
    });

    describe('getCommentsForCenterService', () => {
        it('should fetch comments for a center successfully', async () => {
            const mockComments = [
                {
                    _id: 'rating1',
                    center: 'center1',
                    stars: 5,
                    comment: 'Excellent facilities',
                    createdAt: new Date()
                }
            ];

            Rating.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockComments)
            });

            const result = await getCommentsForCenterService('center1');

            expect(Rating.find).toHaveBeenCalledWith({ center: 'center1' });
            expect(result).toEqual(mockComments);
            expect(result[0]).toHaveProperty('comment');
        });

        it('should throw error if centerId is missing', async () => {
            await expect(getCommentsForCenterService()).rejects.toEqual({
                status: 400,
                message: 'Center ID is required'
            });
        });

        it('should return empty array when no comments found', async () => {
            Rating.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const result = await getCommentsForCenterService('center1');
            expect(result).toEqual([]);
        });

        it('should maintain correct sort order by creation date', async () => {
            const date1 = new Date('2025-05-04T10:00:00Z');
            const date2 = new Date('2025-05-04T09:00:00Z');

            const mockComments = [
                {
                    _id: 'rating1',
                    createdAt: date1,
                    stars: 5,
                    comment: 'First comment'
                },
                {
                    _id: 'rating2',
                    createdAt: date2,
                    stars: 4,
                    comment: 'Second comment'
                }
            ];

            Rating.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockComments)
            });

            const result = await getCommentsForCenterService('center1');

            expect(result[0].createdAt).toEqual(date1);
            expect(result[1].createdAt).toEqual(date2);
        });
    });
});