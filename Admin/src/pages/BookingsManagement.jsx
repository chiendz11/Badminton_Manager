// src/components/BookingManagement.jsx
import React, { useEffect, useState } from 'react';
import {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../apis/bookingsAPI.js';
import AdminLayout from "../components/AdminLayout.jsx";

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dữ liệu cho form tạo mới hoặc cập nhật booking
  const [formData, setFormData] = useState({
    userId: '',
    centerId: '',
    date: '',
    totalAmount: '',
    paymentMethod: 'banking',
    note: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách booking');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await updateBooking(editingBookingId, formData);
      } else {
        await createBooking(formData);
      }
      await loadBookings();
      setFormData({
        userId: '',
        centerId: '',
        date: '',
        totalAmount: '',
        paymentMethod: 'banking',
        note: '',
      });
      setIsEditing(false);
      setEditingBookingId(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (booking) => {
    setIsEditing(true);
    setEditingBookingId(booking._id);
    setFormData({
      userId: booking.userId?._id || booking.userId || '',
      centerId: booking.centerId?._id || booking.centerId || '',
      date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      note: booking.note,
    });
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa booking này không?')) return;
    try {
      await deleteBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa booking');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quản lý Booking</h2>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{error}</div>}
        
        {/* Form tạo mới / cập nhật booking */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 bg-white rounded-lg shadow border border-gray-200"
        >
          <h3 className="text-xl font-semibold mb-4">
            {isEditing ? 'Cập nhật Booking' : 'Tạo Booking mới'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">User ID:</label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                required
                placeholder="Nhập User ID"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Center ID:</label>
              <input
                type="text"
                name="centerId"
                value={formData.centerId}
                onChange={handleInputChange}
                required
                placeholder="Nhập Center ID"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Ngày:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Tổng tiền:</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                required
                placeholder="Nhập tổng tiền"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Phương thức thanh toán:</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="banking">Banking</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Note:</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Ghi chú (nếu có)"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingBookingId(null);
                  setFormData({
                    userId: '',
                    centerId: '',
                    date: '',
                    totalAmount: '',
                    paymentMethod: 'banking',
                    note: '',
                  });
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
        
        {/* Danh sách booking */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-600">Đang tải danh sách booking...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Booking Code</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">User</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Center</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Ngày</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Tổng tiền</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Phương thức</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Note</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-500">
                      Không có booking nào
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-4 py-2 text-sm text-gray-700">{booking.bookingCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {booking.userId && booking.userId.name ? booking.userId.name : booking.userId}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {booking.centerId && booking.centerId.name ? booking.centerId.name : booking.centerId}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {booking.date ? new Date(booking.date).toLocaleDateString() : ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{booking.totalAmount}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{booking.paymentMethod}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{booking.status}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{booking.note}</td>
                      <td className="px-4 py-2 text-sm text-center">
                        <button 
                          onClick={() => handleEdit(booking)}
                          className="px-3 py-1 text-xs bg-yellow-400 text-white rounded hover:bg-yellow-500 transition mr-2"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDelete(booking._id)}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingManagement;
