// src/components/Account.jsx
import React, { useState, useEffect } from 'react';
import { getAdminAccount, updateAdminAccount } from '../apis/accountAPI.js';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({ username: '', avatar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy thông tin admin từ localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin && storedAdmin !== 'undefined') {
      try {
        const adminData = JSON.parse(storedAdmin);
        if (adminData && adminData._id) {
          fetchAdmin(adminData._id);
        } else {
          // Nếu không có _id, chuyển hướng về login hoặc xử lý lỗi khác
          navigate('/login');
        }
      } catch (error) {
        console.error('Lỗi parse JSON:', error);
        navigate('/login');
      }
    } else {
      // Nếu không có admin nào trong localStorage
      navigate('/login');
    }
  }, [navigate]);
  

  const fetchAdmin = async (adminId) => {
    try {
      setLoading(true);
      const adminData = await getAdminAccount(adminId);
      setAdmin(adminData);
      setFormData({
        username: adminData.username || '',
        avatar: adminData.avatar || ''
      });
    } catch (err) {
      console.error('Chi tiết lỗi:', err);
      setError('Lỗi khi tải thông tin tài khoản admin');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Xử lý cập nhật thông tin admin
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const result = await updateAdminAccount(admin._id, formData);
      if (result.admin) {
        // Cập nhật lại thông tin admin trong localStorage nếu cần
        localStorage.setItem('admin', JSON.stringify(result.admin));
        setAdmin(result.admin);
        setSuccess('Cập nhật thông tin thành công!');
      }
    } catch (err) {
      console.error('Chi tiết lỗi:', err);
      setError('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Thông tin tài khoản Admin</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {admin && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="username" style={{ marginRight: '10px' }}>
              Tên đăng nhập:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập mới"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="avatar" style={{ marginRight: '10px' }}>
              Avatar URL:
            </label>
            <input
              type="text"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="Nhập đường dẫn avatar mới"
            />
          </div>
          <button type="submit" disabled={loading}>
            Cập nhật
          </button>
        </form>
      )}
    </div>
  );
};

export default Account;
