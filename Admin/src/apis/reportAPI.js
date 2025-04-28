import axiosInstance from '../config/axiosConfig';

export async function getReportSummary(params = {}) {
  try {
    const response = await axiosInstance.get('/api/report/summary', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching report summary:', error);
    throw error;
  }
}

export async function getMonthlyReport(params = {}) {
  try {
    const response = await axiosInstance.get('/api/report/monthly', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    throw error;
  }
}