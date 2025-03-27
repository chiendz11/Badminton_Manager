import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/UserProfile.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);

  const userData = {
    name: "Trần Anh Tuấn",
    avatar: "/images/avatar.jpg",
    phone: "0972628815",
    email: "23021710@vnu.edu.vn",
    address: "Số 123, Đường ABC, Quận XYZ, Hà Nội",
    joinDate: "21/06/2023",
    level: "Thành viên Vàng",
    points: 650,
    favoriteCenter: "Cơ sở Mỹ Đình",
    stats: {
      totalBookings: 28,
      completedBookings: 25,
      cancelledBookings: 3,
      favoriteTime: "19:00 - 20:30",
      averagePlayTime: "90 phút"
    }
  };

  const bookingHistory = [
    {
      id: "B001",
      status: "completed",
      center: "Cơ sở Mỹ Đình",
      court: "Sân số 3",
      date: "20/03/2025",
      time: "18:00 - 19:30",
      price: "150.000 VNĐ",
      paymentMethod: "Thẻ tín dụng",
      paymentStatus: "Đã thanh toán"
    },
    {
      id: "B002",
      status: "completed",
      center: "Cơ sở Cầu Giấy",
      court: "Sân số 2",
      date: "15/03/2025",
      time: "20:00 - 21:30",
      price: "180.000 VNĐ",
      paymentMethod: "Ví điện tử",
      paymentStatus: "Đã thanh toán"
    },
    {
      id: "B003",
      status: "pending",
      center: "Cơ sở Thanh Xuân",
      court: "Sân số 5",
      date: "27/03/2025",
      time: "19:00 - 20:30",
      price: "165.000 VNĐ",
      paymentMethod: "Chưa chọn",
      paymentStatus: "Chờ thanh toán"
    },
    {
      id: "B004",
      status: "cancelled",
      center: "Cơ sở Hà Đông",
      court: "Sân số 1",
      date: "10/03/2025",
      time: "17:00 - 18:30",
      price: "150.000 VNĐ",
      paymentMethod: "-",
      paymentStatus: "Đã hủy"
    }
  ];

  const upcomingBookings = bookingHistory.filter(booking => booking.status === "pending");
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Animate stats after loading
      setTimeout(() => {
        setAnimateStats(true);
      }, 500);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return '';
    }
  };

  // Array of months for the chart
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

  // Random data for the chart
  const generateRandomData = () => {
    return months.map(month => ({
      month,
      completed: Math.floor(Math.random() * 10) + 1,
      cancelled: Math.floor(Math.random() * 3)
    }));
  };

  const chartData = generateRandomData();

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
    < Header/>
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <div className="avatar-container">
            <img 
              src={userData.avatar || "https://via.placeholder.com/150"} 
              alt="Avatar" 
              className="user-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=Avatar";
              }}
            />
            <div className="level-badge">{userData.level}</div>
          </div>
          <div className="user-info">
            <h1>{userData.name}</h1>
            <div className="user-details">
              <div className="detail-item">
                <i className="fas fa-phone"></i>
                <span>{userData.phone}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-envelope"></i>
                <span>{userData.email}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>{userData.address}</span>
              </div>
            </div>
          </div>
          <div className="membership-info">
            <div className="points-container">
              <div className="points-circle">
                <span className="points-value">{userData.points}</span>
                <span className="points-label">điểm</span>
              </div>
            </div>
            <div className="member-since">
              <span>Thành viên từ</span>
              <strong>{userData.joinDate}</strong>
            </div>
          </div>
        </div>
      </div>

      {upcomingBookings.length > 0 && (
        <div className="upcoming-bookings">
          <div className="section-title">
            <i className="fas fa-calendar-alt"></i>
            <h2>Lịch đặt sắp tới</h2>
          </div>
          <div className="upcoming-grid">
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="upcoming-card">
                <div className="upcoming-header">
                  <span className="upcoming-id">#{booking.id}</span>
                  <span className={`upcoming-status ${getStatusClass(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
                <div className="upcoming-details">
                  <div className="upcoming-detail">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{booking.center}</span>
                  </div>
                  <div className="upcoming-detail">
                    <i className="fas fa-table-tennis"></i>
                    <span>{booking.court}</span>
                  </div>
                  <div className="upcoming-detail">
                    <i className="fas fa-calendar-day"></i>
                    <span>{booking.date}</span>
                  </div>
                  <div className="upcoming-detail">
                    <i className="fas fa-clock"></i>
                    <span>{booking.time}</span>
                  </div>
                </div>
                <div className="upcoming-price">
                  <span>{booking.price}</span>
                </div>
                <div className="upcoming-actions">
                  <button className="pay-now-btn">Thanh Toán Ngay</button>
                  <button className="cancel-btn">Hủy Đặt Sân</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                      src={userData.avatar || "https://via.placeholder.com/150"} 
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
                  <h3 className="profile-name">{userData.name}</h3>
                  <p className="profile-email">{userData.email}</p>
                  <div className="membership-badge">
                    <i className="fas fa-gem"></i>
                    <span>{userData.level}</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-info">
                      <span>Điểm thành viên</span>
                      <span>{userData.points}/1000</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress" style={{width: `${(userData.points/1000)*100}%`}}></div>
                    </div>
                    <p className="progress-note">Còn 350 điểm để lên <strong>Platinum</strong></p>
                  </div>
                </div>
                
                <div className="info-actions">
                  <button className="action-btn primary">
                    <i className="fas fa-edit"></i>
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>
                  <button className="action-btn secondary">
                    <i className="fas fa-key"></i>
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>
              </div>
              
              <div className="info-details-container">
                <div className="info-section">
                  <h3 className="info-section-title">
                    <i className="fas fa-user"></i>
                    <span>Thông tin cơ bản</span>
                  </h3>
                  <div className="info-grid">
                    <div className="info-card enhanced">
                      <div className="info-label">Họ và tên</div>
                      <div className="info-value">{userData.name}</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Số điện thoại</div>
                      <div className="info-value">{userData.phone}</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Email</div>
                      <div className="info-value">{userData.email}</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Ngày sinh</div>
                      <div className="info-value">01/01/1990</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h3 className="info-section-title">
                    <i className="fas fa-map-marked-alt"></i>
                    <span>Thông tin liên hệ</span>
                  </h3>
                  <div className="info-grid">
                    <div className="info-card enhanced full-width">
                      <div className="info-label">Địa chỉ</div>
                      <div className="info-value">{userData.address}</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Tỉnh/Thành phố</div>
                      <div className="info-value">Hà Nội</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Quận/Huyện</div>
                      <div className="info-value">Nam Từ Liêm</div>
                      <button className="edit-info-btn" title="Chỉnh sửa">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h3 className="info-section-title">
                    <i className="fas fa-table-tennis"></i>
                    <span>Thông tin đặt sân</span>
                  </h3>
                  <div className="info-grid">
                    <div className="info-card enhanced">
                      <div className="info-label">Sân yêu thích</div>
                      <div className="info-value">{userData.favoriteCenter}</div>
                      <div className="info-badge">Phổ biến</div>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Thời gian chơi thường xuyên</div>
                      <div className="info-value">19:00 - 20:30</div>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Đối thủ thường gặp</div>
                      <div className="info-value">
                        <div className="partner-avatars">
                          <div className="partner-avatar" title="Nguyễn Văn B">NVB</div>
                          <div className="partner-avatar" title="Trần Văn C">TVC</div>
                          <div className="partner-avatar" title="Xem thêm">+3</div>
                        </div>
                      </div>
                    </div>
                    <div className="info-card enhanced">
                      <div className="info-label">Trình độ</div>
                      <div className="info-value">
                        <div className="skill-level">
                          <div className="skill-bar" style={{width: '70%'}}></div>
                          <span>Trung cấp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              <div className="stats-overview">
                <div className="stats-header">
                  <h3>Tổng quan hoạt động</h3>
                  <div className="stats-period-selector">
                    <button className="period-btn active">Tuần</button>
                    <button className="period-btn">Tháng</button>
                    <button className="period-btn">Năm</button>
                  </div>
                </div>
                
                <div className="stats-cards-container">
                  <div className={`stats-card-enhanced ${animateStats ? 'animate' : ''}`}>
                    <div className="stats-card-header">
                      <div className="stats-icon-enhanced booking">
                        <i className="fas fa-calendar-check"></i>
                      </div>
                      <div className="stats-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>12%</span>
                      </div>
                    </div>
                    <div className="stats-card-body">
                      <h4>Tổng số lần đặt sân</h4>
                      <div className="stats-value">{userData.stats.totalBookings}</div>
                    </div>
                    <div className="stats-card-footer">
                      <span>Tăng 3 lần so với tháng trước</span>
                    </div>
                  </div>
                  
                  <div className={`stats-card-enhanced ${animateStats ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
                    <div className="stats-card-header">
                      <div className="stats-icon-enhanced completed">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div className="stats-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>8%</span>
                      </div>
                    </div>
                    <div className="stats-card-body">
                      <h4>Hoàn thành</h4>
                      <div className="stats-value">{userData.stats.completedBookings}</div>
                    </div>
                    <div className="stats-card-footer">
                      <div className="completion-rate">
                        <span>Tỷ lệ hoàn thành:</span>
                        <div className="rate-bar-container">
                          <div className="rate-bar" style={{width: `${(userData.stats.completedBookings/userData.stats.totalBookings)*100}%`}}></div>
                        </div>
                        <span>{Math.round((userData.stats.completedBookings/userData.stats.totalBookings)*100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`stats-card-enhanced ${animateStats ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
                    <div className="stats-card-header">
                      <div className="stats-icon-enhanced cancelled">
                        <i className="fas fa-times-circle"></i>
                      </div>
                      <div className="stats-trend negative">
                        <i className="fas fa-arrow-down"></i>
                        <span>5%</span>
                      </div>
                    </div>
                    <div className="stats-card-body">
                      <h4>Đã hủy</h4>
                      <div className="stats-value">{userData.stats.cancelledBookings}</div>
                    </div>
                    <div className="stats-card-footer">
                      <span>Giảm 1 lần so với tháng trước</span>
                    </div>
                  </div>
                  
                  <div className={`stats-card-enhanced ${animateStats ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
                    <div className="stats-card-header">
                      <div className="stats-icon-enhanced points">
                        <i className="fas fa-medal"></i>
                      </div>
                      <div className="stats-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>15%</span>
                      </div>
                    </div>
                    <div className="stats-card-body">
                      <h4>Điểm thành viên</h4>
                      <div className="stats-value">{userData.points}</div>
                    </div>
                    <div className="stats-card-footer">
                      <span>Tăng 85 điểm trong tháng này</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stats-charts-enhanced">
                <div className="chart-container-enhanced">
                  <div className="chart-header">
                    <h3>Thống kê đặt sân theo tháng</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn active">Tất cả</button>
                      <button className="chart-action-btn">Hoàn thành</button>
                      <button className="chart-action-btn">Hủy</button>
                    </div>
                  </div>
                  
                  <div className="advanced-chart">
                    <div className="chart-labels">
                      <div className="chart-y-axis">
                        <span>10</span>
                        <span>8</span>
                        <span>6</span>
                        <span>4</span>
                        <span>2</span>
                        <span>0</span>
                      </div>
                    </div>
                    
                    <div className="chart-content">
                      <div className="chart-grid">
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                      </div>
                      
                      <div className="chart-bars">
                        {chartData.map((data, index) => (
                          <div key={index} className="chart-bar-group">
                            <div className="stacked-bar">
                              <div 
                                className="bar-segment completed" 
                                style={{height: `${data.completed * 10}%`}}
                                data-value={data.completed}
                              ></div>
                              <div 
                                className="bar-segment cancelled" 
                                style={{height: `${data.cancelled * 10}%`}}
                                data-value={data.cancelled}
                              ></div>
                            </div>
                            <span className="bar-label">{data.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
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
                  <div className="stats-detail-card">
                    <div className="detail-card-header">
                      <h4>
                        <i className="fas fa-clock"></i>
                        Thời gian đặt sân phổ biến
                      </h4>
                    </div>
                    <div className="detail-card-body">
                      <div className="time-distribution">
                        <div className="time-slot">
                          <div className="time-bar" style={{height: '30%'}}></div>
                          <span>Sáng</span>
                        </div>
                        <div className="time-slot">
                          <div className="time-bar" style={{height: '15%'}}></div>
                          <span>Trưa</span>
                        </div>
                        <div className="time-slot">
                          <div className="time-bar" style={{height: '55%'}}></div>
                          <span>Chiều</span>
                        </div>
                        <div className="time-slot">
                          <div className="time-bar" style={{height: '95%'}}></div>
                          <span>Tối</span>
                        </div>
                      </div>
                      <div className="most-popular-time">
                        <i className="fas fa-star"></i>
                        <span>Khung giờ phổ biến nhất: <strong>19:00 - 20:30</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="stats-detail-card">
                    <div className="detail-card-header">
                      <h4>
                        <i className="fas fa-map-marker-alt"></i>
                        Cơ sở đặt sân thường xuyên
                      </h4>
                    </div>
                    <div className="detail-card-body">
                      <div className="location-distribution">
                        <div className="location-item">
                          <div className="location-name">Cơ sở Mỹ Đình</div>
                          <div className="location-bar-container">
                            <div className="location-bar" style={{width: '80%'}}></div>
                            <span>80%</span>
                          </div>
                        </div>
                        <div className="location-item">
                          <div className="location-name">Cơ sở Cầu Giấy</div>
                          <div className="location-bar-container">
                            <div className="location-bar" style={{width: '15%'}}></div>
                            <span>15%</span>
                          </div>
                        </div>
                        <div className="location-item">
                          <div className="location-name">Cơ sở Thanh Xuân</div>
                          <div className="location-bar-container">
                            <div className="location-bar" style={{width: '5%'}}></div>
                            <span>5%</span>
                          </div>
                        </div>
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
          <div className="tab-content history-content">
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
      <button className="reset-filters-btn-enhanced">
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
            <input type="radio" name="status" value="all" defaultChecked />
            <span>Tất cả</span>
          </label>
          <label className="filter-chip success">
            <input type="radio" name="status" value="completed" />
            <span><i className="fas fa-check-circle"></i> Hoàn thành</span>
          </label>
          <label className="filter-chip warning">
            <input type="radio" name="status" value="pending" />
            <span><i className="fas fa-clock"></i> Chờ thanh toán</span>
          </label>
          <label className="filter-chip danger">
            <input type="radio" name="status" value="cancelled" />
            <span><i className="fas fa-times-circle"></i> Đã hủy</span>
          </label>
        </div>
      </div>
      
      <div className="filter-section">
        <h4 className="filter-section-title">Cơ sở</h4>
        <div className="select-wrapper">
          <select className="filter-select-enhanced">
            <option value="all">Tất cả cơ sở</option>
            <option value="mydình">Cơ sở Mỹ Đình</option>
            <option value="caugiay">Cơ sở Cầu Giấy</option>
            <option value="thanhxuan">Cơ sở Thanh Xuân</option>
            <option value="hadong">Cơ sở Hà Đông</option>
          </select>
          <i className="fas fa-chevron-down select-arrow"></i>
        </div>
      </div>
      
      <div className="filter-section">
        <h4 className="filter-section-title">Khoảng thời gian</h4>
        <div className="date-range-picker">
          <div className="date-input-group">
            <div className="date-input-wrapper">
              <i className="fas fa-calendar-alt"></i>
              <input type="date" className="date-input" placeholder="Từ ngày" />
            </div>
            <div className="date-input-wrapper">
              <i className="fas fa-calendar-alt"></i>
              <input type="date" className="date-input" placeholder="Đến ngày" />
            </div>
          </div>
          <div className="quick-date-options">
            <button className="quick-date-btn">Hôm nay</button>
            <button className="quick-date-btn">Tuần này</button>
            <button className="quick-date-btn">Tháng này</button>
          </div>
        </div>
      </div>
      
      <div className="filter-section">
        <h4 className="filter-section-title">Tìm kiếm</h4>
        <div className="search-input-wrapper">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Nhập ID đặt sân hoặc tên sân..." 
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>
    </div>
    
    <div className="divider"></div>
    
    <div className="filters-footer">
      <button className="apply-filter-btn-enhanced">
        <i className="fas fa-search"></i>
        <span>Tìm kiếm</span>
      </button>
    </div>
  </div>
            
              <div className="history-results">
                <div className="results-header">
                  <div className="results-summary">
                    <h3>Kết quả</h3>
                    <span className="results-count">{bookingHistory.length} lịch sử đặt sân</span>
                  </div>
                </div>
                
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Mã đặt sân</th>
                        <th>Trạng thái</th>
                        <th>Cơ sở</th>
                        <th>Sân</th>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Giá tiền</th>
                        <th>Phương thức</th>
                        <th>Thanh toán</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingHistory.map(booking => (
                        <tr key={booking.id} className={booking.status === 'cancelled' ? 'cancelled-row' : ''}>
                          <td className="booking-id">#{booking.id}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                          <td>{booking.center}</td>
                          <td>{booking.court}</td>
                          <td>{booking.date}</td>
                          <td>{booking.time}</td>
                          <td className="booking-price">{booking.price}</td>
                          <td>{booking.paymentMethod}</td>
                          <td>{booking.paymentStatus}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="view-btn" title="Xem chi tiết">
                                <i className="fas fa-eye"></i>
                              </button>
                              {booking.status === 'pending' && (
                                <>
                                  <button className="pay-btn" title="Thanh toán">
                                    <i className="fas fa-credit-card"></i>
                                  </button>
                                  <button className="cancel-btn" title="Hủy đặt sân">
                                    <i className="fas fa-times"></i>
                                  </button>
                                </>
                              )}
                              {booking.status === 'completed' && (
                                <button className="review-btn" title="Đánh giá">
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
                    <span>Hiển thị 1-4 của 4 kết quả</span>
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
    < Footer/>
    </>
  );
};

export default UserProfile;