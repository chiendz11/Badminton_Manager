// src/pages/AdminRatings.jsx
import React, { useState, useEffect } from 'react';
import { getAllRatings, updateRating, deleteRating } from '../apis/ratingAPI.js';
import { Pencil, Trash2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [formData, setFormData] = useState({ stars: '', comment: '' });

  // Load danh sách rating từ API
  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await getAllRatings();
      setRatings(data);
    } catch (err) {
      setError('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  // Mở form chỉnh sửa với dữ liệu rating được chọn
  const handleEdit = (rating) => {
    setEditingRating(rating);
    setFormData({ stars: rating.stars, comment: rating.comment || '' });
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingRating(null);
    setFormData({ stars: '', comment: '' });
  };

  // Cập nhật dữ liệu khi thay đổi trong form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gửi dữ liệu cập nhật lên server
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRating) return;
    try {
      await updateRating(editingRating._id, formData);
      loadRatings();
      setEditingRating(null);
      setFormData({ stars: '', comment: '' });
    } catch (err) {
      setError('Lỗi cập nhật rating');
    }
  };

  // Xóa rating
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa rating này?")) {
      try {
        await deleteRating(id);
        loadRatings();
      } catch (err) {
        setError('Lỗi xóa rating');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Quản lý Rating</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-md">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Trung tâm</th>
                  <th className="py-2 px-4 border-b">Người dùng</th>
                  <th className="py-2 px-4 border-b">Số sao</th>
                  <th className="py-2 px-4 border-b">Bình luận</th>
                  <th className="py-2 px-4 border-b">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating._id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{rating._id}</td>
                    <td className="py-2 px-4 border-b">
                      {rating.center ? rating.center.name : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {rating.user ? rating.user.username : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">{rating.stars}</td>
                    <td className="py-2 px-4 border-b">{rating.comment}</td>
                    <td className="py-2 px-4 border-b flex gap-2">
                      <button
                        onClick={() => handleEdit(rating)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Pencil size={16} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(rating._id)}
                        className="flex items-center gap-1 text-red-600 hover:underline"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Form chỉnh sửa rating */}
        {editingRating && (
          <div className="mt-6 p-6 bg-gray-50 border rounded-md shadow-md transition-all">
            <h2 className="text-2xl font-semibold mb-4">Chỉnh sửa Rating</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Số sao (1-5)</label>
                <input
                  type="number"
                  name="stars"
                  value={formData.stars}
                  onChange={handleFormChange}
                  min="1"
                  max="5"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Bình luận</label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  rows="4"
                ></textarea>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRatings;
