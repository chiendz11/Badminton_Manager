// src/components/PricingTableModal.jsx
import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getCenterPricing } from "../apis/courts";

const PricingTableModal = ({ centerId, onClose }) => {
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
        setError("Could not load pricing data");
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, [centerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-green-900 text-white flex items-center justify-center z-50">
        <div className="text-xl">Đang tải bảng giá...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-green-900 text-white flex flex-col z-50">
        {/* Header */}
        <div className="relative h-16 flex items-center bg-green-700 px-4">
          <button
            onClick={onClose}
            className="absolute left-4 text-white text-2xl font-bold"
          >
            <FaArrowLeft />
          </button>
          <h1 className="mx-auto text-xl font-bold">
            Yard price list and yard diagram
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-red-300 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-green-900 text-white flex flex-col z-50">
      {/* Header */}
      <div className="relative h-16 flex items-center bg-green-900 px-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="absolute left-4 text-white text-3xl font-bold"
        >
          <FaArrowLeft />
        </button>
        <h1 className="mx-auto text-2xl font-bold">Bảng giá sân</h1>
      </div>

      {/* Nội dung bảng giá */}
      <div className="flex-1 overflow-auto p-4">
        <h2 className="text-xl font-semibold mb-2">
          {pricing.title || "Cầu lông"}
        </h2>

        <div className="bg-white text-black p-4 rounded-md">
          <table className="w-full border-2 border-green-600 border-collapse">
            <thead className="bg-green-50">
              <tr>
                <th className="border-2 border-green-600 p-2 text-green-800 w-1/4">
                  Day Week
                </th>
                <th className="border-2 border-green-600 p-2 text-green-800 w-1/3">
                  Time slots
                </th>
                <th className="border-2 border-green-600 p-2 text-green-800 w-1/4">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Weekday rows */}
              {pricing.weekday.map((item, idx) => (
                <tr key={`wd-${idx}`} className="bg-green-50">
                  {idx === 0 && (
                    <td
                      rowSpan={pricing.weekday.length}
                      className="border-2 border-green-600 p-2 text-center font-semibold text-green-700 align-top"
                    >
                      Mon - Fri
                    </td>
                  )}
                  <td className="border-2 border-green-600 p-2 align-top">
                    {item.startTime} - {item.endTime}
                  </td>
                  <td className="border-2 border-green-600 p-2 align-top">
                    {item.price.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
              {/* Weekend rows */}
              {pricing.weekend.map((item, idx) => (
                <tr key={`we-${idx}`} className="bg-green-50">
                  {idx === 0 && (
                    <td
                      rowSpan={pricing.weekend.length}
                      className="border-2 border-green-600 p-2 text-center font-semibold text-green-700 align-top"
                    >
                      Sat - Sun
                    </td>
                  )}
                  <td className="border-2 border-green-600 p-2 align-top">
                    {item.startTime} - {item.endTime}
                  </td>
                  <td className="border-2 border-green-600 p-2 align-top">
                    {item.price.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingTableModal;
