// src/pages/Account.jsx
import { useEffect, useState } from "react";
import { getCurrentAdmin, updateAdminAccount } from "../apis/accountAPI.js";
import { toast } from "react-toastify";

function Account() {
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", avatar: "" });

  useEffect(() => {
    getCurrentAdmin().then(data => {
      setAdmin(data);
      setForm({ username: data.username, avatar: data.avatar, password: "" });
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateAdminAccount(form);
      setAdmin(updated);
      toast.success("Cập nhật thành công");
      setForm({ ...form, password: "" });
    } catch (err) {
      toast.error("Lỗi khi cập nhật tài khoản");
    }
  };

  if (!admin) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Quản lý tài khoản</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block">Tên đăng nhập:</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block">Mật khẩu mới (bỏ trống nếu không đổi):</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block">Avatar URL:</label>
          <input
            name="avatar"
            value={form.avatar}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Lưu thay đổi</button>
      </form>
    </div>
  );
}

export default Account;
