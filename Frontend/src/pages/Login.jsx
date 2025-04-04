// src/pages/Login.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import { loginUser, registerUser } from '../apis/users';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { forgotPasswordByEmailSimpleApi } from '../apis/users'; // Giả sử bạn đã tạo API này trong users.js

const LoginModal = ({ isOpen, onClose }) => {
  // activeMode: "login", "register", hoặc "forgot"
  const [activeMode, setActiveMode] = useState("login");
  const modalRef = useRef(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // State cho form đăng nhập
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false); // State loading cho đăng nhập

  // State cho form đăng ký
  const [signupData, setSignupData]  = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [signupError, setSignupError]  = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // State cho form quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false); // State loading cho quên mật khẩu

  // Quản lý lỗi từng trường
  const [fieldErrors, setFieldErrors] = useState({});

  // Ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái loading cho form đăng ký
  const [isLoading, setIsLoading] = useState(false);

  // Tạo ref cho từng trường nếu cần
  const refs = {
    name: useRef(null),
    email: useRef(null),
    phone_number: useRef(null),
    address: useRef(null),
    username: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  // Hàm chuyển đổi form
  const handleRegisterClick = () => {
    setActiveMode("register");
    setSignupError('');
    setSignupSuccess('');
    setFieldErrors({});
  };

  const handleLoginClick = () => {
    setActiveMode("login");
    setLoginError('');
  };

  const handleForgotClick = () => {
    setActiveMode("forgot");
    setForgotMessage('');
  };

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true); // Bắt đầu loading
    try {
      const result = await loginUser({ username: loginUsername, password: loginPassword });
      console.log('Đăng nhập thành công:', result);
      login(result.user);
      navigate('/');
      onClose();
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError(error.response?.data?.message || error.message);
    } finally {
      setIsLoginLoading(false); // Kết thúc loading
    }
  };

  // Hàm handleChange cho form đăng ký
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({...prevData, [name]: value }));
    setFieldErrors((prev) => ({...prev, [name]: '' }));
  };

  // Xử lý đăng ký
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    setFieldErrors({});

    if (signupData.password!== signupData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu và xác nhận mật khẩu không trùng khớp" });
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword,...payload } = signupData;
      const result = await registerUser(payload);
      console.log('Đăng ký thành công:', result);
      setSignupSuccess(result.message || "Đăng ký thành công!");
      setActiveMode("login");
      setSignupData({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        setFieldErrors(error.response.data.errors);
      } else {
        setSignupError(error.response?.data?.message || error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setIsForgotLoading(true); // Bắt đầu loading
    try {
      const result = await forgotPasswordByEmailSimpleApi(forgotEmail);
      setForgotMessage(result.message);
    } catch (error) {
      console.error("Lỗi khi lấy lại mật khẩu:", error);
      setForgotMessage(error.response?.data?.message || error.message);
    } finally {
      setIsForgotLoading(false); // Kết thúc loading
    }
  };

  // Đóng modal khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current &&!modalRef.current.contains(event.target)) {
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
      {/* Class "active" được thêm nếu activeMode không phải "login" (chuyển sang register hoặc forgot) */}
      <div ref={modalRef} className={`container ${activeMode!== "login"? 'active' : ''}`}>
        <button className="close-modal-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {/* FORM ĐĂNG NHẬP */}
        {activeMode === "login" && (
          <div className="form-box login">
            <form onSubmit={handleLoginSubmit} noValidate>
              <h1>Đăng nhập</h1>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
                <i className="bx bxs-user"></i>
              </div>
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <i className="bx bxs-lock-alt"></i>
              </div>
              {loginError && <p className="error-message">{loginError}</p>}
              <div className="forgot-link">
                <a href="#" onClick={handleForgotClick}>Quên mật khẩu?</a>
              </div>
              <button type="submit" className="btn" disabled={isLoginLoading}>
                {isLoginLoading? <i className="fas fa-spinner fa-spin"></i> : 'Đăng nhập'}
              </button>
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
        )}

        {/* FORM QUÊN MẬT KHẨU */}
        {activeMode === "forgot" && (
          <div className="form-box forgot">
            <form onSubmit={handleForgotSubmit} noValidate>
              <h1>Quên mật khẩu</h1>
              {forgotMessage && <p className="info-message">{forgotMessage}</p>}
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Nhập Email của bạn"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <i className="bx bxs-envelope"></i>
              </div>
              <button type="submit" className="btn" disabled={isForgotLoading}>
                {isForgotLoading? <i className="fas fa-spinner fa-spin"></i> : 'Gửi yêu cầu'}
              </button>
            </form>
          </div>
        )}

        {/* FORM ĐĂNG KÝ */}
        {activeMode === "register" && (
          <div className="form-box register">
            <form onSubmit={handleSignupSubmit} noValidate>
              <h1>Đăng ký</h1>
              {signupError && <p className="error-message">{signupError}</p>}
              {signupSuccess && <p className="success-message">{signupSuccess}</p>}
              {isLoading && (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
              <div className={`form-content ${isLoading? 'hidden' : ''}`}>
                <div className={`input-box ${fieldErrors.name? 'invalid' : signupData.name.trim()? 'valid' : ''}`}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Họ và tên"
                    value={signupData.name}
                    onChange={handleChange}
                    ref={refs.name}
                  />
                  <i className="bx bxs-user"></i>
                </div>
                {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
                <div className={`input-box ${fieldErrors.email? 'invalid' : signupData.email.trim()? 'valid' : ''}`}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={signupData.email}
                    onChange={handleChange}
                    ref={refs.email}
                  />
                  <i className="bx bxs-envelope"></i>
                </div>
                {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                <div className={`input-box ${fieldErrors.phone_number? 'invalid' : signupData.phone_number.trim()? 'valid' : ''}`}>
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="Số điện thoại"
                    value={signupData.phone_number}
                    onChange={handleChange}
                    ref={refs.phone_number}
                  />
                  <i className="bx bxs-phone"></i>
                </div>
                {fieldErrors.phone_number && <p className="field-error">{fieldErrors.phone_number}</p>}
                <div className={`input-box ${fieldErrors.address? 'invalid' : signupData.address.trim()? 'valid' : ''}`}>
                  <input
                    type="text"
                    name="address"
                    placeholder="Địa chỉ"
                    value={signupData.address}
                    onChange={handleChange}
                    ref={refs.address}
                  />
                  <i className="bx bxs-map"></i>
                </div>
                {fieldErrors.address && <p className="field-error">{fieldErrors.address}</p>}
                <div className={`input-box ${fieldErrors.username? 'invalid' : signupData.username.trim()? 'valid' : ''}`}>
                  <input
                    type="text"
                    name="username"
                    placeholder="Tên đăng nhập"
                    value={signupData.username}
                    onChange={handleChange}
                    ref={refs.username}
                  />
                  <i className="bx bxs-user"></i>
                </div>
                {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
                <div className={`input-box ${fieldErrors.password? 'invalid' : signupData.password? 'valid' : ''}`}>
                  <input
                    type={showPassword? "text" : "password"}
                    name="password"
                    placeholder="Mật khẩu"
                    value={signupData.password}
                    onChange={handleChange}
                    ref={refs.password}
                  />
                  <i className="bx bxs-lock-alt"></i>
                  <span
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className={`fas ${showPassword? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '1.1rem' }}></i>
                  </span>
                </div>
                {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                <div className={`input-box ${fieldErrors.confirmPassword? 'invalid' : signupData.confirmPassword? 'valid' : ''}`}>
                  <input
                    type={showConfirmPassword? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    value={signupData.confirmPassword}
                    onChange={handleChange}
                    ref={refs.confirmPassword}
                  />
                  <i className="bx bxs-lock-alt"></i>
                  <span
                    className="toggle-pw"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className={`fas ${showConfirmPassword? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '1.1rem' }}></i>
                  </span>
                </div>
                {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading? <i className="fas fa-spinner fa-spin"></i> : 'Đăng ký'}
                </button>
                <p className="social-text">Đăng ký khác</p>
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
              </div>
            </form>
          </div>
        )}

        {/* TOGGLE BOX */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            {activeMode === "login" && (
              <>
                <h1>Xin chào bạn!</h1>
                <p>Không có tài khoản?</p>
                <button className="btn register-btn" onClick={handleRegisterClick}>Đăng ký</button>
              </>
            )}
          </div>
          <div className="toggle-panel toggle-right">
            {activeMode === "login" && (
              <>
                <h1>Chào mừng bạn</h1>
                <p>Đã có tài khoản?</p>
                <button className="btn login-btn" onClick={handleLoginClick}>Đăng nhập</button>
              </>
            )}
            {activeMode === "forgot" && (
              <>
                <h1>Quên mật khẩu</h1>
                <p>Bạn đã nhớ mật khẩu?</p>
                <button className="btn register-btn" onClick={handleLoginClick}>Đăng nhập</button>
              </>
            )}
            {activeMode === "register" && (
              <>
                <h1>Chào mừng bạn</h1>
                <p>Không có tài khoản?</p>
                <button className="btn register-btn" onClick={handleLoginClick}>Đăng nhập</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;