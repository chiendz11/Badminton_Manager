// src/pages/AdminNews.jsx
import React, { useState, useEffect } from 'react';
import { getAllNews, createNews, updateNews, deleteNews } from '../apis/newsAPI.js';
import { Pencil, Trash2, Plus } from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';

const AdminNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' hoặc 'edit'
  const [currentNews, setCurrentNews] = useState({
    title: '',
    content: '',
    images: [],
    video: '',
    author: 'Admin',
    tags: [],
  });
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load danh sách tin tức
  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getAllNews();
      setNewsList(data);
    } catch (err) {
      setError('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Xử lý thay đổi giá trị input trong form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentNews(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý submit form (thêm mới hoặc cập nhật)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'create') {
        await createNews(currentNews);
      } else {
        await updateNews(selectedNewsId, currentNews);
      }
      setCurrentNews({
        title: '',
        content: '',
        images: [],
        video: '',
        author: 'Admin',
        tags: [],
      });
      setShowForm(false);
      loadNews();
    } catch (err) {
      setError('Lỗi lưu dữ liệu');
    }
  };

  // Mở form chỉnh sửa với dữ liệu của tin đã chọn
  const handleEdit = (newsItem) => {
    setFormMode('edit');
    setSelectedNewsId(newsItem._id);
    setCurrentNews({
      title: newsItem.title || '',
      content: newsItem.content || '',
      images: newsItem.images || [],
      video: newsItem.video || '',
      author: newsItem.author || 'Admin',
      tags: newsItem.tags || [],
    });
    setShowForm(true);
  };

  // Xử lý xóa tin tức với xác nhận từ người dùng
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        await deleteNews(id);
        loadNews();
      } catch (err) {
        setError('Lỗi xóa dữ liệu');
      }
    }
  };

  // Mở form thêm mới
  const openForm = () => {
    setFormMode('create');
    setSelectedNewsId(null);
    setCurrentNews({
      title: '',
      content: '',
      images: [],
      video: '',
      author: 'Admin',
      tags: [],
    });
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Quản lý News</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button 
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors mb-4"
          onClick={openForm}
        >
          <Plus size={16} /> Thêm mới
        </button>
        
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-md">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Tiêu đề</th>
                  <th className="py-2 px-4 border-b">Tác giả</th>
                  <th className="py-2 px-4 border-b">Ngày tạo</th>
                  <th className="py-2 px-4 border-b">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {newsList.map(newsItem => (
                  <tr key={newsItem._id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{newsItem.title}</td>
                    <td className="py-2 px-4 border-b">{newsItem.author}</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(newsItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b flex gap-2">
                      <button 
                        onClick={() => handleEdit(newsItem)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Pencil size={16} /> Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(newsItem._id)}
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

        {/* Form thêm mới/chỉnh sửa tin tức */}
        {showForm && (
          <div className="mt-6 p-6 bg-gray-50 border rounded-md shadow-md transition-all">
            <h2 className="text-2xl font-semibold mb-4">
              {formMode === 'create' ? 'Thêm News mới' : 'Chỉnh sửa News'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  name="title" 
                  value={currentNews.title} 
                  onChange={handleInputChange} 
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Nội dung</label>
                <textarea 
                  name="content" 
                  value={currentNews.content} 
                  onChange={handleInputChange} 
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-green-500" 
                  rows="5" 
                  required 
                ></textarea>
              </div>
              {/* Có thể bổ sung thêm các trường khác như images, video, tags nếu cần */}
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  {formMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNews;
