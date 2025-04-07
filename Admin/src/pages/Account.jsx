import React, { useState, useEffect } from 'react';
import { getAdminAccount, updateAdminAccount } from '../apis/adminAPI.js';
import { Pencil, Save } from 'lucide-react';

const Account = () => {
  // Lấy admin từ localStorage
  const storedAdmin = JSON.parse(localStorage.getItem('admin'));
  const adminId = storedAdmin?._id;

  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({ username: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!adminId) {
        setError('Không tìm thấy thông tin admin.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getAdminAccount(adminId);
        setAdmin(data);
        setFormData({
          username: data.username,
          avatar: data.avatar,
        });
      } catch (err) {
        setError('Failed to load admin account');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [adminId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateAdminAccount(adminId, formData);
      setAdmin(res.admin);
      setMessage('Account updated successfully!');
      setEditing(false);
      // Cập nhật lại localStorage nếu cần
      localStorage.setItem('admin', JSON.stringify(res.admin));
    } catch (err) {
      setError('Error updating account');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded-md">
      <h1 className="text-2xl font-bold mb-4">Quản lý Tài khoản</h1>
      {message && <p className="text-green-600 mb-4">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!editing}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Avatar URL</label>
          <input
            type="text"
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            disabled={!editing}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex justify-end gap-4">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              <Pencil size={16} /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    username: admin.username,
                    avatar: admin.avatar,
                  });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                <Save size={16} /> Lưu
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Account;
