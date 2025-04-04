import React, { useState, useEffect, useContext } from 'react';
import ModalConfirmation from '../components/ModalConfirmation';
import '../styles/UserProfile.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthContext } from '../contexts/AuthContext';
import { getBookingHistory } from '../apis/booking';
import { useNavigate } from 'react-router-dom';
import { cancelBooking } from '../apis/booking';
import EditableInfoCard from '../components/EditableInfoCard';
import { updateUserInfo, updateUserPassword, getDetailedBookingStats, fetchUserInfo } from '../apis/users';
import { getChartData } from '../apis/users'; // API call dùng axiosInstance, không lộ userId
import PopularTimeChart from '../components/PopularTimeChart';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);
  const [editMode, setEditMode] = useState("profile");
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("month"); // week, month, year
  const [detailedStats, setDetailedStats] = useState(null);

  const { user, setUser } = useContext(AuthContext);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  // Thêm state cho bộ lọc chart: all, completed, cancelled
  const [chartFilter, setChartFilter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCenter, setFilterCenter] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const centerName = localStorage.getItem("centerName") || "Tên Trung Tâm Mặc Định";
  const navigate = useNavigate();
  const slotGroupsFromLS = JSON.parse(localStorage.getItem("slotGroups") || "[]");
  const totalAmountLS = Number(localStorage.getItem("totalAmount")) || 0;
  const userPoints = user?.points || 0;
  const levels = ["Iron", "Đồng", "Bạc", "Vàng", "Bạch kim"];
  const pointsPerLevel = 1000;

  const currentLevelIndex = Math.min(Math.floor(userPoints / pointsPerLevel), levels.length - 1);
  const nextLevelIndex = currentLevelIndex < levels.length - 1 ? currentLevelIndex + 1 : null;
  const pointsInCurrentLevel = userPoints - currentLevelIndex * pointsPerLevel;
  const progressPercentage = (pointsInCurrentLevel / pointsPerLevel) * 100;
  const pointsToNextLevel = nextLevelIndex !== null ? pointsPerLevel - pointsInCurrentLevel : 0;
  const currentLevelName = levels[currentLevelIndex];
  const nextLevelName = nextLevelIndex !== null ? levels[nextLevelIndex] : "";

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      const data = await updateUserPassword({ oldPassword, newPassword });
      if (data.success) {
        alert("Đổi mật khẩu thành công!");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert("Đổi mật khẩu thất bại: " + data.message);
      }
    } catch (error) {
      alert("Lỗi khi đổi mật khẩu: " + error.message);
    }
  };

  const promptCancelBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  const handleModalAction = async (action) => {
    setShowCancelModal(false);
    if (action === "confirm" && selectedBookingId) {
      try {
        await cancelBooking();
        alert("Đã hủy pending booking thành công!");
        setBookingHistory((prevHistory) =>
          prevHistory.filter((booking) => booking.orderId !== selectedBookingId)
        );
        setFilteredHistory((prevFiltered) =>
          prevFiltered.filter((booking) => booking.orderId !== selectedBookingId && booking.orderId !== selectedBookingId)
        );
      } catch (error) {
        alert("Lỗi khi hủy đặt sân: " + error.message);
      }
    }
    const updatedUserData = await fetchUserInfo(); // API này trả về dữ liệu user cập nhật
    setUser(updatedUserData.user);
    setSelectedBookingId(null);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDetailedBookingStats(statsPeriod);
        console.log("Fetched detailed booking stats:", data); // Log dữ liệu trả về từ API
        if (data.success) {
          setDetailedStats(data.stats);
        } else {
          console.error("Error fetching booking stats:", data.message);
        }
      } catch (error) {
        console.error("Error fetching booking stats:", error);
      }
    };
    fetchStats();
  }, [statsPeriod]);
  // ...


  useEffect(() => {
    const fetchHistory = async () => {
      if (user && user._id) {
        try {
          const data = await getBookingHistory();
          console.log("Fetched booking history:", data);
          if (data.success) {
            setBookingHistory(data.bookingHistory);
            // Mặc định filteredHistory hiển thị toàn bộ dữ liệu
            setFilteredHistory(data.bookingHistory);
          } else {
            console.error("Error fetching booking history:", data);
          }
        } catch (error) {
          console.error("Error fetching booking history:", error?.response?.data || error);
        } finally {
          setIsLoading(false);
          setTimeout(() => setAnimateStats(true), 500);
        }
      }
    };
    fetchHistory();
  }, [user]);

  // Fetch chartData từ API
  useEffect(() => {
    const fetchChart = async () => {
      try {
        const data = await getChartData();
        if (data.success) {
          setChartData(data.chartData);
        } else {
          console.error("Error fetching chart data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChart();
  }, []);

  const handleUpdateField = async (field, newValue) => {
    try {
      const payload = { [field]: newValue };
      const data = await updateUserInfo(payload);
      if (data.success) {
        setUser((prevUser) => ({ ...prevUser, [field]: newValue }));
        alert("Cập nhật thông tin thành công!");
      } else {
        alert("Cập nhật thất bại: " + data.message);
      }
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  const upcomingBookings = bookingHistory.filter(booking => booking.status === "pending");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        setAnimateStats(true);
      }, 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    console.log("Chart data:", chartData);
  }, [chartData]);
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Hoàn thành';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return '';
    }
  };

  const calculateCenterPercentage = (centerName) => {
    if (!user || !user?.favouriteCenter || user?.favouriteCenter.length === 0) return 0;

    // Tính tổng số bookingCount của tất cả các trung tâm yêu thích
    const totalBookingCount = user?.favouriteCenter.reduce((total, center) => total + center.bookingCount, 0);

    const center = user?.favouriteCenter.find(center => center.centerName === centerName);

    // Nếu trung tâm không tồn tại hoặc tổng bookingCount bằng 0, trả về 0%
    if (!center || totalBookingCount === 0) {
      return 0;
    }


    // Tính phần trăm cho trung tâm
    return (center.bookingCount / totalBookingCount) * 100;
  };

  // Hàm filter lịch sử đặt sân
  const handleFilter = () => {
    const filtered = bookingHistory.filter(item => {
      // Lọc theo trạng thái
      const statusMatch = filterStatus === "all" || item.status === filterStatus;
      // Lọc theo cơ sở
      const centerMatch = filterCenter === "all" || item.center.toLowerCase().includes(filterCenter.toLowerCase());
      // Lọc theo tìm kiếm (trong orderId hoặc court_time)
      const searchMatch =
        filterSearch === "" ||
        (item.orderId && item.orderId.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (item.court_time && item.court_time.toLowerCase().includes(filterSearch.toLowerCase()));
      // Lọc theo khoảng thời gian (nếu chọn)
      const itemDate = new Date(item.date);
      let dateMatch = true;
      if (filterFrom) {
        dateMatch = dateMatch && (itemDate >= new Date(filterFrom));
      }
      if (filterTo) {
        dateMatch = dateMatch && (itemDate <= new Date(filterTo));
      }
      return statusMatch && centerMatch && searchMatch && dateMatch;
    });
    setFilteredHistory(filtered);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleCenterFilterChange = (e) => {
    setFilterCenter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setFilterSearch(e.target.value);
  };

  const handleFromDateChange = (e) => {
    setFilterFrom(e.target.value);
  };

  const handleToDateChange = (e) => {
    setFilterTo(e.target.value);
  };


  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <>
      < Header />
      <div className="profile-container">
        <div className="profile-header">
          <div className="header-content">
            <div className="avatar-container">
              <img
                src={user?.avatar_image_path || "https://via.placeholder.com/150"}
                alt="Avatar"
                className="user-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=Avatar";
                }}
              />
              <div className="level-badge">{user?.level}</div>
            </div>
            <div className="user-info">
              <h1>{user?.name}</h1>
              <div className="user-details">
                <div className="detail-item">
                  <i className="fas fa-phone"></i>
                  <span>{user?.phone_number}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-envelope"></i>
                  <span>{user?.email}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{user?.address}</span>
                </div>
              </div>
            </div>
            <div className="membership-info">
              <div className="points-container">
                <div className="points-circle">
                  <span className="points-value">{user?.points}</span>
                  <span className="points-label">điểm</span>
                </div>
              </div>
              <div className="member-since">
                <span>Thành viên từ</span>
                <strong>{new Date(user?.registration_date).toLocaleDateString('vi-VN')}</strong>
              </div>
            </div>
          </div>
        </div>



        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fas fa-user"></i>
            <span>Thông tin cá nhân</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <i className="fas fa-chart-pie"></i>
            <span>Thống kê</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-history"></i>
            <span>Lịch sử đặt sân</span>
          </button>
        </div>

        <div className="profile-content">
          {/* Thông tin cá nhân Tab */}
          {activeTab === 'info' && (
            <div className="tab-content info-content">
              <div className="section-title">
                <i className="fas fa-user-edit"></i>
                <h2>Thông tin cá nhân</h2>
              </div>

              <div className="info-container">
                <div className="info-sidebar">
                  <div className="profile-overview">
                    <div className="profile-image-container">
                      <img
                        src={user?.avatar_image_path || "https://via.placeholder.com/150"}
                        alt="Avatar"
                        className="profile-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150?text=Avatar";
                        }}
                      />
                      <button className="change-avatar-btn">
                        <i className="fas fa-camera"></i>
                      </button>
                    </div>
                    <h3 className="profile-name">{user?.name}</h3>
                    <p className="profile-email">{user?.email}</p>
                    <div className="membership-badge">
                      <i className="fas fa-gem"></i>
                      <span>Thành viên {currentLevelName}</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-info">
                        <span>Điểm thành viên ({currentLevelName})</span>
                        <span>{pointsInCurrentLevel}/{pointsPerLevel}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="progress-note">
                        {nextLevelIndex !== null
                          ? `Còn ${pointsToNextLevel} điểm để lên ${nextLevelName}`
                          : "Bạn đã đạt cấp cao nhất!"}
                      </p>
                    </div>
                  </div>

                  <div className="info-actions">
                    <button
                      className={`action-btn ${editMode === 'profile' ? 'primary' : 'secondary'}`}
                      onClick={() => setEditMode('profile')}
                    >
                      <i className="fas fa-edit"></i>
                      <span>Chỉnh sửa hồ sơ</span>
                    </button>
                    <button
                      className={`action-btn ${editMode === 'password' ? 'primary' : 'secondary'}`}
                      onClick={() => setEditMode('password')}
                    >
                      <i className="fas fa-key"></i>
                      <span>Đổi mật khẩu</span>
                    </button>
                  </div>
                </div>

                <div className="info-details-container">
                  {editMode === 'password' ? (
                    // Form đổi mật khẩu
                    <div className="space-y-4 fade-in">
                      {/* Mật khẩu cũ */}
                      <div className="info-card">
                        <label className="block text-sm font-medium text-gray-700">
                          Mật khẩu cũ
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="mt-1 block w-full border border-black rounded-md py-2 pr-12 pl-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              overflowX: "auto",
                              whiteSpace: "nowrap"
                            }}
                          />

                          {/* Icon mắt bên phải */}
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            style={{ zIndex: 10 }}
                          >
                            {showOldPassword ? (
                              <i className="fas fa-eye-slash"></i>
                            ) : (
                              <i className="fas fa-eye"></i>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Mật khẩu mới */}
                      <div className="info-card">
                        <label className="block text-sm font-medium text-gray-700">
                          Mật khẩu mới
                        </label>
                        <div className="relative">

                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full border border-black rounded-md py-2 pr-12 pl-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              overflowX: "auto",
                              whiteSpace: "nowrap"
                            }}
                          />

                          {/* Icon mắt bên phải */}
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            style={{ zIndex: 10 }}
                          >
                            {showNewPassword ? (
                              <i className="fas fa-eye-slash"></i>
                            ) : (
                              <i className="fas fa-eye"></i>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Xác nhận mật khẩu mới */}
                      <div className="info-card">
                        <label className="block text-sm font-medium text-gray-700">
                          Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">

                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full border border-black rounded-md py-2 pr-12 pl-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              overflowX: "auto",
                              whiteSpace: "nowrap"
                            }}
                          />

                          {/* Icon mắt bên phải */}
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            style={{ zIndex: 10 }}
                          >
                            {showConfirmPassword ? (
                              <i className="fas fa-eye-slash"></i>
                            ) : (
                              <i className="fas fa-eye"></i>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Nút xác nhận thay đổi */}
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
                        onClick={handleChangePassword}
                      >
                        Xác nhận thay đổi
                      </button>
                    </div>

                  ) : (
                    // Hiển thị thông tin cơ bản và lịch đặt sắp tới
                    <>
                      <div className="info-section">
                        <h3 className="info-section-title">
                          <i className="fas fa-user"></i>
                          <span>Thông tin cơ bản</span>
                        </h3>
                        <div className="info-grid">
                          <EditableInfoCard
                            label="Họ và tên"
                            value={user?.name}
                            onConfirm={(newValue) => handleUpdateField("name", newValue)}
                          />
                          <EditableInfoCard
                            label="Số điện thoại"
                            value={user?.phone_number}
                            onConfirm={(newValue) => handleUpdateField("phone_number", newValue)}
                          />
                          <EditableInfoCard
                            label="Email"
                            value={user?.email}
                            onConfirm={(newValue) => handleUpdateField("email", newValue)}
                          />
                          <EditableInfoCard
                            label="Địa chỉ"
                            value={user?.address}
                            onConfirm={(newValue) => handleUpdateField("address", newValue)}
                          />
                        </div>
                      </div>
                      <div className="upcoming-bookings">
                        <div className="section-title">
                          <i className="fas fa-calendar-alt"></i>
                          <h2>Lịch đặt sắp tới</h2>
                        </div>
                        {upcomingBookings.length > 0 ? (
                          <div className="upcoming-grid">
                            {upcomingBookings.map((booking) => (
                              <div key={booking._id} className="upcoming-card">
                                <div className="upcoming-header">
                                  <span className="upcoming-id">#{booking.orderId}</span>
                                  <span className={`upcoming-status ${getStatusClass(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </span>
                                </div>
                                <div className="upcoming-details">
                                  <div className="upcoming-detail">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{centerName}</span>
                                  </div>
                                  <div className="upcoming-detail">
                                    <i className="fas fa-table-tennis"></i>
                                    <span>
                                      {slotGroupsFromLS.length > 0 ? (
                                        slotGroupsFromLS.map((group, idx) => (
                                          <React.Fragment key={idx}>
                                            <span>
                                              {group.courtName}: {group.timeStr}
                                            </span>
                                            {idx < slotGroupsFromLS.length - 1 && <br />}
                                          </React.Fragment>
                                        ))
                                      ) : (
                                        booking.court
                                      )}
                                    </span>
                                  </div>
                                  <div className="upcoming-detail">
                                    <i className="fas fa-calendar-day"></i>
                                    <span>{booking.date}</span>
                                  </div>
                                </div>
                                <div className="upcoming-price">
                                  <span>{totalAmountLS.toLocaleString("vi-VN")} đ</span>
                                </div>
                                <div className="upcoming-actions">
                                  <button className="pay-now-btn" onClick={() => navigate("/payment")}>
                                    Thanh Toán Ngay
                                  </button>
                                  <button
                                    className="cancel-btn"
                                    onClick={() => promptCancelBooking(booking.orderId)}
                                  >
                                    Hủy Đặt Sân
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>Không có lịch đặt sắp tới.</p>
                        )}
                      </div>

                    </>
                  )}
                </div>

              </div>
            </div>
          )}


          {/* Thống kê Tab */}
          {activeTab === 'stats' && (
            <div className="tab-content stats-content">
              <div className="section-title">
                <i className="fas fa-chart-line"></i>
                <h2>Thống kê hoạt động</h2>
              </div>

              <div className="stats-dashboard-enhanced">
                <div className="stats-dashboard-enhanced">
                  <div className="stats-overview">
                    <div className="stats-header">
                      <h3>Tổng quan hoạt động</h3>
                      <div className="stats-period-selector">
                        <button
                          className={`period-btn ${statsPeriod === "week" ? "active" : ""}`}
                          onClick={() => setStatsPeriod("week")}
                        >
                          Tuần
                        </button>
                        <button
                          className={`period-btn ${statsPeriod === "month" ? "active" : ""}`}
                          onClick={() => setStatsPeriod("month")}
                        >
                          Tháng
                        </button>
                        <button
                          className={`period-btn ${statsPeriod === "year" ? "active" : ""}`}
                          onClick={() => setStatsPeriod("year")}
                        >
                          Năm
                        </button>
                      </div>
                    </div>

                    <div className="stats-cards-container">
                      {/* Card Tổng số đặt sân */}
                      <div className={`stats-card-enhanced ${animateStats ? "animate" : ""}`}>
                        <div className="stats-card-header">
                          <div className="stats-icon-enhanced booking">
                            <i className="fas fa-calendar-check"></i>
                          </div>
                          <div
                            className={`stats-trend ${detailedStats && detailedStats.comparison.totalChange < 0 ? "negative" : "positive"
                              }`}
                          >
                            {detailedStats && detailedStats.comparison.totalChange < 0 ? (
                              <i className="fas fa-arrow-down"></i>
                            ) : (
                              <i className="fas fa-arrow-up"></i>
                            )}
                            <span>
                              {detailedStats ? Math.round(Math.abs(detailedStats.comparison.totalChange)) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="stats-card-body">
                          <h4>Tổng số lần đặt sân</h4>
                          <div className="stats-value">
                            {detailedStats ? detailedStats.current.total : 0}
                          </div>
                        </div>
                        <div className="stats-card-footer">
                          <span>
                            {detailedStats &&
                              detailedStats.comparison.totalChange >= 0
                              ? "Tăng"
                              : "Giảm"}{" "}
                            {detailedStats ? Math.abs(Math.round(detailedStats.comparison.totalChange)) : 0} so với{" "}
                            {statsPeriod === "week"
                              ? "tuần"
                              : statsPeriod === "month"
                                ? "tháng"
                                : "năm"}{" "}
                            trước
                          </span>
                        </div>
                      </div>

                      {/* Card Hoàn thành */}
                      <div className={`stats-card-enhanced ${animateStats ? "animate" : ""}`} style={{ animationDelay: "0.1s" }}>
                        <div className="stats-card-header">
                          <div className="stats-icon-enhanced completed">
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <div
                            className={`stats-trend ${detailedStats && detailedStats.comparison.completedChange < 0 ? "negative" : "positive"
                              }`}
                          >
                            {detailedStats && detailedStats.comparison.completedChange < 0 ? (
                              <i className="fas fa-arrow-down"></i>
                            ) : (
                              <i className="fas fa-arrow-up"></i>
                            )}
                            <span>
                              {detailedStats ? Math.round(Math.abs(detailedStats.comparison.completedChange)) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="stats-card-body">
                          <h4>Hoàn thành</h4>
                          <div className="stats-value">
                            {detailedStats ? detailedStats.current.completed : 0}
                          </div>
                        </div>
                        <div className="stats-card-footer">
                          <div className="completion-rate">
                            <span>Tỷ lệ hoàn thành:</span>
                            <div className="rate-bar-container">
                              <div
                                className="rate-bar"
                                style={{
                                  width:
                                    detailedStats && detailedStats.current.total > 0
                                      ? `${(detailedStats.current.completed / detailedStats.current.total) * 100}%`
                                      : "0%"
                                }}
                              ></div>
                            </div>
                            <span>
                              {detailedStats && detailedStats.current.total > 0
                                ? Math.round((detailedStats.current.completed / detailedStats.current.total) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Đã hủy */}
                      <div className={`stats-card-enhanced ${animateStats ? "animate" : ""}`} style={{ animationDelay: "0.2s" }}>
                        <div className="stats-card-header">
                          <div className="stats-icon-enhanced cancelled">
                            <i className="fas fa-times-circle"></i>
                          </div>
                          <div
                            className={`stats-trend ${detailedStats && detailedStats.comparison.cancelledChange < 0 ? "negative" : "positive"
                              }`}
                          >
                            {detailedStats && detailedStats.comparison.cancelledChange < 0 ? (
                              <i className="fas fa-arrow-down"></i>
                            ) : (
                              <i className="fas fa-arrow-up"></i>
                            )}
                            <span>
                              {detailedStats ? Math.round(Math.abs(detailedStats.comparison.cancelledChange)) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="stats-card-body">
                          <h4>Đã hủy</h4>
                          <div className="stats-value">
                            {detailedStats ? detailedStats.current.cancelled : 0}
                          </div>
                        </div>
                        <div className="stats-card-footer">
                          <span>
                            {detailedStats &&
                              detailedStats.comparison.cancelledChange >= 0
                              ? "Tăng"
                              : "Giảm"}{" "}
                            {detailedStats ? Math.abs(Math.round(detailedStats.comparison.cancelledChange)) : 0} so với{" "}
                            {statsPeriod === "week"
                              ? "tuần"
                              : statsPeriod === "month"
                                ? "tháng"
                                : "năm"}{" "}
                            trước
                          </span>
                        </div>
                      </div>

                      {/* Card Điểm thành viên */}
                      <div className={`stats-card-enhanced ${animateStats ? "animate" : ""}`} style={{ animationDelay: "0.3s" }}>
                        <div className="stats-card-header">
                          <div className="stats-icon-enhanced points">
                            <i className="fas fa-medal"></i>
                          </div>
                          <div
                            className={`stats-trend ${detailedStats && detailedStats.comparison.pointsChange < 0 ? "negative" : "positive"
                              }`}
                          >
                            {detailedStats && detailedStats.comparison.pointsChange < 0 ? (
                              <i className="fas fa-arrow-down"></i>
                            ) : (
                              <i className="fas fa-arrow-up"></i>
                            )}
                            <span>
                              {detailedStats ? Math.round(Math.abs(detailedStats.comparison.pointsChange)) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="stats-card-body">
                          <h4>Điểm thành viên</h4>
                          <div className="stats-value">
                            {detailedStats ? detailedStats.current.points : (user?.points || 0)}
                          </div>
                        </div>
                        <div className="stats-card-footer">
                          <span>
                            {detailedStats && detailedStats.comparison.pointsChange >= 0 ? "Tăng" : "Giảm"}{" "}
                            {detailedStats ? Math.abs(Math.round(detailedStats.comparison.pointsChange)) : 0} so với{" "}
                            {statsPeriod === "week"
                              ? "tuần"
                              : statsPeriod === "month"
                                ? "tháng"
                                : "năm"}{" "}
                            trước
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phần biểu đồ */}
                <div className="stats-charts-enhanced">
                  <div className="chart-container-enhanced">
                    <div className="chart-header">
                      <h3>Thống kê đặt sân theo tháng</h3>
                      <div className="chart-actions">
                        <button
                          className={`chart-action-btn ${chartFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setChartFilter("all")}
                        >
                          Tất cả
                        </button>
                        <button
                          className={`chart-action-btn ${chartFilter === 'completed' ? 'active' : ''}`}
                          onClick={() => setChartFilter("completed")}
                        >
                          Hoàn thành
                        </button>
                        <button
                          className={`chart-action-btn ${chartFilter === 'cancelled' ? 'active' : ''}`}
                          onClick={() => setChartFilter("cancelled")}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>

                    {loadingChart ? (
                      <div>Loading chart...</div>
                    ) : (
                      <div className="advanced-chart">
                        {/* Trục Y */}
                        <div className="chart-labels">
                          <div className="chart-y-axis">
                            <span>100%</span>
                            <span>80%</span>
                            <span>60%</span>
                            <span>40%</span>
                            <span>20%</span>
                            <span>0%</span>
                          </div>
                        </div>

                        {/* Nội dung biểu đồ */}
                        <div className="chart-content">
                          <div className="chart-grid">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="grid-line"></div>
                            ))}
                          </div>
                          <div className="chart-bars">
                            {chartData.map((data, index) => {
                              const total = data.completed + data.cancelled;
                              const completedPercent = total > 0 ? (data.completed / total) * 100 : 0;
                              const cancelledPercent = total > 0 ? (data.cancelled / total) * 100 : 0;
                              console.log(
                                `Tháng ${data.month}: completed=${data.completed} (${completedPercent.toFixed(
                                  2
                                )}%), cancelled=${data.cancelled} (${cancelledPercent.toFixed(2)}%)`
                              );
                              return (
                                <div key={index} className="chart-bar-group">
                                  <div className="stacked-bar">
                                    {chartFilter === "all" && (
                                      <>
                                        <div
                                          className="bar-segment completed"
                                          style={{
                                            height: `${completedPercent}%`,

                                          }}
                                          data-value={data.completed}
                                        ></div>
                                        <div
                                          className="bar-segment cancelled"
                                          style={{ height: `${cancelledPercent}%` }}
                                          data-value={data.cancelled}
                                        ></div>
                                      </>
                                    )}
                                    {chartFilter === "completed" && (
                                      <div
                                        className="bar-segment completed"
                                        style={{ height: `${completedPercent}%` }}
                                        data-value={data.completed}
                                      ></div>
                                    )}
                                    {chartFilter === "cancelled" && (
                                      <div
                                        className="bar-segment cancelled"
                                        style={{ height: `${cancelledPercent}%` }}
                                        data-value={data.cancelled}
                                      ></div>
                                    )}
                                  </div>
                                  <span className="bar-label">{data.month}</span>
                                </div>
                              );
                            })}

                          </div>
                        </div>


                      </div>
                    )}

                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color completed"></div>
                        <span>Hoàn thành</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color cancelled"></div>
                        <span>Đã hủy</span>
                      </div>
                    </div>
                  </div>

                  <div className="stats-details-grid">
                    <PopularTimeChart />


                    <div className="stats-detail-card">
                      <div className="detail-card-header">
                        <h4>
                          <i className="fas fa-map-marker-alt"></i>
                          Cơ sở đặt sân thường xuyên
                        </h4>
                      </div>
                      <div className="detail-card-body">
                        <div className="location-distribution">
                          {/* Iterate over favourite centers and show the percentage */}
                          {user && user?.favouriteCenter && user?.favouriteCenter.map((center) => (
                            <div className="location-item" >
                              <div className="location-name">{center.centerName}</div>
                              <div className="location-bar-container ">
                                <div className="location-bar-wrapper">
                                  <div
                                    className="location-bar"
                                    style={{ width: `${calculateCenterPercentage(center.centerName)}%` }}
                                  ></div>
                                </div>
                                <span className="location-percentage">
                                  {calculateCenterPercentage(center.centerName).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lịch sử đặt sân Tab */}
          {activeTab === 'history' && (
            <div className="tab-content">
              <div className="section-title">
                <i className="fas fa-history"></i>
                <h2>Lịch sử đặt sân</h2>
              </div>

              <div className="history-container">
                <div className="history-filters-enhanced">
                  <div className="filters-header-enhanced">
                    <div className="header-title">
                      <i className="fas fa-filter"></i>
                      <h3>Bộ lọc tìm kiếm</h3>
                    </div>
                    <button
                      className="reset-filters-btn-enhanced"
                      onClick={() => {
                        setFilterStatus("all");
                        setFilterCenter("all");
                        setFilterSearch("");
                        setFilterFrom("");
                        setFilterTo("");
                        setFilteredHistory(bookingHistory);
                      }}
                    >
                      <i className="fas fa-redo-alt"></i>
                      <span>Đặt lại</span>
                    </button>
                  </div>

                  <div className="divider"></div>

                  <div className="filters-body-enhanced">
                    <div className="filter-section">
                      <h4 className="filter-section-title">Tình trạng đặt sân</h4>
                      <div className="status-filter-options">
                        <label className="filter-chip">
                          <input type="radio" name="status" value="all" checked={filterStatus === "all"} onChange={handleStatusFilterChange} />
                          <span>Tất cả</span>
                        </label>
                        <label className="filter-chip success">
                          <input type="radio" name="status" value="paid" checked={filterStatus === "paid"} onChange={handleStatusFilterChange} />
                          <span><i className="fas fa-check-circle"></i> Hoàn thành</span>
                        </label>
                        <label className="filter-chip warning">
                          <input type="radio" name="status" value="pending" checked={filterStatus === "pending"} onChange={handleStatusFilterChange} />
                          <span><i className="fas fa-clock"></i> Chờ thanh toán</span>
                        </label>
                        <label className="filter-chip danger">
                          <input type="radio" name="status" value="cancelled" checked={filterStatus === "cancelled"} onChange={handleStatusFilterChange} />
                          <span><i className="fas fa-times-circle"></i> Đã hủy</span>
                        </label>
                      </div>
                    </div>

                    <div className="filter-section">
                      <h4 className="filter-section-title">Cơ sở</h4>
                      <div className="select-wrapper">
                        <select className="filter-select-enhanced" value={filterCenter} onChange={handleCenterFilterChange}>
                          <option value="all">Tất cả cơ sở</option>
                          <option value="Nhà thi đấu quận Thanh Xuân">Nhà thi đấu quận Thanh Xuân</option>
                          <option value="Nhà thi đấu quận Cầu Giấy">Nhà thi đấu quận Cầu Giấy</option>
                          <option value="Nhà thi đấu quận Tây Hồ">Nhà thi đấu quận Tây Hồ</option>
                          <option value="Nhà thi đấu quận Bắc Từ Liêm">Nhà thi đấu quận Bắc Từ Liêm</option>
                        </select>
                        <i className="fas fa-chevron-down select-arrow"></i>
                      </div>
                    </div>

                    <div className="filter-section">
                      <h4 className="filter-section-title">Khoảng thời gian</h4>
                      <div className="date-range-picker">
                        <div className="date-input-group">
                          <label>Từ:</label>
                          <div className="date-input-wrapper">
                            
                            <i className="fas fa-calendar-alt"></i>
                            <input
                              type="date"
                              className="date-input"
                              placeholder="Từ ngày"
                              value={filterFrom}
                              onChange={handleFromDateChange}
                              max={filterTo || undefined} // Nếu đã chọn ngày kết thúc thì khóa các ngày sau
                            />
                          </div>
                          <label>Đến:</label>
                          <div className="date-input-wrapper">
                            <i className="fas fa-calendar-alt"></i>
                            <input
                              type="date"
                              className="date-input"
                              placeholder="Đến ngày"
                              value={filterTo}
                              onChange={handleToDateChange}
                              min={filterFrom || undefined} // Nếu đã chọn ngày bắt đầu thì khóa các ngày trước
                            />
                          </div>
                        </div>
                        <div className="quick-date-options">
                          <button
                            className="quick-date-btn"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setFilterFrom(today);
                              setFilterTo(today);
                            }}
                          >
                            Hôm nay
                          </button>
                          <button
                            className="quick-date-btn"
                            onClick={() => {
                              const now = new Date();
                              const day = now.getDay() === 0 ? 7 : now.getDay(); // Nếu là Chủ Nhật, đặt là 7
                              const diffToMonday = day - 1; // số ngày lùi về thứ Hai
                              const monday = new Date(now);
                              monday.setDate(now.getDate() - diffToMonday);
                              const sunday = new Date(monday);
                              sunday.setDate(monday.getDate() + 6);
                              setFilterFrom(monday.toISOString().split('T')[0]);
                              setFilterTo(sunday.toISOString().split('T')[0]);
                            }}
                          >
                            Tuần này
                          </button>
                          <button
                            className="quick-date-btn"
                            onClick={() => {
                              const now = new Date();
                              const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                              const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Ngày cuối tháng
                              setFilterFrom(startMonth.toISOString().split('T')[0]);
                              setFilterTo(endMonth.toISOString().split('T')[0]);
                            }}
                          >
                            Tháng này
                          </button>
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="divider"></div>

                  <div className="filters-footer">
                    <button className="apply-filter-btn-enhanced" onClick={handleFilter}>
                      <i className="fas fa-search"></i>
                      <span>Tìm kiếm</span>
                    </button>
                  </div>
                </div>

                <div className="history-results">
                  <div className="results-header">
                    <div className="results-summary">
                      <h3>Kết quả</h3>
                      <span className="results-count">{filteredHistory.length} lịch sử đặt sân</span>
                    </div>
                  </div>

                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Mã đặt sân</th>
                          <th>Trạng thái</th>
                          <th>Cơ sở</th>
                          <th>Sân-Giờ</th>
                          <th>Ngày</th>
                          <th>Giá tiền</th>
                          <th>Phương thức</th>
                          <th>Loại</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((booking, index) => (
                          <tr key={index} className={booking.status === 'cancelled' ? 'cancelled-row' : ''}>
                            <td className="booking-id">{booking.orderId}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                            </td>
                            <td>{booking.center}</td>
                            <td>
                              {booking.court_time.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))}
                            </td>
                            <td>{new Date(booking.date).toLocaleDateString()}</td>
                            <td className="booking-price">{booking.price}</td>
                            <td>{booking.paymentMethod}</td>
                            <td>{booking.orderType}</td>
                            <td>
                              <div className="action-buttons">
                                {booking.status === 'pending' && (
                                  <>
                                    <button className="pay-btn"
                                      title="Thanh toán"
                                      onClick={() => navigate("/payment")}>
                                      <i className="fas fa-credit-card"></i>
                                    </button>
                                    <button
                                      className="cancel-btn"
                                      title="Hủy đặt sân"
                                      onClick={() => promptCancelBooking(booking.orderId)}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </>
                                )}
                                {booking.status === 'paid' && (
                                  <button
                                    className="review-btn"
                                    title="Đánh giá"
                                  >
                                    <i className="fas fa-star"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="history-pagination">
                    <div className="pagination-info">
                      <span>Hiển thị 1-4 của {filteredHistory.length} kết quả</span>
                    </div>
                    <div className="pagination-controls">
                      <button className="page-btn disabled">
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button className="page-btn active">1</button>
                      <button className="page-btn disabled">
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="pagination-options">
                      <select className="per-page-select">
                        <option value="10">10 / trang</option>
                        <option value="20">20 / trang</option>
                        <option value="50">50 / trang</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      < Footer />
      {showCancelModal && (
        <ModalConfirmation
          title="Xác nhận hủy đặt sân"
          message="Bạn có chắc chắn muốn hủy đặt sân này không?"
          onAction={(action) => handleModalAction(action)}
        />
      )}
    </>
  );
};

export default UserProfile;