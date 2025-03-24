import React, { useEffect, useState } from 'react';
import '../styles/centerDetailModal.css';

const CenterDetailModal = ({ center, isOpen, onClose }) => {
  const [reviewContent, setReviewContent] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState([
    { id: 1, user: "Trần Anh Tuấn", rating: 5, date: "15/03/2025", comment: "Sân rất tốt, ánh sáng đầy đủ, nhân viên phục vụ chuyên nghiệp." },
    { id: 2, user: "Trần Anh Tuấn", rating: 4, date: "10/03/2025", comment: "Cơ sở vật chất hiện đại, chỉ tiếc là khá xa trung tâm." },
    { id: 3, user: "Trần Anh Tuấn", rating: 5, date: "05/03/2025", comment: "Đáng tiền! Sân tốt, dịch vụ chu đáo, sẽ quay lại." }
  ]);

  // Prevent scrolling of the background when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle click outside the modal to close it
  const handleOutsideClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    
    if (reviewContent.trim() === '') {
      return;
    }
    
    // Get current date in DD/MM/YYYY format
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    
    // Create new review
    const newReview = {
      id: reviews.length + 1,
      user: "Bạn", // Assuming the current user
      rating: selectedRating,
      date: formattedDate,
      comment: reviewContent
    };
    
    // Add to reviews
    setReviews([newReview, ...reviews]);
    
    // Reset form
    setReviewContent('');
    setSelectedRating(5);
  };

  if (!isOpen) return null;

  const additionalImages = [
    "/images/san1.png",
    "/images/san2.png",
    "/images/san3.jpg",
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

  const renderSelectableStars = () => {
    return [1, 2, 3, 4, 5].map(star => (
      <span 
        key={star}
        className={`selectable-star ${star <= (hoverRating || selectedRating) ? 'active' : ''}`}
        onClick={() => setSelectedRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
      >
        <i className={`${star <= (hoverRating || selectedRating) ? 'fas' : 'far'} fa-star`}></i>
      </span>
    ));
  };

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>{center.name}</h2>
          <button className="close-modal-btn" onClick={onClose} aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-main-image">
            <img 
              src={center.imgUrl || "/images/default.png"} 
              alt={center.name} 
              onError={(e) => {e.target.src = "/images/default.png"}}
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
                <span className="detail-value">{center.courtCount} sân</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-map"></i> Bản đồ</h3>
            <div className="map-placeholder">
              <div className="map-frame">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9244038028873!2d105.78076375707085!3d21.03708178599531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab32dd484c53%3A0x4b5c0c67d46f326b!2zMTcgRG_Do24gS-G6pyBUaGnhu4duLCBNYWkgROG7i2NoLCBD4bqndSBHaeG6pXksIEjDoCBO4buZaSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680235904873!5m2!1svi!2s"
                  width="100%" 
                  height="250" 
                  frameBorder="0" 
                  style={{border:0}} 
                  allowFullScreen="" 
                  aria-hidden="false" 
                  tabIndex="0"
                  title="Google Maps"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fas fa-images"></i> Hình ảnh</h3>
            <div className="image-gallery">
              {additionalImages.map((img, index) => (
                <div key={index} className="gallery-item">
                  <img 
                    src={img} 
                    alt={`${center.name} - Ảnh ${index + 1}`} 
                    onError={(e) => {e.target.src = "/images/default.png"}}
                  />
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
            
            {/* Review submission form */}
            <div className="review-form-container">
              <h4>Viết đánh giá của bạn</h4>
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="rating-selector">
                  <label>Đánh giá của bạn:</label>
                  <div className="star-rating">
                    {renderSelectableStars()}
                  </div>
                </div>
                <div className="comment-input">
                  <textarea 
                    placeholder="Chia sẻ trải nghiệm của bạn về sân..." 
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="submit-review-btn">
                  <i className="fas fa-paper-plane"></i> Gửi đánh giá
                </button>
              </form>
            </div>
            
            <div className="reviews-container">
              {reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <i className="fas fa-user-circle"></i>
                      <span>{review.user}</span>
                    </div>
                    <div className="review-rating">
                      <div className="stars">
                        {renderRatingStars(review.rating)}
                      </div>
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
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-chevron-left"></i> Quay lại
          </button>
          <div style={{ width: "10px" }}></div>
          <a 
            href={`/booking?centerId=${center._id}&user=000000000000000000000001`}
            className="book-modal-btn"
          >
            <i className="fas fa-calendar-check"></i>
            <span>Đặt Sân Ngay</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CenterDetailModal;