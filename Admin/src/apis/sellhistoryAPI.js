import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
const SELL_HISTORY_ENDPOINT = `${API_URL}/api/sell-histories`;

/** Lấy danh sách hóa đơn */
export function getSellHistories() {
  return axios.get(SELL_HISTORY_ENDPOINT);
}

/** Tạo hóa đơn mới
 * @param {Object} payload - { invoiceNumber, centerId, items, totalAmount, paymentMethod, customer }
 */
export function createSellHistory(payload) {
  return axios.post(SELL_HISTORY_ENDPOINT, payload);
}