import mongoose from 'mongoose';
import {
    calculateReport,
    calculateMonthlyReport
} from '../../Backend/services/reportServices.js';
import SellHistory from '../../Backend/models/sellhistory.js';
import StockHistory from '../../Backend/models/stockhistory.js';

// Mock the models
jest.mock('../../Backend/models/sellhistory.js', () => ({
    find: jest.fn()
}));

jest.mock('../../Backend/models/stockhistory.js', () => ({
    find: jest.fn()
}));

describe('Report Services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateReport', () => {
        it('should calculate report for a specific center and date range', async () => {
            const mockSales = [
                { totalAmount: 100, createdAt: new Date('2025-05-01') },
                { totalAmount: 200, createdAt: new Date('2025-05-02') }
            ];
            const mockPurchases = [
                { totalCost: 50, createdAt: new Date('2025-05-01') },
                { totalCost: 70, createdAt: new Date('2025-05-02') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1',
                startDate: '2025-05-01',
                endDate: '2025-05-02'
            });

            expect(result).toEqual({
                totalRevenue: 300,
                totalCost: 120,
                profit: 180,
                totalInvoices: 2,
                totalImports: 2
            });

            expect(SellHistory.find).toHaveBeenCalledWith({
                centerId: 'center1',
                createdAt: {
                    $gte: expect.any(Date),
                    $lte: expect.any(Date)
                }
            });
        });

        it('should handle empty data', async () => {
            SellHistory.find.mockResolvedValue([]);
            StockHistory.find.mockResolvedValue([]);

            const result = await calculateReport({
                centerId: 'center1'
            });

            expect(result).toEqual({
                totalRevenue: 0,
                totalCost: 0,
                profit: 0,
                totalInvoices: 0,
                totalImports: 0
            });
        });

        it('should calculate report without date range', async () => {
            const mockSales = [{ totalAmount: 100 }];
            const mockPurchases = [{ totalCost: 50 }];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1'
            });

            expect(result.totalRevenue).toBe(100);
            expect(result.totalCost).toBe(50);
            expect(result.profit).toBe(50);

            expect(SellHistory.find).toHaveBeenCalledWith({
                centerId: 'center1'
            });
        });

        it('should handle database errors gracefully', async () => {
            SellHistory.find.mockRejectedValue(new Error('Database error'));

            await expect(calculateReport({
                centerId: 'center1'
            })).rejects.toThrow('Database error');
        });

        it('should handle invalid date formats', async () => {
            const mockSales = [{ totalAmount: 100 }];
            const mockPurchases = [{ totalCost: 50 }];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            await expect(calculateReport({
                startDate: 'invalid-date'
            })).resolves.toBeTruthy();
        });

        it('should handle missing centerId', async () => {
            const mockSales = [{ totalAmount: 100 }];
            const mockPurchases = [{ totalCost: 50 }];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({});

            expect(result).toEqual({
                totalRevenue: 100,
                totalCost: 50,
                profit: 50,
                totalInvoices: 1,
                totalImports: 1
            });

            expect(SellHistory.find).toHaveBeenCalledWith({});
        });

        it('should handle partial date range with only startDate', async () => {
            const mockSales = [{ totalAmount: 100, createdAt: new Date('2025-05-01') }];
            const mockPurchases = [{ totalCost: 50, createdAt: new Date('2025-05-01') }];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1',
                startDate: '2025-05-01'
            });

            expect(result).toEqual({
                totalRevenue: 100,
                totalCost: 50,
                profit: 50,
                totalInvoices: 1,
                totalImports: 1
            });

            expect(SellHistory.find).toHaveBeenCalledWith({
                centerId: 'center1',
                createdAt: {
                    $gte: expect.any(Date)
                }
            });
        });

        it('should handle partial date range with only endDate', async () => {
            const mockSales = [{ totalAmount: 100, createdAt: new Date('2025-05-01') }];
            const mockPurchases = [{ totalCost: 50, createdAt: new Date('2025-05-01') }];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1',
                endDate: '2025-05-02'
            });

            expect(result).toEqual({
                totalRevenue: 100,
                totalCost: 50,
                profit: 50,
                totalInvoices: 1,
                totalImports: 1
            });

            expect(SellHistory.find).toHaveBeenCalledWith({
                centerId: 'center1',
                createdAt: {
                    $lte: expect.any(Date)
                }
            });
        });

        it('should handle invalid totalAmount or totalCost', async () => {
            const mockSales = [
                { totalAmount: null, createdAt: new Date('2025-05-01') },
                { totalAmount: undefined, createdAt: new Date('2025-05-01') }
            ];
            const mockPurchases = [
                { totalCost: null, createdAt: new Date('2025-05-01') },
                { totalCost: undefined, createdAt: new Date('2025-05-01') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1'
            });

            expect(result).toEqual({
                totalRevenue: NaN,
                totalCost: NaN,
                profit: NaN,
                totalInvoices: 2,
                totalImports: 2
            });
        });

        it('should handle large numbers', async () => {
            const mockSales = [
                { totalAmount: Number.MAX_SAFE_INTEGER, createdAt: new Date('2025-05-01') }
            ];
            const mockPurchases = [
                { totalCost: Number.MAX_SAFE_INTEGER / 2, createdAt: new Date('2025-05-01') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateReport({
                centerId: 'center1'
            });

            expect(result).toEqual({
                totalRevenue: Number.MAX_SAFE_INTEGER,
                totalCost: Number.MAX_SAFE_INTEGER / 2,
                profit: Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER / 2,
                totalInvoices: 1,
                totalImports: 1
            });
        });
    });

    describe('calculateMonthlyReport', () => {
        it('should calculate monthly report for a year', async () => {
            const mockSales = [
                { totalAmount: 100, createdAt: new Date('2025-01-15') },
                { totalAmount: 200, createdAt: new Date('2025-02-15') }
            ];
            const mockPurchases = [
                { totalCost: 50, createdAt: new Date('2025-01-15') },
                { totalCost: 70, createdAt: new Date('2025-02-15') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result).toHaveLength(12);
            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: 100,
                totalCost: 50,
                profit: 50
            });
            expect(result[1]).toEqual({
                month: 2,
                totalRevenue: 200,
                totalCost: 70,
                profit: 130
            });
        });

        it('should handle empty data in monthly report', async () => {
            SellHistory.find.mockResolvedValue([]);
            StockHistory.find.mockResolvedValue([]);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result).toHaveLength(12);
            result.forEach(month => {
                expect(month).toEqual({
                    month: expect.any(Number),
                    totalRevenue: 0,
                    totalCost: 0,
                    profit: 0
                });
            });
        });

        it('should aggregate multiple transactions in same month', async () => {
            const mockSales = [
                { totalAmount: 100, createdAt: new Date('2025-01-15') },
                { totalAmount: 150, createdAt: new Date('2025-01-20') }
            ];
            const mockPurchases = [
                { totalCost: 50, createdAt: new Date('2025-01-15') },
                { totalCost: 60, createdAt: new Date('2025-01-20') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: 250,
                totalCost: 110,
                profit: 140
            });
        });

        it('should include transactions from all years when no year filter is applied', async () => {
            const mockSales = [
                { totalAmount: 100, createdAt: new Date('2024-12-31') },
                { totalAmount: 200, createdAt: new Date('2025-01-01') }
            ];
            const mockPurchases = [
                { totalCost: 50, createdAt: new Date('2024-12-31') },
                { totalCost: 70, createdAt: new Date('2025-01-01') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: 200,
                totalCost: 70,
                profit: 130
            });
            expect(result[11]).toEqual({
                month: 12,
                totalRevenue: 100,
                totalCost: 50,
                profit: 50
            });
        });

        it('should handle database errors in monthly report', async () => {
            SellHistory.find.mockRejectedValue(new Error('Database error'));

            await expect(calculateMonthlyReport(2025, 'center1'))
                .rejects.toThrow('Database error');
        });

        it('should throw error on invalid date data', async () => {
            const mockSales = [
                { totalAmount: 200, createdAt: new Date('2025-01-01') },
                { totalAmount: 400, createdAt: new Date('invalid') }
            ];
            const mockPurchases = [
                { totalCost: 70, createdAt: new Date('2025-01-01') },
                { totalCost: 90, createdAt: new Date('invalid') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            await expect(calculateMonthlyReport(2025, 'center1')).rejects.toThrow();
        });

        it('should throw error on records with null dates', async () => {
            const mockSales = [
                { totalAmount: 200, createdAt: new Date('2025-01-01') },
                { totalAmount: 400, createdAt: new Date('invalid') },
                { totalAmount: 300, createdAt: null }
            ];
            const mockPurchases = [
                { totalCost: 70, createdAt: new Date('2025-01-01') },
                { totalCost: 90, createdAt: new Date('invalid') },
                { totalCost: 80, createdAt: null }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            await expect(calculateMonthlyReport(2025, 'center1')).rejects.toThrow();
        });

        it('should throw error on missing centerId', async () => {
            await expect(calculateMonthlyReport(2025)).rejects.toThrow();
        });

        it('should throw error on missing year', async () => {
            await expect(calculateMonthlyReport(undefined, 'center1')).rejects.toThrow();
        });

        it('should handle invalid totalAmount or totalCost', async () => {
            const mockSales = [
                { totalAmount: null, createdAt: new Date('2025-01-01') },
                { totalAmount: undefined, createdAt: new Date('2025-01-01') }
            ];
            const mockPurchases = [
                { totalCost: null, createdAt: new Date('2025-01-01') },
                { totalCost: undefined, createdAt: new Date('2025-01-01') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: NaN,
                totalCost: NaN,
                profit: NaN
            });
        });

        it('should handle edge case dates', async () => {
            const mockSales = [
                { totalAmount: 100, createdAt: new Date('2025-01-15T12:00:00Z') },
                { totalAmount: 200, createdAt: new Date('2025-12-15T12:00:00Z') }
            ];
            const mockPurchases = [
                { totalCost: 50, createdAt: new Date('2025-01-15T12:00:00Z') },
                { totalCost: 70, createdAt: new Date('2025-12-15T12:00:00Z') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: 100,
                totalCost: 50,
                profit: 50
            });
            expect(result[11]).toEqual({
                month: 12,
                totalRevenue: 200,
                totalCost: 70,
                profit: 130
            });
        });

        it('should handle large numbers', async () => {
            const mockSales = [
                { totalAmount: Number.MAX_SAFE_INTEGER, createdAt: new Date('2025-01-01') }
            ];
            const mockPurchases = [
                { totalCost: Number.MAX_SAFE_INTEGER / 2, createdAt: new Date('2025-01-01') }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            const result = await calculateMonthlyReport(2025, 'center1');

            expect(result[0]).toEqual({
                month: 1,
                totalRevenue: Number.MAX_SAFE_INTEGER,
                totalCost: Number.MAX_SAFE_INTEGER / 2,
                profit: Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER / 2
            });
        });

        it('should throw error on invalid createdAt types', async () => {
            const mockSales = [
                { totalAmount: 200, createdAt: new Date('2025-01-01') },
                { totalAmount: 400, createdAt: "2025-01-01" },
                { totalAmount: 300, createdAt: {} }
            ];
            const mockPurchases = [
                { totalCost: 70, createdAt: new Date('2025-01-01') },
                { totalCost: 90, createdAt: "2025-01-01" },
                { totalCost: 80, createdAt: {} }
            ];

            SellHistory.find.mockResolvedValue(mockSales);
            StockHistory.find.mockResolvedValue(mockPurchases);

            await expect(calculateMonthlyReport(2025, 'center1')).rejects.toThrow();
        });
    });
});