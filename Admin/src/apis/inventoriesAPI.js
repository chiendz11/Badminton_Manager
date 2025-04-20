// client/src/apis/inventoriesAPI.js
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Nhập hàng
 * @param {{ inventoryId: string, centerId: string, supplier: string, quantityImport: number, importPrice: number }} data
 */
export function importStock(data) {
  return axios.post(`${API_URL}/api/inventories/import`, data);
}

/**
 * Lấy lịch sử nhập hàng
 * @param {{ inventoryId?: string, centerId?: string }} params
 */
export function getStockHistory(params = {}) {
  return axios.get(`${API_URL}/api/inventories/import-history`, { params });
}

/**
 * Bán hàng (trừ kho)
 * @param {{ inventoryId: string, centerId: string, quantityExport: number, exportPrice: number }} data
 */
export function sellStock(data) {
  return axios.post(`${API_URL}/api/inventories/export`, data);
}

export function getInventoryList(params = {}) {
  return axios.get(`${API_URL}/api/inventories/list`, { params });
}
