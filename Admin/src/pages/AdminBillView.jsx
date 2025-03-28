import React, { useEffect, useState } from "react";
import axios from "axios";
import BillImage from "../components/BillImages";

const AdminBillView = () => {
    // Gán sẵn 1 billId để test (thay "YOUR_FIXED_BILL_ID_HERE" bằng billId có trong DB)
    const billId = "67e4c6aefcd36b5b1b747be4";
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchBill = async () => {
        try {
          // Gọi API để lấy bill theo billId
          const res = await axios.get(`http://localhost:3000/api/booking/${billId}`, { withCredentials: true });
          setBill(res.data.bill);
        } catch (error) {
          console.error("Error fetching bill:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchBill();
    }, [billId]);
  
    if (loading) return <div>Loading bill...</div>;
    if (!bill) return <div>Bill not found.</div>;
  
    return (
      <div>
        <h1>Admin Bill View</h1>
        <BillImage bill={bill} />
        {/* Hiển thị thêm các thông tin khác của bill nếu cần */}
      </div>
    );
  };
  
  export default AdminBillView;