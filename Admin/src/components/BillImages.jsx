  import React from "react";

  const BillImage = ({ bill }) => {
    if (!bill || !bill.paymentImage) {
      return <div>No image available</div>;
    }

    // Giả sử bill.paymentImage là một chuỗi base64 đã được trả về từ backend
    // Nếu backend trả về Buffer, bạn cần chắc chắn rằng FE nhận được chuỗi base64.
    const dataUrl = `data:${"image/jpeg"};base64,${bill.paymentImage}`;

    return (
      <div>
        <h2>Bill Payment Image</h2>
        <img src={dataUrl} alt="Payment confirmation" style={{ maxWidth: "100%", height: "auto" }} />
      </div>
    );
  };

  export default BillImage;
