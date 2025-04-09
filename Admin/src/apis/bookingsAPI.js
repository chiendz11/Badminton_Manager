// src/api/bookingApi.js
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Tạo booking mới.
 * @param {Object} bookingData Dữ liệu đặt sân.
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi tạo booking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in createBooking API:', error);
    throw error;
  }
};

/**
 * Lấy thông tin booking theo id.
 * @param {String} bookingId 
 */
export const getBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi lấy thông tin booking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getBooking API:', error);
    throw error;
  }
};

/**
 * Lấy danh sách booking với các tham số filter (vd: userId, centerId, status, date).
 * @param {Object} params 
 */
export const listBookings = async (params = {}) => {
  try {
    // Tạo chuỗi query từ object params
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/bookings?${queryString}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi lấy danh sách booking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in listBookings API:', error);
    throw error;
  }
};

/**
 * Cập nhật booking theo id.
 * @param {String} bookingId 
 * @param {Object} updateData 
 */
export const updateBooking = async (bookingId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi cập nhật booking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in updateBooking API:', error);
    throw error;
  }
};

/**
 * Xóa booking theo id.
 * @param {String} bookingId 
 */
export const deleteBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi xóa booking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in deleteBooking API:', error);
    throw error;
  }
};

export const getPendingMapping = async (centerId, date) => {
  try {
    // Xây dựng URL với query params tùy chọn
    let url = `${API_URL}/bookings?status=pending`;
    if (centerId) {
      url += `&centerId=${centerId}`;
    }
    if (date) {
      url += `&date=${date}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi lấy booking pending');
    }
    // Giả sử API trả về một mảng các booking,
    // chúng ta bao gói nó thành object để phù hợp với cách Dashboard xử lý (bookingResponse.bookings)
    const data = await response.json();
    return { bookings: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
