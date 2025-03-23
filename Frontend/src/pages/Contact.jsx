import React, { useState } from 'react';
import '../styles/contact.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ tên";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Vui lòng nhập nội dung";
    }
    
    return newErrors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submit form logic would go here
    console.log("Form submitted:", formData);
    
    // Show success message
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <>
      <Header />
      <div className="contact-page">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-info">
              <h2>Thông Tin Liên Hệ</h2>
              
              <div className="info-item">
                <div className="icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="text">
                  <h3>Địa Chỉ</h3>
                  <p>Tòa nhà The Nine, Doãn Kế Thiện, Cầu Giấy, Hà Nội, Việt Nam</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div className="text">
                  <h3>Điện Thoại</h3>
                  <p><a href="tel:0972628815">0972628815</a></p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="text">
                  <h3>Email</h3>
                  <p><a href="mailto:23021710@vnu.edu.vn">23021710@vnu.edu.vn</a></p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="text">
                  <h3>Giờ Làm Việc</h3>
                  <p>Thứ Hai - Thứ Sáu: 8:00 - 17:30</p>
                  <p>Thứ Bảy: 8:00 - 12:00</p>
                </div>
              </div>
              
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="youtube">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
            
            <div className="contact-form-container">
              <h2>Gửi Tin Nhắn</h2>
              
              {submitted ? (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  <p>Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Họ tên <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                      />
                      {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <div className="error-message">{errors.email}</div>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Số điện thoại</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? 'error' : ''}
                      />
                      {errors.phone && <div className="error-message">{errors.phone}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="subject">Chủ đề</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">Nội dung <span className="required">*</span></label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? 'error' : ''}
                    ></textarea>
                    {errors.message && <div className="error-message">{errors.message}</div>}
                  </div>
                  
                  <button type="submit" className="submit-button">
                    Gửi Tin Nhắn <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        <div className="map-section">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9244038028873!2d105.78076375707085!3d21.03708178599531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab32dd484c53%3A0x4b5c0c67d46f326b!2zMTcgRG_Do24gS-G6vyBUaGnhu4duLCBNYWkgROG7i2NoLCBD4bqndSBHaeG6pXksIEjDoCBO4buZaSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680235904873!5m2!1svi!2s" 
            width="100%" 
            height="450" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
          />
        </div>
        
        <div className="faq-section container">
          <h2>Câu Hỏi Thường Gặp</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3><i className="fas fa-question-circle"></i> Làm thế nào để đặt sân?</h3>
              <p>Bạn có thể đặt sân trực tiếp trên website bằng cách chọn "Đặt Sân" từ menu chính, sau đó chọn địa điểm và thời gian mong muốn.</p>
            </div>
            
            <div className="faq-item">
              <h3><i className="fas fa-question-circle"></i> Có thể hủy đặt sân không?</h3>
              <p>Bạn có thể hủy đặt sân trước 24 giờ so với thời gian đã đặt. Hủy đặt sân trong vòng 24 giờ sẽ phải chịu phí hủy 30%.</p>
            </div>
            
            <div className="faq-item">
              <h3><i className="fas fa-question-circle"></i> Cách thức thanh toán?</h3>
              <p>Chúng tôi hỗ trợ nhiều phương thức thanh toán khác nhau bao gồm thẻ tín dụng, chuyển khoản ngân hàng, và ví điện tử.</p>
            </div>
            
            <div className="faq-item">
              <h3><i className="fas fa-question-circle"></i> Có thể thuê vợt cầu lông không?</h3>
              <p>Có, hầu hết các sân cầu lông đều cung cấp dịch vụ thuê vợt và bán cầu. Chi tiết cụ thể sẽ được hiển thị trên trang thông tin của từng sân.</p>
            </div>
          </div>
          
          <div className="support-banner">
            <div className="support-content">
              <h3>Bạn cần hỗ trợ thêm?</h3>
              <p>Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn với mọi thắc mắc</p>
              <button className="support-button">
                <i className="fas fa-headset"></i> Liên Hệ Hỗ Trợ
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Contact;