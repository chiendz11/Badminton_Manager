import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/competitions.css';

const Competitions = () => {
  return (
    <>
      <Header />
      
      <div className="competitions-page">
        <div className="competitions-hero">
          <div className="competitions-hero-content">
            <h1>Giải Đấu Cầu Lông</h1>
            <p>Theo dõi và tham gia các giải đấu CLB mở rộng hàng tháng</p>
          </div>
        </div>

        <div className="competitions-container">
          <div className="competitions-header">
            <h2>Các Giải Đấu Sắp Diễn Ra</h2>
            <p>Cơ hội cạnh tranh và giao lưu với các CLB cầu lông hàng đầu</p>
          </div>

          <div className="empty-competitions">
            <div className="empty-competitions-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <h3>Chưa có giải đấu nào được tổ chức</h3>
            <p>Hệ thống đang cập nhật các giải đấu mới. Vui lòng quay lại sau!</p>
            <div className="empty-competitions-actions">
              <Link to="/" className="back-home-btn">
                <i className="fas fa-home"></i>
                <span>Quay lại trang chủ</span>
              </Link>
              <button className="notify-btn">
                <i className="fas fa-bell"></i>
                <span>Nhận thông báo khi có giải đấu</span>
              </button>
            </div>
          </div>

          <div className="competitions-info">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-medal"></i>
              </div>
              <h3>Giải thưởng hấp dẫn</h3>
              <p>Cơ hội nhận các giải thưởng giá trị cùng danh hiệu cao quý</p>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Giao lưu CLB</h3>
              <p>Kết nối với cộng đồng cầu lông và mở rộng mạng lưới</p>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Nâng cao trình độ</h3>
              <p>Cơ hội trau dồi kỹ năng qua các trận đấu cạnh tranh</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Competitions;