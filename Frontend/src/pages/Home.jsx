import React from 'react';
import { Link } from 'react-router-dom';
import HowItWorks from '../components/HowItWorks';
import HeroBanner from '../components/HeroBanner';
import FeatureCards from '../pages/FeatureCards'

const Home = () => {
  return (
    <>
      <HeroBanner />
      <FeatureCards />
      <div className="container mt-5">
        <div className="section-header text-center">
          <h2 className="section-title">Khám Phá Sân Cầu Lông</h2>
          <p className="section-desc">Lựa chọn sân cầu lông phù hợp với nhu cầu của bạn</p>
        </div>
      </div>

      <div className = "row py-5 justify-content-center">
        <div className="col-4 img-hover-zoom img-hover-zoom--blur">
          <img src="/images/san1.png" className="img-fluid" alt="Sân cầu" />
          <div className="caption_banner">
            <span>Sân đấu chuẩn thi đấu</span>
            <h3>Hiện đại</h3>
            <Link to="/centers" className="explore-link">Xem ngay</Link>
          </div>
          <div className="overlay"></div>
        </div>

        <div className="col-4 img-hover-zoom img-hover-zoom--blur">
          <img src="/images/san2.png" className="img-fluid" alt="Sân cầu" />
          <div className="caption_banner">
            <span>Sân đấu phổ thông</span>
            <h3>Tiêu chuẩn</h3>
            <Link to="/centers" className="explore-link">Xem ngay</Link>
          </div>
          <div className="overlay"></div>
        </div>

        <div className="col-4 img-hover-zoom img-hover-zoom--blur">
          <img src="/images/san3.jpg" className="img-fluid" alt="Sân cầu" />
          <div className="caption_banner">
            <span>Giải thi đấu mở rộng</span>
            <h3>Thu hút</h3>
            <Link to="/competition" className="explore-link">Xem ngay</Link>
          </div>
          <div className="overlay"></div>
        </div>
      </div>

      <div className="container promo-banner-container">
        <div className="section-header text-center mb-4">
          <h2 className="section-title">Ưu Đãi Hấp Dẫn</h2>
          <p className="section-desc">Không bỏ lỡ những ưu đãi đặc biệt từ chúng tôi</p>
        </div>
        <div className="promo-banner img-hover-zoom-banner">
          <img src="/images/banner.png" alt="Giảm giá" className="img-fluid" />
          <div className="promo-overlay"></div>
          <div className="promo-content">
            <span className="promo-label">HOT!</span>
            <h3 className="promo-title">KHUYẾN MÃI KHAI TRƯƠNG</h3>
            <p className="promo-desc">Giảm giá lên đến 50% khi đặt sân trong tháng này</p>
          </div>
        </div>
      </div>

      <hr/>

      <HowItWorks />
    </>
  );
};

export default Home;



// Mẫu dữ liệu sân bóng
// const featuredFields = [
//   {
//     id: 1,
//     name: 'Sân cầu Mỹ Đình',
//     location: 'Quận Nam Từ Liêm, Hà Nội',
//     priceRange: '300.000đ - 500.000đ',
//     rating: 5,
//     reviews: 45,
//     image: '/images/fields/field1.jpg'
//   },
//   {
//     id: 2,
//     name: 'Sân cầu 24h',
//     location: 'Quận Thanh Xuân, Hà Nội',
//     priceRange: '250.000đ - 400.000đ',
//     rating: 4,
//     reviews: 32,
//     image: '/images/fields/field2.jpg'
//   },
//   {
//     id: 3,
//     name: 'Sân cầu Thành Đô',
//     location: 'Quận Cầu Giấy, Hà Nội',
//     priceRange: '280.000đ - 450.000đ',
//     rating: 5,
//     reviews: 57,
//     image: '/images/fields/field3.jpg'
//   },
//   {
//     id: 4,
//     name: 'Sân cầu Thủ Đô',
//     location: 'Quận Hà Đông, Hà Nội',
//     priceRange: '230.000đ - 380.000đ',
//     rating: 4,
//     reviews: 28,
//     image: '/images/fields/field4.jpg'
//   },  
//   {
//     id: 5,
//     name: 'Sân cầu Cầu Giấy',
//     location: 'Quận Cầu Giấy, Hà Nội',
//     priceRange: '150.000đ - 280.000đ',
//     rating: 4,
//     reviews: 28,
//     image: '/images/fields/field5.jpg'
//   },   
//   {
//     id: 6,
//     name: 'Sân Bóng Tuấn',
//     location: 'Quận Hà Đông, Hà Nội',
//     priceRange: '230.000đ - 380.000đ',
//     rating: 4,
//     reviews: 29,
//     image: '/images/fields/field6.jpg'
//   }
// ];