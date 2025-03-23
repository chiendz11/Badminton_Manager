import React, { useState, useRef, useEffect } from "react";
import "../styles/login.css";

const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password, rememberMe });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="login-modal">
        <div className="modal-header">
          <h2>Đăng Nhập</h2>
          <button onClick={onClose} className="close-button">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="email">Email/Số điện thoại</label>
            <div className="input-icon-wrapper">
              <i className="fas fa-user"></i>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email hoặc số điện thoại"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-icon-wrapper">
              <i className="fas fa-lock"></i>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember-me">Ghi nhớ đăng nhập</label>
            </div>
            
            <a href="#forgot-password" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="login-button">
            Đăng Nhập
          </button>

          <div className="divider">
            <span>hoặc</span>
          </div>

          <div className="social-login">
            <button type="button" className="facebook-btn">
              <i className="fab fa-facebook-f"></i>
              Facebook
            </button>
            <button type="button" className="google-btn">
              <i className="fab fa-google"></i>
              Google
            </button>
          </div>

          <div className="register-link">
            <p>
              Chưa có tài khoản?{" "}
              <a href="#register">Đăng ký ngay</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;