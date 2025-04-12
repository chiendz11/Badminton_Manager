import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * Dữ liệu khách hàng demo.
 * Bạn sẽ thay thế bằng dữ liệu gọi từ API trong tương lai.
 */
const initialCustomers = [
  { id: 1, name: 'Châu Dương', rank: 'Thành viên' },
  { id: 2, name: 'Chi', rank: 'Thành viên' },
  { id: 3, name: 'Cường', rank: 'Thành viên' },
  { id: 4, name: 'Đức', rank: 'Thành viên' },
  { id: 5, name: 'DƯƠNG HOÀNG NAM', rank: 'Thành viên' },
  { id: 6, name: 'Hằng', rank: 'Thành viên' },
  { id: 7, name: 'Kiên nguyên', rank: 'Thành viên' },
  { id: 8, name: 'Lê Hoàng', rank: 'Thành viên' },
  { id: 9, name: 'Mr.Văn', rank: 'Thành viên' },
  { id: 10, name: 'Nguyễn Văn An', rank: 'Thành viên' },
  { id: 11, name: 'Quang Vinh', rank: 'Thành viên' },
  { id: 12, name: 'TEST', rank: 'Thành viên' },
  { id: 13, name: 'Ngô Anh', rank: 'Bạc' },
];

function UserManage() {
  const [searchValue, setSearchValue] = useState('');
  const [customers, setCustomers] = useState(initialCustomers);
  
  // State cho filter & sort
  const [rankFilter, setRankFilter] = useState('Tất cả'); // 'Tất cả', 'Thành viên', 'Bạc', 'Vàng', 'Bạch kim'
  const [sortName, setSortName] = useState('none');       // 'none', 'asc', 'desc'
  
  // Lọc theo từ khóa
  let filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  // Áp dụng filter theo rank nếu không phải "Tất cả"
  if (rankFilter !== 'Tất cả') {
    filteredCustomers = filteredCustomers.filter(
      (cust) => cust.rank === rankFilter
    );
  }
  
  // Áp dụng sort tên
  if (sortName === 'asc') {
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortName === 'desc') {
    filteredCustomers.sort((a, b) => b.name.localeCompare(a.name));
  }
  
  // Hàm xóa khách hàng demo
  const handleDelete = (id) => {
    const newList = customers.filter((customer) => customer.id !== id);
    setCustomers(newList);
  };
  
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
    // Xử lý quay lại trang (ví dụ: history.back())
    alert("Quay lại trang trước");
  };
  
  return (
    <div className="bg-gray-100 min-h-screen w-full">
      {/* Container chính mở rộng toàn màn hình */}
      <div className="bg-white w-full shadow-md overflow-hidden">
        {/* Thanh tiêu đề */}
        <div className="bg-green-700 text-white flex items-center p-3">
          <button onClick={handleBack} className="mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-center">
            Danh sách khách hàng
          </h1>
          <button onClick={handleSearchClick} className="p-2">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </button>
        </div>
  
        {/* Thanh công cụ: search, filter và sort trong 1 hàng */}
        <div className="flex items-center p-3 bg-white border-b space-x-2">
          {/* Input tìm kiếm */} 
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
          {/* Select filter rank */} 
          <select
            value={rankFilter}
            onChange={handleRankFilter}
            className="border rounded-md py-1 px-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Thành viên">Thành viên</option>
            <option value="Bạc">Bạc</option>
            <option value="Vàng">Vàng</option>
            <option value="Bạch kim">Bạch kim</option>
          </select>
          {/* Select sắp xếp tên */} 
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
  
        {/* Dòng hiển thị huy chương / thống kê, nằm dưới thanh công cụ */} 
        <div className="flex justify-around bg-white px-3 py-2 border-b text-sm text-green-700 font-semibold">
          <div className="flex flex-col items-center">
            <div>Sắt</div>
            <div>{customers.length}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Đồng</div>
            <div>1</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Bạc</div>
            <div>0</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Bạch kim</div>
            <div>10</div>
          </div>
        </div>
  
        {/* Bảng danh sách khách hàng */} 
        <div className="bg-white">
          <table className="w-full table-auto text-sm">
            <thead className="border-b">
              <tr className="text-left text-gray-700">
                <th className="py-2 px-3 w-16">STT</th>
                <th className="py-2 px-3">Tên</th>
                <th className="py-2 px-3">Xếp hạng</th>
                <th className="py-2 px-3 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-gray-500 italic">
                    Không tìm thấy khách hàng
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3">{index + 1}</td>
                    <td className="py-2 px-3">{item.name}</td>
                    <td className="py-2 px-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs">
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => handleDelete(item.id)}>
                        <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManage;
