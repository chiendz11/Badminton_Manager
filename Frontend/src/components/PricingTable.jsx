// // src/components/PricingTableModal.jsx
// import React, { useState, useEffect } from "react";
// import BookingHeader from "./BookingHeader";
// import { getCenterPricing } from "../apis/courts";

// const PricingTableModal = ({ centerId, onClose }) => {
//   const [pricing, setPricing] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchPricing = async () => {
//       try {
//         setLoading(true);
//         const data = await getCenterPricing(centerId);
//         setPricing(data);
//       } catch (err) {
//         console.error("Error fetching center pricing:", err);
//         setError("Could not load pricing data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchPricing();
//   }, [centerId]);

//   if (loading) {
//     return (
//       <div className="fixed inset-0 bg-green-900 text-white flex items-center justify-center z-50">
//         <div className="text-xl">Đang tải bảng giá...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="fixed inset-0 bg-green-900 text-white flex flex-col z-50">
//         <AppHeader title="Bảng giá sân" onBack={onClose} />
//         <div className="flex-1 flex items-center justify-center p-4">
//           <div className="text-red-300 text-lg">{error}</div>
//         </div>
//       </div>
//     );
//   }

//   if (!pricing) {
//     return null;
//   }

//   return (
//     <div className="fixed inset-0 bg-green-800 text-white flex flex-col z-50">
//       <BookingHeader title="Bảng giá sân" onBack={onClose} />
//       <div className="flex-1 overflow-auto p-4">
//         <h2 className="text-xl font-semibold mb-2">
//           {pricing.title || "Cầu lông"}
//         </h2>
//         <div className="bg-white text-black p-4 rounded-md">
//           <table className="w-full border-2 border-green-600 border-collapse">
//             <thead className="bg-green-50">
//               <tr>
//                 <th className="border-2 border-green-600 p-2 text-green-800 w-1/4">
//                   Day Week
//                 </th>
//                 <th className="border-2 border-green-600 p-2 text-green-800 w-1/3">
//                   Time slots
//                 </th>
//                 <th className="border-2 border-green-600 p-2 text-green-800 w-1/4">
//                   Price
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {pricing.weekday.map((item, idx) => (
//                 <tr key={`wd-${idx}`} className="bg-green-50">
//                   {idx === 0 && (
//                     <td
//                       rowSpan={pricing.weekday.length}
//                       className="border-2 border-green-600 p-2 text-center font-semibold text-green-700 align-top"
//                     >
//                       Mon - Fri
//                     </td>
//                   )}
//                   <td className="border-2 border-green-600 p-2 align-top">
//                     {item.startTime} - {item.endTime}
//                   </td>
//                   <td className="border-2 border-green-600 p-2 align-top">
//                     {item.price.toLocaleString("vi-VN")} đ
//                   </td>
//                 </tr>
//               ))}
//               {pricing.weekend.map((item, idx) => (
//                 <tr key={`we-${idx}`} className="bg-green-50">
//                   {idx === 0 && (
//                     <td
//                       rowSpan={pricing.weekend.length}
//                       className="border-2 border-green-600 p-2 text-center font-semibold text-green-700 align-top"
//                     >
//                       Sat - Sun
//                     </td>
//                   )}
//                   <td className="border-2 border-green-600 p-2 align-top">
//                     {item.startTime} - {item.endTime}
//                   </td>
//                   <td className="border-2 border-green-600 p-2 align-top">
//                     {item.price.toLocaleString("vi-VN")} đ
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PricingTableModal;

import React, { useState, useEffect } from "react";
import { getCenterPricing } from "../apis/centers";

const PricingTable = ({ centerId, onClose }) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        const data = await getCenterPricing(centerId);
        setPricing(data);
      } catch (err) {
        console.error("Error fetching center pricing:", err);
        setError("Không thể tải dữ liệu bảng giá");
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, [centerId]);

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="price-table-modal" onClick={onClose}>
      <div className="price-table-content" onClick={(e) => e.stopPropagation()}>
        <div className="price-table-header">
          <h2>Bảng giá sân</h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="price-table-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải bảng giá...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
              <button className="retry-button" onClick={() => window.location.reload()}>
                Thử lại
              </button>
            </div>
          ) : pricing ? (
            <>
              <h3>{pricing.title || "Cầu lông"}</h3>

              <div className="price-section">
                <h4>Ngày thường (Thứ 2 - Thứ 6)</h4>
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>Khung giờ</th>
                      <th>Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.weekday.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.startTime} - {item.endTime}
                        </td>
                        <td>{formatCurrency(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="price-section">
                <h4>Cuối tuần (Thứ 7 - Chủ nhật)</h4>
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>Khung giờ</th>
                      <th>Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.weekend.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.startTime} - {item.endTime}
                        </td>
                        <td>{formatCurrency(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="note-section">
                <h4>Lưu ý:</h4>
                <ul>
                  <li>Giá trên áp dụng cho 1 giờ đặt sân.</li>
                  <li>Đặt sân từ 2 giờ trở lên được giảm 5% tổng giá trị.</li>
                  <li>Khách hàng thành viên được giảm thêm 10% tổng giá trị.</li>
                  <li>Vui lòng đến sớm 10 phút trước giờ đặt sân.</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PricingTable;