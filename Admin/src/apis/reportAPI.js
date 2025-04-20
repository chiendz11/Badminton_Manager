import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export function getReportSummary(params = {}) {
  return axios.get(`${API_URL}/api/report/summary`, { params });
}

export function getMonthlyReport(params = {}) {
  return axios.get(`${API_URL}/api/report/monthly`, { params });
}
