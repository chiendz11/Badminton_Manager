// src/pages/CentersManagement.jsx
import React, { useEffect, useState } from "react";
import { getCentersAPI, deleteCenterAPI } from "../apis/centersAPI.js";
import AdminLayout from "../components/AdminLayout.jsx";

const CentersManagement = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hàm tải danh sách các center từ API
  const fetchCenters = async () => {
    try {
      const data = await getCentersAPI();
      setCenters(data);
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  // Hàm xử lý xóa một center
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà thi đấu này không?")) {
      try {
        await deleteCenterAPI(id);
        setCenters(centers.filter((center) => center._id !== id));
      } catch (err) {
        console.error(err);
        alert("Xảy ra lỗi khi xóa nhà thi đấu!");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Quản lý Nhà Thi Đấu
        </h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-3 px-4 text-left">Tên</th>
                <th className="py-3 px-4 text-left">Địa chỉ</th>
                <th className="py-3 px-4 text-left">SĐT</th>
                <th className="py-3 px-4 text-left">Số sân</th>
                <th className="py-3 px-4 text-left">Đánh giá</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr key={center._id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">{center.name}</td>
                  <td className="py-3 px-4">{center.address}</td>
                  <td className="py-3 px-4">{center.phone}</td>
                  <td className="py-3 px-4">{center.totalCourts}</td>
                  <td className="py-3 px-4">{center.avgRating}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(center._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CentersManagement;
