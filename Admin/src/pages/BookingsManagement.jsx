// src/pages/BookingsManagement.jsx
import React, { useState } from 'react';
import { FiCalendar, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { getPendingMapping, clearAllPendingBookings } from '../apis/bookingsAPI.js';
import pic1 from '../image/pic1.jpg';
import AdminLayout from '../components/AdminLayout.jsx';

const BookingsManagement = () => {
  const [centerId, setCenterId] = useState('');
  const [date, setDate] = useState('');
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadMapping = async () => {
    if (!centerId || !date) {
      setError('Vui lòng nhập Center ID và chọn Date');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await getPendingMapping({ centerId, date });
      if (res.success) {
        setMapping(res.mapping);
      } else {
        setError('Không thể lấy pending mapping');
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    }
    setLoading(false);
  };

  // Thay 'YOUR_USER_ID' bằng ID người dùng thực tế nếu có
  const handleClear = async () => {
    if (!centerId) {
      setError('Vui lòng nhập Center ID');
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      await clearAllPendingBookings({ userId: 'YOUR_USER_ID', centerId });
      setSuccessMsg('Đã xóa toàn bộ pending booking');
      loadMapping();
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa pending booking');
    }
  };

  return (
    <AdminLayout>
      <div
        className="flex justify-center items-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${pic1})` }}
      >
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-3xl font-bold mb-4 text-center">Quản Lý Pending Booking</h2>
            <p className="text-gray-600 text-center mb-6">
              Nhập mã trung tâm và ngày đặt để xem và quản lý pending booking của bạn.
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Center ID</label>
                <input
                  type="text"
                  placeholder="Nhập Center ID"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Ngày đặt</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={loadMapping}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                <FiRefreshCw className="mr-2" />
                Tải Mapping
              </button>
              <button
                onClick={handleClear}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                <FiTrash2 className="mr-2" />
                Xóa Pending Booking
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-center">
                {successMsg}
              </div>
            )}

            {loading ? (
              <div className="text-center text-gray-600">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Court ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Trạng thái Timeslot
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {Object.keys(mapping).length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-4 py-4 text-center text-gray-500">
                          Không có dữ liệu pending booking
                        </td>
                      </tr>
                    ) : (
                      Object.keys(mapping).map((courtId) => (
                        <tr key={courtId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800 font-medium">{courtId}</td>
                          <td className="px-4 py-3 text-gray-800">
                            <div className="flex flex-wrap gap-2">
                              {mapping[courtId].map((slot, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    slot === 'trống'
                                      ? 'bg-gray-200 text-gray-600'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {slot === 'trống'
                                    ? 'Trống'
                                    : `Pending (User: ${slot.userId})`}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingsManagement;
