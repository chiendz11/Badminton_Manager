// apis/addstockAPI.js
import axios from 'axios';

/**
 * Lấy danh sách hàng
 */
export async function fetchInventories() {
  const response = await axios.get('/api/addstock');
  return response.data; // Mảng các document
}

/**
 * Thêm mới hàng
 * @param {Object} data - Thông tin sản phẩm mới
 * @returns {Object} Kết quả trả về từ server (message, data)
 */
export async function addInventory(data) {
  const response = await axios.post('/api/addstock', data);
  return response.data; // { message, data: {...} }
}
