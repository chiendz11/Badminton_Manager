import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getAllUsers, deleteUser } from "../apis/userManage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function UserManage() {
  const [searchValue, setSearchValue] = useState("");
  const [customers, setCustomers] = useState([]);
  const [rankFilter, setRankFilter] = useState("Tất cả");
  const [sortName, setSortName] = useState("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gọi API để lấy danh sách người dùng khi component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await getAllUsers();
        if (response.success) {
          setCustomers(response.data);
        } else {
          setError(response.message);
          toast.error(response.message);
        }
      } catch (err) {
        const message = err.message || "Lỗi khi lấy danh sách người dùng";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Hàm xóa khách hàng
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      const response = await deleteUser(id);
      if (response.success) {
        setCustomers(customers.filter((customer) => customer._id !== id));
        toast.success("Xóa người dùng thành công");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || "Lỗi khi xóa người dùng");
    }
  };

  // Lọc theo từ khóa trên tất cả các cột
  let filteredCustomers = customers.filter((customer, index) => {
    const searchLower = searchValue.toLowerCase();
    const searchNumber = Number(searchValue); // Chuyển searchValue thành số nếu hợp lệ

    return (
      // STT
      (index + 1).toString().includes(searchLower) ||
      // Tên
      customer.name.toLowerCase().includes(searchLower) ||
      // Xếp hạng
      customer.level.toLowerCase().includes(searchLower) ||
      // Số điện thoại (kiểm tra null/undefined)
      (customer.phone_number || "").toLowerCase().includes(searchLower) ||
      // Địa chỉ (kiểm tra null/undefined)
      (customer.address || "").toLowerCase().includes(searchLower) ||
      // Email
      customer.email.toLowerCase().includes(searchLower) ||
      // Điểm: Kiểm tra khớp chính xác hoặc một phần
      (Number.isFinite(searchNumber) && customer.points === searchNumber) ||
      customer.points.toString().includes(searchLower)
    );
  });

  // Áp dụng filter theo rank nếu không phải "Tất cả"
  if (rankFilter !== "Tất cả") {
    filteredCustomers = filteredCustomers.filter((cust) => cust.level === rankFilter);
  }

  // Áp dụng sort tên
  if (sortName === "asc") {
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortName === "desc") {
    filteredCustomers.sort((a, b) => b.name.localeCompare(b.name));
  }

  // Handler cho filter & sort
  const handleRankFilter = (e) => {
    setRankFilter(e.target.value);
  };

  const handleSort = (e) => {
    setSortName(e.target.value);
  };

  const handleSearchClick = () => {
    const query = prompt("Nhập từ khóa tìm kiếm:");
    setSearchValue(query || "");
  };

  const handleBack = () => {
    alert("Quay lại trang trước");
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full">
      <div className="bg-white w-full shadow-md overflow-hidden">
        {/* Thanh tiêu đề */}
        <div className="bg-green-700 text-white flex items-center p-3">
          <button onClick={handleBack} className="mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-center">
            Danh sách khách hàng
          </h1>
        </div>

        {/* Thanh công cụ: search, filter và sort */}
        <div className="flex items-center p-3 bg-white border-b space-x-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-2 top-2.5" />
            <input
              type="text"
              className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:outline-none focus:border-green-500"
              placeholder="Tìm kiếm khách hàng..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <select
            value={rankFilter}
            onChange={handleRankFilter}
            className="border rounded-md py-1 px-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Thành viên Iron">Thành viên Iron</option>
            <option value="Bạc">Bạc</option>
            <option value="Vàng">Vàng</option>
            <option value="Bạch kim">Bạch kim</option>
          </select>
          <select
            value={sortName}
            onChange={handleSort}
            className="border rounded-md py-1 px-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="none">Mặc định</option>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>

        {/* Thống kê */}
        <div className="flex justify-around bg-white px-3 py-2 border-b text-sm text-green-700 font-semibold">
          <div className="flex flex-col items-center">
            <div>Sắt</div>
            <div>{customers.filter((c) => c.level === "Thành viên Iron").length}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Đồng</div>
            <div>{customers.filter((c) => c.level === "Đồng").length}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Bạc</div>
            <div>{customers.filter((c) => c.level === "Bạc").length}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Bạch kim</div>
            <div>{customers.filter((c) => c.level === "Bạch kim").length}</div>
          </div>
        </div>

        {/* Bảng danh sách khách hàng */}
        <div className="bg-white">
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Lỗi: {error}</div>
          ) : (
            <table className="w-full table-auto text-sm">
              <thead className="border-b">
                <tr className="text-left text-gray-700">
                  <th className="py-2 px-3 w-16">STT</th>
                  <th className="py-2 px-3 w-24">Tên</th>
                  <th className="py-2 px-3 w-24">Xếp hạng</th>
                  <th className="py-2 px-3 w-24">Số điện thoại</th>
                  <th className="py-2 px-3 w-48 whitespace-normal">Địa chỉ</th>
                  <th className="py-2 px-3 w-24">Email</th>
                  <th className="py-2 px-3 w-16">Điểm</th>
                  <th className="py-2 px-3 text-right w-16">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-3 text-gray-500 italic">
                      Không tìm thấy khách hàng
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((item, index) => (
                    <tr key={item._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 px-3">{index + 1}</td>
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                          {item.level}
                        </span>
                      </td>
                      <td className="py-2 px-3">{item.phone_number}</td>
                      <td className="py-2 px-3 whitespace-normal">{item.address}</td>
                      <td className="py-2 px-3">{item.email}</td>
                      <td className="py-2 px-3">{item.points}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => handleDelete(item._id)}>
                          <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-600" />
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
    </div>
  );
}

export default UserManage;