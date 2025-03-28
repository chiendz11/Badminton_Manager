import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/centerDetailModal.css";
import { getCenterInfoById } from "../apis/centers"; // API trả về thông tin đầy đủ của center
import { AuthContext } from "../contexts/AuthContext";

const CenterDetailModal = ({ center, isOpen, onClose }) => {
  const modalRef = useRef(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const { user } = useContext(AuthContext); // Lấy thông tin user từ AuthContext
  const userId = user?._id; // Lấy userId từ user (nếu có)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close modal when clicking outside the modal container
  const handleOutsideClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose();
    }
  };

  useEffect(() => {
    if (center && center._id) {
      console.log("Fetching additional images for center:", center._id);
      getCenterInfoById(center._id)
        .then((data) => {
          console.log("API response:", data);
          if (data && data.center && Array.isArray(data.center.imgUrl)) {
            // Lấy các ảnh bổ sung (ngoại trừ ảnh đầu tiên)
            const images = data.center.imgUrl.slice(1);
            setAdditionalImages(images);
            console.log("Additional images:", images);
          } else {
            console.warn("Không tìm thấy trường imgUrl hoặc không phải là mảng", data);
          }
        })
        .catch((error) => {
          console.error("Error fetching center info for images:", error);
        });
    }
  }, [center]);

  if (!isOpen) return null;

  // Sử dụng embed URL từ center.mapUrl nếu có, nếu không fallback sang URL mặc định.
  const googleMapUrl = center.location
    ? center.location
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9244038028873!2d105.78076375707085!3d21.03708178599531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab32dd484c53%3A0x4b5c0c67d46f326b!2zMTcgRG_Do24gS-G6vyBUaGnhu4duLCBNYWkgROG7i2NoLCBD4bqndSBHaeG6pXksIEjDoCBO4buZaSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680235904873!5m2!1svi!2s";

  // Dữ liệu mẫu cho reviews
  const reviews = [
    { id: 1, user: "Nguyễn Văn A", rating: 5, date: "15/03/2025", comment: "Sân rất tốt, ánh sáng đầy đủ, nhân viên phục vụ chuyên nghiệp." },
    { id: 2, user: "Trần Thị B", rating: 4, date: "10/03/2025", comment: "Cơ sở vật chất hiện đại, chỉ tiếc là khá xa trung tâm." },
    { id: 3, user: "Lê Văn C", rating: 5, date: "05/03/2025", comment: "Đáng tiền! Sân tốt, dịch vụ chu đáo, sẽ quay lại." }
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

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2>{center.name}</h2>
          <button className="close-modal-btn" onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-main-image">
            <img
              src={center.imgUrl[0] || "/images/default.png"}
              alt={center.name}
              onError={(e) => {
                e.target.src = "/images/default.png";
              }}
            />
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-info-circle"></i> Thông tin chi tiết</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label"><i className="fas fa-map-marker-alt"></i> Địa chỉ:</span>
                <span className="detail-value">{center.address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><i className="fas fa-clock"></i> Giờ mở cửa:</span>
                <span className="detail-value">{center.openHours}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><i className="fas fa-phone"></i> Liên hệ:</span>
                <span className="detail-value">{center.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><i className="fas fa-table-tennis"></i> Số sân:</span>
                <span className="detail-value">{center.totalCourts} sân</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-map"></i> Bản đồ</h3>
            <div className="map-placeholder">
              <div className="map-frame">
                <iframe
                  src={googleMapUrl}
                  width="100%"
                  height="250"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  aria-hidden="false"
                  tabIndex="0"
                  title="Google Maps"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-images"></i> Hình ảnh cơ sở</h3>
            <div className="image-gallery">
              {additionalImages.map((img, index) => (
                <div key={index} className="gallery-item">
                  <img src={img} alt={`${center.name} - Ảnh ${index + 2}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-concierge-bell"></i> Dịch vụ</h3>
            <div className="services-grid">
              {center.facilities.map((facility, index) => (
                <div key={index} className="service-item">
                  <i className="fas fa-check-circle"></i>
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-star"></i> Đánh giá từ khách hàng</h3>
            <div className="reviews-container">
              {reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <i className="fas fa-user-circle"></i>
                      <span>{review.user}</span>
                    </div>
                    <div className="review-rating">
                      <div className="stars">{renderRatingStars(review.rating)}</div>
                      <span className="review-date">{review.date}</span>
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>Đóng</button>
          {userId ? (
            <a href={`/booking?centerId=${center._id}&user=${userId}`} className="book-modal-btn">
              <span>Đặt Sân Ngay</span>
              <i className="fas fa-arrow-right"></i>
            </a>
          ) : (
            <p className="login-warning">Bạn cần đăng nhập để đặt sân!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterDetailModal;
