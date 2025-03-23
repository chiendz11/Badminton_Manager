import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logo = "/images/shuttleCock.png";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={isScrolled ? 'scrolled' : ''}>
      <div className="container header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <img
              src={logo}
            />
          </div>
          ĐẶT<span>SÂN</span>247
        </Link>

        <div className="header-right">
          <div className="header-contact">
            <div className="contact-item">
              <i className="fas fa-phone-alt"></i>
              <span>1900 8247</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <span>23021710@vnu.edu.vn</span>
            </div>
          </div>

          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={isMobileMenuOpen ? 'active' : ''}>
            <ul className="header-links">
              <li><Link to="/" onClick={closeMenu}>Trang Chủ</Link></li>
              <li><Link to="/search" onClick={closeMenu}>Tìm Sân</Link></li>
              <li className="dropdown">
                <span className="dropdown-toggle">Đặt Sân <i className="fas fa-chevron-down"></i></span>
                <ul className="dropdown-menu">
                  <li><Link to="/booking/badminton" onClick={closeMenu}>Sân Cầu Lông</Link></li>
                  <li><Link to="/booking/football" onClick={closeMenu}>Sân Bóng Đá</Link></li>
                  <li><Link to="/booking/tennis" onClick={closeMenu}>Sân Tennis</Link></li>
                </ul>
              </li>
              <li><Link to="/news" onClick={closeMenu}>Tin Tức</Link></li>
              <li><Link to="/contact" onClick={closeMenu}>Liên Hệ</Link></li>
              <li className="login-btn">
                <Link to="/login" onClick={closeMenu}>
                  <i className="fas fa-user"></i> Đăng Nhập
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;