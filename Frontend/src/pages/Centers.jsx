import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/centers.css';
import Footer from '../components/Footer';
import Header from '../components/Header';
import CenterDetailModal from '../pages/CenterDetailModal';

const Centers = () => {
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (center) => {
    setSelectedCenter(center);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const centers = [
    {
      _id: "67ca6e3cfc964efa218ab7d7",
      name: "Cơ sở Mỹ Đình",
      address: "Số 12 Đường Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm, Hà Nội",
      description: "Hệ thống 5 sân cầu lông tiêu chuẩn quốc tế, trang bị thảm chống trượt và hệ thống đèn LED cao cấp. Phòng thay đồ, phòng tắm được trang bị đầy đủ tiện nghi.",
      phone: "0972.628.815",
      imgUrl: "/images/center1.png",
      courtCount: 5,
      ratings: 4.8,
      openHours: "6:00 - 22:00",
      facilities: ["Phòng thay đồ", "Wifi miễn phí", "Máy lạnh", "Căn tin"]
    },
    {
      _id: "67ca6e3cfc964efa218ab7d8",
      name: "Cơ sở Cầu Giấy",
      address: "Số 25 Trần Thái Tông, Dịch Vọng, Cầu Giấy, Hà Nội",
      description: "Khu phức hợp thể thao với 4 sân cầu lông chất lượng cao. Tất cả các sân đều được thiết kế theo tiêu chuẩn thi đấu, với không gian rộng rãi và ánh sáng tối ưu.",
      phone: "0972.628.815",
      imgUrl: "/images/center2.png",
      courtCount: 4,
      ratings: 4.6,
      openHours: "6:00 - 23:00",
      facilities: ["Bãi đỗ xe rộng", "Huấn luyện viên", "Dịch vụ đánh giá kỹ thuật", "Shop dụng cụ"]
    },
    {
      _id: "67ca6e3cfc964efa218ab7d9",
      name: "Cơ sở Thanh Xuân",
      address: "Số 76 Nguyễn Trãi, Thanh Xuân Trung, Thanh Xuân, Hà Nội",
      description: "Trung tâm thể thao hiện đại với 6 sân cầu lông tiêu chuẩn. Môi trường chuyên nghiệp, thân thiện và đầy đủ tiện nghi cho người chơi ở mọi cấp độ.",
      phone: "0972.628.815",
      imgUrl: "/images/center3.jpg",
      courtCount: 6,
      ratings: 4.5,
      openHours: "6:00 - 22:00",
      facilities: ["Đèn LED cao cấp", "Sàn gỗ chuyên nghiệp", "Căn tin", "Phòng y tế"]
    },
    {
      _id: "67ca6e3cfc964efa218ab7da",
      name: "Cơ sở Hà Đông",
      address: "Số 38 Nguyễn Khuyến, Văn Quán, Hà Đông, Hà Nội",
      description: "Khu thể thao đầy đủ tiện nghi với 4 sân cầu lông chuyên nghiệp. Không gian thoáng đãng, dịch vụ chu đáo, phù hợp cho cả gia đình và những người đam mê cầu lông.",
      phone: "0972.628.815",
      imgUrl: "/images/center4.jpg",
      courtCount: 4,
      ratings: 4.7,
      openHours: "6:30 - 21:30",
      facilities: ["Giữ xe miễn phí", "Cho thuê vợt", "Dịch vụ đan cước vợt", "Nước uống miễn phí"]
    }
  ];

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<i key={i} className="fas fa-star"></i>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star"></i>);
      }
    }
    
    return stars;
  };

  const renderFacilities = (facilities) => {
    return (
      <div className="center-facilities">
        {facilities.map((facility, index) => (
          <span key={index} className="facility-tag">
            {facility}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
    <Header />

    <div className="centers-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Chọn Cơ Sở Yêu Thích Của Bạn</h1>
          <p>Tìm và đặt sân cầu lông tốt nhất tại Hà Nội</p>
          <div className="hero-stats">
            <div className="stat-item">
              <i className="fas fa-medal"></i>
              <div className="stat-info">
                <span className="stat-number">4</span>
                <span className="stat-label">Cơ sở hàng đầu</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-table-tennis"></i>
              <div className="stat-info">
                <span className="stat-number">20</span>
                <span className="stat-label">Sân cầu lông</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-users"></i>
              <div className="stat-info">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Đặt sân/tháng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="centers-header">
        <h2>Các Cơ Sở Cầu Lông tại Hà Nội</h2>
        <p>Vui lòng chọn một trong các cơ sở cầu lông dưới đây để đặt sân</p>
      </div>

      <div className="centers-grid">
        {centers.map(center => (
          
          <div key={center._id} className="center-card">
            <div className="center-image">
              <img 
                src={center.imgUrl || "/images/default.png"} 
                alt={center.name} 
                onError={(e) => {e.target.src = "/images/default.png"}}
              />
              <div className="center-badge">
                <i className="fas fa-table-tennis"></i> {center.courtCount} sân
              </div>
              {center.popularity && (
                <div className="center-popular-tag">
                  <i className="fas fa-fire"></i> {center.popularity}
                </div>
              )}
              {center.promotion && (
                <div className="center-promo-badge">
                  <i className="fas fa-tags"></i> {center.promotion}
                </div>
              )}
            </div>

            <div className="center-info">
              <div className="center-header">
                <h2>{center.name}</h2>
                <div className="center-rating">
                  <div className="stars">
                    {renderRatingStars(center.ratings)}
                  </div>
                  <span>{center.ratings}/5</span>
                </div>
              </div>

              <div className="center-booking-stats">
                <i className="fas fa-calendar-check"></i>
                <span>{center.bookingsLastMonth}+ lượt đặt tháng này</span>
              </div>

              <p className="center-address">
                <i className="fas fa-map-marker-alt"></i> {center.address}
              </p>

              <div className="center-divider"></div>

              <p className="center-description">{center.description}</p>
              
              {renderFacilities(center.facilities)}
              
              <div className="center-footer">
                <div className="center-details">
                  <span>
                    <i className="fas fa-clock"></i> {center.openHours}
                  </span>
                  <span>
                    <i className="fas fa-phone"></i> {center.phone}
                  </span>
                </div>

                <div className="center-action-buttons">
                  <button 
                    className="view-details-btn" 
                    onClick={() => openModal(center)}
                    title="Xem chi tiết"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <Link 
                    to={`/booking?centerId=${center._id}&user=000000000000000000000001`} 
                    className="book-center-btn"
                  >
                    <span>Đặt Sân Ngay</span>
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="centers-info-section">
        <div className="info-card">
          <div className="info-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h3>Đặt Sân An Toàn</h3>
          <p>Thanh toán bảo mật và đảm bảo hoàn tiền nếu có vấn đề</p>
        </div>
        <div className="info-card">
          <div className="info-icon">
            <i className="fas fa-bolt"></i>
          </div>
          <h3>Đặt Sân Nhanh Chóng</h3>
          <p>Chỉ mất vài phút để hoàn tất đặt sân và nhận xác nhận</p>
        </div>
        <div className="info-card">
          <div className="info-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>Trải Nghiệm Chất Lượng</h3>
          <p>Tất cả các cơ sở đều được đánh giá và kiểm duyệt chất lượng</p>
        </div>
      </div>

      {/* Modal component */}
      {selectedCenter && (
        <CenterDetailModal 
          center={selectedCenter}
          isOpen={modalOpen}
          onClose={closeModal}
        />
      )}
    </div>

    <Footer />
    </>
  );
};

export default Centers;