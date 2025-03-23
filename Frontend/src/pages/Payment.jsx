// // src/pages/PaymentPage.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { clearAllPendingBookings, confirmBooking } from "../apis/booking";
// import { getUserById } from "../apis/users";
// import { Copy } from "lucide-react";
// import SessionExpired from "./SessionExpired";
// import BookingHeader from "../components/BookingHeader";

// export default function PaymentPage() {
//   const navigate = useNavigate();
//   const { search } = useLocation();
//   const query = new URLSearchParams(search);

//   // Lấy các query parameter từ URL
//   const userId = query.get("user") || "000000000000000000000001";
//   const centerId = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
//   const initialDate = query.get("date") || new Date().toISOString().split("T")[0];
//   // Tổng tiền được truyền từ BookingSchedule
//   const totalPrice = query.get("total") ? Number(query.get("total")) : 0;

//   const [selectedDate] = useState(initialDate);
//   const [userInfo, setUserInfo] = useState({ name: "", phone: "" });
//   // timeLeft sẽ được tính dựa trên bookingExpiresAt (nếu có) hoặc fallback 300 giây
//   const [timeLeft, setTimeLeft] = useState(300);
//   const [showCopied, setShowCopied] = useState(false);
//   const qrCode = "/images/Tiền.jpg"; // Đường dẫn QR code

//   // Lấy thông tin user khi component mount
//   useEffect(() => {
//     const fetchUserInfo = async () => {
//       try {
//         const user = await getUserById(userId);
//         if (user) {
//           setUserInfo(user);
//         }
//       } catch (error) {
//         console.error("Error fetching user info:", error);
//       }
//     };
//     fetchUserInfo();
//   }, [userId]);

//   // Clear pending bookings khi load
//   useEffect(() => {
//     const clearAll = async () => {
//       try {
//         await clearAllPendingBookings({ userId, centerId });
//       } catch (error) {
//         console.error("Error clearing pending bookings on mount:", error);
//       }
//     };
//     clearAll();
//   }, [userId, centerId]);

//   // Đồng hồ đếm ngược
//   useEffect(() => {
//     const getExpiresAt = () => {
//       const expiresAtStr = localStorage.getItem("bookingExpiresAt");
//       console.log("bookingExpiresAt from localStorage:", expiresAtStr);
//       if (expiresAtStr) {
//         return new Date(expiresAtStr).getTime();
//       }
//       return null;
//     };

//     const startCountdown = () => {
//       const expiresAt = getExpiresAt();
//       if (expiresAt) {
//         const updateCountdown = () => {
//           const now = Date.now();
//           const remaining = Math.floor((expiresAt - now) / 1000);
//           console.log("Updating countdown using expiresAt. Remaining seconds:", remaining);
//           setTimeLeft(remaining > 0 ? remaining : 0);
//         };
//         updateCountdown();
//         const interval = setInterval(updateCountdown, 1000);
//         return () => clearInterval(interval);
//       } else {
//         const startTime = parseInt(localStorage.getItem("paymentStartTime"), 10) || Date.now();
//         console.log("Using paymentStartTime for countdown. Start time:", startTime);
//         const updateCountdown = () => {
//           const now = Date.now();
//           const elapsed = Math.floor((now - startTime) / 1000);
//           const remaining = 300 - elapsed;
//           console.log("Updating countdown using paymentStartTime. Elapsed:", elapsed, "Remaining:", remaining);
//           setTimeLeft(remaining > 0 ? remaining : 0);
//         };
//         updateCountdown();
//         const interval = setInterval(updateCountdown, 1000);
//         return () => clearInterval(interval);
//       }
//     };

//     const cleanup = startCountdown();
//     return cleanup;
//   }, []);

//   const formatTime = (t) => {
//     const m = Math.floor(t / 60);
//     const s = t % 60;
//     return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   };

//   const handleCopyAccount = () => {
//     navigator.clipboard.writeText("0982451906");
//     setShowCopied(true);
//     setTimeout(() => setShowCopied(false), 1500);
//   };

//   const handleConfirmOrder = async () => {
//     try {
//       // Gọi API xác nhận booking và truyền thêm totalPrice
//       const { success } = await confirmBooking({
//         userId,
//         centerId,
//         date: selectedDate,
//         totalPrice
//       });
//       if (success) {
//         alert("Đơn hàng của bạn đã được xác nhận (booked).");
//         localStorage.removeItem("paymentStartTime");
//         localStorage.removeItem("bookingExpiresAt");
//         navigate("/");
//       }
//     } catch (error) {
//       alert("Lỗi khi xác nhận booking: " + error.message);
//     }
//   };

//   // Xử lý khi nhấn back (popstate)
//   useEffect(() => {
//     window.history.pushState(null, "", window.location.href);
//     const handlePopState = () => {
//       clearAllPendingBookings({ userId, centerId })
//         .then(() => {
//           localStorage.removeItem("paymentStartTime");
//           navigate("/");
//         })
//         .catch((err) => {
//           console.error("Error clearing pending bookings on back button:", err);
//           navigate("/");
//         });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [navigate, userId, centerId]);

//   // Clear pending bookings khi component unmount
//   useEffect(() => {
//     return () => {
//       clearAllPendingBookings({ userId, centerId })
//         .then(() => {
//           localStorage.removeItem("paymentStartTime");
//         })
//         .catch((err) => console.error("Error clearing pending bookings on unmount:", err));
//     };
//   }, [userId, centerId]);

//   if (timeLeft === 0) {
//     return <SessionExpired />;
//   }

//   return (
//     <div className="min-h-screen w-full flex flex-col bg-green-800 text-white">
//       {/* Header: dùng AppHeader với callback onBack */}
//       <BookingHeader
//         title="Payment"
//         onBack={() => navigate("/")} // Khi nhấn mũi tên, về trang Home
//       />

//       {/* Nội dung chính */}
//       <div className="flex flex-1 p-4 gap-4">
//         {/* Cột trái: Thông tin thanh toán */}
//         <div className="flex-1 flex flex-col gap-4 border-r border-white/50 pr-4">
//           <div className="p-4 bg-green-800 flex gap-4">
//             <div className="flex-1">
//               <h2 className="text-lg font-bold mb-2" style={{ color: "#CEE86B" }}>
//                 1. Bank Account
//               </h2>
//               <p>
//                 Account name: <span className="font-semibold">BUI ANH CHIEN</span>
//               </p>
//               <div className="flex items-center gap-2 mt-1">
//                 <p>
//                   Account number:{" "}
//                   <span className="font-semibold">0982451906</span>
//                 </p>
//                 <div className="relative">
//                   <button
//                     onClick={handleCopyAccount}
//                     className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded flex items-center gap-1"
//                   >
//                     <Copy size={16} /> Copy
//                   </button>
//                   {showCopied && (
//                     <div className="absolute top-full left-0 mt-1 text-green-600 text-sm bg-white px-2 py-1 rounded shadow">
//                       Copied!
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <p>
//                 Bank name: <span className="font-semibold">MBBank</span>
//               </p>
//             </div>
//             <div className="flex items-start justify-center">
//               <img
//                 src={qrCode}
//                 alt="QR Code"
//                 className="border border-gray-300 w-32 h-32 object-contain rounded"
//               />
//             </div>
//           </div>

//           <div className="bg-green-800 text-white font-semibold rounded p-3 flex items-center gap-2">
//             <span className="text-xl text-yellow-600">🚨</span>
//             <span className="leading-tight">
//               Please transfer{" "}
//               <span className="text-yellow-200 font-bold">
//                 {totalPrice.toLocaleString("vi-VN")} đ
//               </span>{" "}
//               and send payment images in the boxes below to complete the booking!
//             </span>
//           </div>

//           <p className="text-sm" style={{ color: "#CEE86B" }}>
//             After transferring, please check your booking status in the "Account"
//             tab until the owner confirms.
//           </p>

//           <div className="text-center">
//             <p>Your booking will be reserved for</p>
//             <h3 className="text-2xl font-bold mt-1">{formatTime(timeLeft)}</h3>
//           </div>

//           <div className="flex gap-4 justify-center">
//             <div className="border-2 border-white rounded w-40 h-40 flex flex-col items-center justify-center text-center p-2">
//               <p className="text-sm">Click to upload payment image (*)</p>
//             </div>
//             <div className="border-2 border-white rounded w-40 h-40 flex flex-col items-center justify-center text-center p-2">
//               <p className="text-sm">Click to upload student/discount proof</p>
//             </div>
//           </div>

//           <div className="mt-auto">
//             <button
//               onClick={handleConfirmOrder}
//               className="bg-[#F1C40F] hover:bg-[#e1b70d] text-black font-bold w-full py-3 rounded text-lg"
//             >
//               CONFIRM BOOKING
//             </button>
//           </div>
//         </div>

//         {/* Cột phải: Thông tin booking */}
//         <div className="w-80 h-1/2 bg-green-900 rounded p-4 flex flex-col gap-1">
//           <p>
//             <strong>Name:</strong> {userInfo.name || "Loading..."}
//           </p>
//           <p>
//             <strong>Phone:</strong> {userInfo.phone || "Loading..."}
//           </p>
//           <p>
//             <strong>Booking Code:</strong> #646
//           </p>
//           <p>
//             <strong>Detail:</strong> {selectedDate} <br />
//             {/* Các slot chi tiết có thể được thêm vào sau */}
//           </p>
//           <p>
//             <strong>Total:</strong>{" "}
//             <span className="text-yellow-300">
//               {totalPrice.toLocaleString("vi-VN")} đ
//             </span>
//           </p>
//           <p>
//             <strong>Need payment:</strong>{" "}
//             <span className="text-yellow-300">
//               {totalPrice.toLocaleString("vi-VN")} đ
//             </span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAllPendingBookings, confirmBooking } from "../apis/booking";
import { getUserById } from "../apis/users";
import { Copy, Clock, AlertTriangle, Upload, User, Phone, Hash, Calendar, DollarSign } from "lucide-react";
import SessionExpired from "./SessionExpired";
import BookingHeader from "../components/BookingHeader";

const PaymentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Nếu state không có, lấy từ localStorage
  const userId = state?.user ||  "000000000000000000000001";
  const centerId = state?.centerId || localStorage.getItem("centerId") || "67ca6e3cfc964efa218ab7d7";
  const initialDate = state?.date || localStorage.getItem("date") || new Date().toISOString().split("T")[0];
  const totalPrice = state?.total || Number(localStorage.getItem("totalPrice")) || 0;

  

  const [selectedDate] = useState(initialDate);
  const [userInfo, setUserInfo] = useState({ name: "", phone: "" });
  // timeLeft: tính dựa trên bookingExpiresAt hoặc fallback 300 giây
  const [timeLeft, setTimeLeft] = useState(300);
  const [showCopied, setShowCopied] = useState(false);
  const qrCode = "/images/Tiền.jpg"; // Đường dẫn QR code
  const [paymentImage, setPaymentImage] = useState(null);
  const [discountImage, setDiscountImage] = useState(null);

  // Thêm ref cho các input file ẩn
  const paymentFileInputRef = useRef(null);
  const discountFileInputRef = useRef(null);

  // Lấy thông tin user khi component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await getUserById(userId);
        if (user) {
          setUserInfo(user);
          console.log("User info fetched:", user);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, [userId]);

  // Clear pending bookings khi load
  useEffect(() => {
    const clearAll = async () => {
      try {
        await clearAllPendingBookings({ userId, centerId });
      } catch (error) {
        console.error("Error clearing pending bookings on mount:", error);
      }
    };
    clearAll();
  }, [userId, centerId]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    const getExpiresAt = () => {
      const expiresAtStr = localStorage.getItem("bookingExpiresAt");
      console.log("bookingExpiresAt from localStorage:", expiresAtStr);
      if (expiresAtStr) {
        return new Date(expiresAtStr).getTime();
      }
      return null;
    };

    const startCountdown = () => {
      const expiresAt = getExpiresAt();
      let animationFrameId; // Khai báo biến ở đây
      if (expiresAt) {
        const updateCountdown = () => {
          if (expiresAt) {
            const now = Date.now();
            const remaining = Math.floor((expiresAt - now) / 1000).toFixed(1);
            setTimeLeft(remaining > 0 ? remaining : 0);
            if (remaining > 0) {
              animationFrameId = requestAnimationFrame(updateCountdown);
            }
          }
        };

        updateCountdown();

        return () => cancelAnimationFrame(animationFrameId);
      } else {
        const startTime = parseInt(localStorage.getItem("paymentStartTime"), 10) || Date.now();
        console.log("Using paymentStartTime for countdown. Start time:", startTime);
        const updateCountdown = () => {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = 300 - elapsed;
          console.log("Updating countdown using paymentStartTime. Elapsed:", elapsed, "Remaining:", remaining);
          setTimeLeft(remaining > 0 ? remaining : 0);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 250);
        return () => clearInterval(interval);
      }
    };

    const cleanup = startCountdown();
    return cleanup;
  }, []);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("0982451906");
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleConfirmOrder = async () => {
    try {
      // Gọi API xác nhận booking và truyền thêm totalPrice
      const { success } = await confirmBooking({
        userId,
        centerId,
        date: selectedDate,
        totalPrice,
      });
      if (success) {
        alert("Đơn hàng của bạn đã được xác nhận (booked).");
        localStorage.removeItem("paymentStartTime");
        localStorage.removeItem("bookingExpiresAt");
        navigate("/");
      }
    } catch (error) {
      alert("Lỗi khi xác nhận booking: " + error.message);
    }
  };

  const handlePaymentImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleDiscountImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDiscountImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Xử lý khi nhấn back (popstate)
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => {
          localStorage.removeItem("paymentStartTime");
          navigate("/");
        })
        .catch((err) => {
          console.error("Error clearing pending bookings on back button:", err);
          navigate("/");
        });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, userId, centerId]);

  // Clear pending bookings khi component unmount
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => {
          localStorage.removeItem("paymentStartTime");
        })
        .catch((err) => console.error("Error clearing pending bookings on unmount:", err));
    };
  }, [userId, centerId]);

  if (timeLeft === 0) {
    return <SessionExpired />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-green-800 text-white">
      {/* Header */}
      <BookingHeader
        title="Payment"
        onBack={() => navigate("/")}
      />

      {/* Main content */}
      <div className="flex flex-1 p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Left column: Payment information */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Bank account card */}
          <div className="bg-green-700 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-4 py-3 border-b border-green-500">
              <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-300">
                <DollarSign size={20} />
                Bank Account Information
              </h2>
            </div>
            
            <div className="p-5 flex gap-6 items-center">
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-gray-300 text-sm mb-1">Account name</p>
                  <p className="font-semibold text-white">BUI ANH CHIEN</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-300 text-sm mb-1">Account number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white bg-green-900 py-1 px-3 rounded">0982451906</p>
                    <div className="relative">
                      <button
                        onClick={handleCopyAccount}
                        className="bg-yellow-500 hover:bg-yellow-600 text-green-900 px-3 py-1 rounded-md flex items-center gap-1 transition-colors font-medium text-sm"
                      >
                        <Copy size={14} /> Copy
                      </button>
                      {showCopied && (
                        <div className="absolute top-full left-0 mt-1 text-green-900 text-sm bg-white px-2 py-1 rounded shadow">
                          Copied!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-300 text-sm mb-1">Bank name</p>
                  <p className="font-semibold text-white">MBBank</p>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="bg-white p-2 rounded-lg">
                  <img
                    src={qrCode}
                    alt="QR Code for payment"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment alert */}
          <div className="bg-yellow-500 bg-opacity-20 border-l-4 border-yellow-500 text-white rounded-md p-4 flex items-start gap-3">
            <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-300 mb-1">Payment Required</p>
              <p className="leading-snug">
                Please transfer{" "}
                <span className="text-yellow-300 font-bold text-lg">
                  {totalPrice.toLocaleString("vi-VN")} đ
                </span>{" "}
                and upload the payment confirmation image below to complete your booking.
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="bg-green-700 bg-opacity-50 p-4 rounded-md border border-green-600">
            <p className="text-sm text-yellow-200 italic">
              After transferring, please check your booking status in the "Account"
              tab until the owner confirms your booking.
            </p>
          </div>

          {/* Time countdown */}
          <div className="flex flex-col items-center justify-center bg-green-900 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <Clock size={18} />
              <p>Your booking will expire in:</p>
            </div>
            <h3 className={`text-3xl font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-yellow-300'}`}>
              {formatTime(timeLeft)}
            </h3>
          </div>

          {/* Image upload section */}
          <div className="mt-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Upload size={18} />
              Upload Required Documents
            </h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-yellow-300 mb-2">Payment Confirmation Image *</p>
                <label className={`border-2 ${paymentImage ? 'border-green-500' : 'border-yellow-500 border-dashed'} rounded-lg h-48 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors hover:bg-green-700`}>
                  {paymentImage ? (
                    <img src={paymentImage} alt="Payment confirmation" className="h-full object-contain" />
                  ) : (
                    <>
                      <Upload size={24} className="mb-2 text-yellow-300" />
                      <p className="text-sm">Click to upload payment image</p>
                      <p className="text-xs text-gray-300 mt-1">(Required)</p>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handlePaymentImageUpload} accept="image/*" />
                </label>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-gray-300 mb-2">Student/Discount Proof (Optional)</p>
                <label className={`border-2 ${discountImage ? 'border-green-500' : 'border-gray-400 border-dashed'} rounded-lg h-48 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors hover:bg-green-700`}>
                  {discountImage ? (
                    <img src={discountImage} alt="Discount proof" className="h-full object-contain" />
                  ) : (
                    <>
                      <Upload size={24} className="mb-2 text-gray-300" />
                      <p className="text-sm">Click to upload discount proof</p>
                      <p className="text-xs text-gray-400 mt-1">(Optional)</p>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleDiscountImageUpload} accept="image/*" />
                </label>
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <div className="mt-auto pt-6">
            <button
              onClick={handleConfirmOrder}
              className="bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-green-900 font-bold w-full py-4 rounded-md text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              CONFIRM BOOKING
              <span className="animate-pulse">→</span>
            </button>
          </div>
        </div>

        {/* Right column: Booking information */}
        <div className="w-80 hidden md:block">
          <div className="bg-green-900 rounded-lg shadow-lg overflow-hidden sticky top-20">
            <div className="bg-green-700 px-4 py-3 border-b border-green-600">
              <h2 className="font-bold flex items-center gap-2">
                Booking Summary
              </h2>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-green-400" />
                <div>
                  <p className="text-gray-300 text-xs">Customer Name</p>
                  <p className="font-medium">{userInfo.name || "Loading..."}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-400" />
                <div>
                  <p className="text-gray-300 text-xs">Phone Number</p>
                  <p className="font-medium">{userInfo.phone || "Loading..."}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Hash size={18} className="text-green-400" />
                <div>
                  <p className="text-gray-300 text-xs">Booking Code</p>
                  <p className="font-medium">#646</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-green-400" />
                <div>
                  <p className="text-gray-300 text-xs">Booking Details</p>
                  <p className="font-medium">{selectedDate}</p>
                  {/* Các slot chi tiết có thể được thêm vào sau */}
                </div>
              </div>
              
              <div className="h-px bg-green-700 my-2"></div>
              
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-yellow-400" />
                <div>
                  <p className="text-gray-300 text-xs">Total Amount</p>
                  <p className="font-bold text-yellow-300 text-lg">
                    {totalPrice.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400" />
                <div>
                  <p className="text-gray-300 text-xs">Payment Required</p>
                  <p className="font-bold text-yellow-300">
                    {totalPrice.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input file ẩn cho payment image */}
      <input
        type="file"
        accept="image/*"
        ref={paymentFileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            console.log("Payment image được chọn:", file.name);
            // Thực hiện upload file hoặc xử lý file theo yêu cầu của bạn
          }
        }}
      />

      {/* Input file ẩn cho discount/student proof */}
      <input
        type="file"
        accept="image/*"
        ref={discountFileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            console.log("Discount/Student proof image được chọn:", file.name);
            // Thực hiện upload file hoặc xử lý file theo yêu cầu của bạn
          }
        }}
      />
    </div>
  );
}
export default PaymentPage;

