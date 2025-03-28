// src/pages/Login.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import { loginUser, registerUser } from '../apis/users';
import { AuthContext } from '../contexts/AuthContext.jsx';

const LoginModal = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false); // false: đăng nhập, true: đăng ký
  const modalRef = useRef(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // State cho form đăng nhập
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State cho form đăng ký
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Quản lý lỗi từng trường
  const [fieldErrors, setFieldErrors] = useState({});

  // Ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái loading cho form đăng ký
  const [isLoading, setIsLoading] = useState(false);

  // Tạo ref cho từng trường để focus nếu cần
  const refs = {
    name: useRef(null),
    email: useRef(null),
    phone_number: useRef(null),
    address: useRef(null),
    username: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const handleRegisterClick = () => {
    setIsActive(true);
    setSignupError('');
    setSignupSuccess('');
    setFieldErrors({});
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setLoginError('');
  };

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await loginUser({ username: loginUsername, password: loginPassword });
      console.log('Đăng nhập thành công:', result);
      login(result.user);
      navigate('/');
      onClose();
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError(error.response?.data?.message || error.message);
    }
  };

  // Xử lý thay đổi cho form đăng ký
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({ ...prevData, [name]: value }));
    // Reset lỗi của trường đó khi người dùng nhập
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    setFieldErrors({});

    // Kiểm tra mật khẩu trùng khớp trước
    if (signupData.password !== signupData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu và Xác nhận mật khẩu không trùng khớp" });
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...payload } = signupData;
      const result = await registerUser(payload);
      console.log('Đăng ký thành công:', result);
      setSignupSuccess(result.message || "Đăng ký thành công!");
      setIsActive(false);
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

  // Đóng modal khi click ngoài modal
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
          <i className="fas fa-times"></i>
        </button>

        {/* Form đăng nhập */}
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

        {/* Form đăng ký */}
        {/* Form đăng ký */}
<div className="form-box register">
  <form onSubmit={handleSignupSubmit} noValidate>
    <h1>Đăng ký</h1>
    {signupError && <p className="error-message">{signupError}</p>}
    {signupSuccess && <p className="success-message">{signupSuccess}</p>}

    {/* Spinner: chỉ hiển thị nếu isLoading === true */}
    {isLoading && (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    )}

    {/* Bọc toàn bộ các trường input + button trong div .form-content */}
    <div className={`form-content ${isLoading ? 'hidden' : ''}`}>
      {/* Họ và tên */}
      <div className={`input-box ${fieldErrors.name ? 'invalid' : signupData.name.trim() ? 'valid' : ''}`}>
        <input
          type="text"
          name="name"
          placeholder="Họ và tên"
          value={signupData.name}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.name}
        />
        <i className="bx bxs-user"></i>
      </div>
      {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}

      {/* Email */}
      <div className={`input-box ${fieldErrors.email ? 'invalid' : signupData.email.trim() ? 'valid' : ''}`}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={signupData.email}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.email}
        />
        <i className="bx bxs-envelope"></i>
      </div>
      {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

      {/* Số điện thoại */}
      <div className={`input-box ${fieldErrors.phone_number ? 'invalid' : signupData.phone_number.trim() ? 'valid' : ''}`}>
        <input
          type="text"
          name="phone_number"
          placeholder="Số điện thoại"
          value={signupData.phone_number}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.phone_number}
        />
        <i className="bx bxs-phone"></i>
      </div>
      {fieldErrors.phone_number && <p className="field-error">{fieldErrors.phone_number}</p>}

      {/* Địa chỉ */}
      <div className={`input-box ${fieldErrors.address ? 'invalid' : signupData.address.trim() ? 'valid' : ''}`}>
        <input
          type="text"
          name="address"
          placeholder="Địa chỉ"
          value={signupData.address}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.address}
        />
        <i className="bx bxs-map"></i>
      </div>
      {fieldErrors.address && <p className="field-error">{fieldErrors.address}</p>}

      {/* Tên đăng nhập */}
      <div className={`input-box ${fieldErrors.username ? 'invalid' : signupData.username.trim() ? 'valid' : ''}`}>
        <input
          type="text"
          name="username"
          placeholder="Tên đăng nhập"
          value={signupData.username}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.username}
        />
        <i className="bx bxs-user"></i>
      </div>
      {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}

      {/* Mật khẩu */}
      <div className={`input-box ${fieldErrors.password ? 'invalid' : signupData.password ? 'valid' : ''}`}>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Mật khẩu"
          value={signupData.password}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.password}
        />
        <i className="bx bxs-lock-alt"></i>
        <span
          className="toggle-pw"
          onClick={() => setShowPassword(!showPassword)}
          style={{ cursor: "pointer" }}
        >
          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '1.1rem' }}></i>
        </span>
      </div>
      {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

      {/* Xác nhận mật khẩu */}
      <div className={`input-box ${fieldErrors.confirmPassword ? 'invalid' : signupData.confirmPassword ? 'valid' : ''}`}>
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder="Xác nhận mật khẩu"
          value={signupData.confirmPassword}
          onChange={handleChange}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          ref={refs.confirmPassword}
        />
        <i className="bx bxs-lock-alt"></i>
        <span
          className="toggle-pw"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          style={{ cursor: "pointer" }}
        >
          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '1.1rem' }}></i>
        </span>
      </div>
      {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}

      <button type="submit" className="btn">Đăng ký</button>
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


        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Xin chào bạn!</h1>
            <p>Không có tài khoản?</p>
            <button className="btn register-btn" onClick={handleRegisterClick}>Đăng ký</button>
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
