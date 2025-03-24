import React, { useState, useEffect, useRef } from 'react';
import '../styles/login.css';

const LoginModal = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const modalRef = useRef(null);
  
  const handleRegisterClick = () => {
    setIsActive(true);
  };
  
  const handleLoginClick = () => {
    setIsActive(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div ref={modalRef} className={`container ${isActive ? 'active' : ''}`}>
        <button className="close-modal-btn" onClick={onClose}>
          <i className='fas fa-times'></i>
        </button>
        
        <div className="form-box login">
          <form action="#">
            <h1>Đăng nhập</h1>
            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className='bx bxs-user'></i>
            </div>
            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className='bx bxs-lock-alt'></i>
            </div>
            <div className="forgot-link">
              <a href="#">Quên mật khẩu?</a>
            </div>
            <button type="submit" className="btn">Đăng nhập</button>
            <p className="social-text">Đăng nhập khác</p>
            <div className="social-icons">
               <a href="https://facebook.com" className="social-icon facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://instagram.com" className="social-icon instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://twitter.com" className="social-icon twitter">
                  <i className="fab fa-twitter"></i>
                </a>
            </div>
          </form>
        </div>

        <div className="form-box register">
          <form action="#">
            <h1>Đăng kí</h1>
            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className='bx bxs-user'></i>
            </div>
            <div className="input-box">
              <input type="email" placeholder="Email" required />
              <i className='bx bxs-envelope'></i>
            </div>
            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className='bx bxs-lock-alt'></i>
            </div>
            <button type="submit" className="btn">Đăng kí</button>
            <p className="social-text">Đăng kí khác</p>
            <div className="social-icons">
              <a href="https://facebook.com" className="social-icon facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" className="social-icon instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://twitter.com" className="social-icon twitter">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Xin chào bạn!</h1>
            <p>Không có tài khoản?</p>
            <button className="btn register-btn" onClick={handleRegisterClick}>Đăng kí</button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Chào mừng bạn</h1>
            <p>Đã có tài khoản?</p>
            <button className="btn login-btn" onClick={handleLoginClick}>Đăng nhập</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;