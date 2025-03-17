import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';

const Header = () => {
  return (
    <header>
      <div className="container header-container">
        <Link to="/" className="logo">ĐẶT<span>SÂN</span>247</Link>
        <nav>
          <ul className="header-links">
            <li><Link to="/">Trang Chủ</Link></li>
            <li><Link to="/search">Tìm Sân</Link></li>
            <li><Link to="/booking">Đặt Sân</Link></li>
            <li><Link to="/news">Tin Tức</Link></li>
            <li><Link to="/contact">Liên Hệ</Link></li>
            <li><Link to="/login">Đăng Nhập</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;