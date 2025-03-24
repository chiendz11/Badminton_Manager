import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';
import LoginModal from '../pages/Login';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logo = "/images/shuttleCock.png";
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  const openLoginModal = (e) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
    closeMenu(); 
  };

  return (
    <>
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="container header-container">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <i className="fas fa-table-tennis"></i>
            </div>
            ĐẶT<span>SÂN</span>247
          </Link>

          <div className="header-right">
            <div className="header-contact">
              <div className="contact-item">
                <i className="fas fa-phone-alt"></i>
                <span>1900 1809</span>
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
                <li><Link to="/centers" onClick={closeMenu}>Đặt Sân</Link></li>
                <li><Link to="/news" onClick={closeMenu}>Tin Tức</Link></li>
                <li><Link to="/policy" onClick={closeMenu}>Chính Sách</Link></li>
                <li><Link to="/contact" onClick={closeMenu}>Liên Hệ</Link></li>
                <li className="login-btn">
                  <a href="#login" onClick={openLoginModal}>
                    <i className="fas fa-user"></i> Đăng Nhập
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
    
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};

export default Header;