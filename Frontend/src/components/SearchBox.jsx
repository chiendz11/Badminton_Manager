import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    district: '',
    date: '',
    fieldType: '',
    time: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(searchParams).toString();
    navigate(`/search?${queryString}`);
  };

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit}>
        <div className="search-group">
          <div className="icon-container">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <select 
            name="district" 
            value={searchParams.district} 
            onChange={handleChange}
          >
            <option value="">Chọn Quận/Huyện</option>
            <option value="hoan-kiem">Quận Hoàn Kiếm</option>
            <option value="ba-dinh">Quận Ba Đình</option>
            <option value="dong-da">Quận Đống Đa</option>
            <option value="hai-ba-trung">Quận Hai Bà Trưng</option>
            <option value="thanh-xuan">Quận Thanh Xuân</option>
          </select>
        </div>
        
        <div className="search-group">
          <div className="icon-container">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <input 
            type="date" 
            name="date" 
            value={searchParams.date} 
            onChange={handleChange}
          />
        </div>
        
        <div className="search-group">
          <div className="icon-container">
            <i className="fas fa-table-tennis"></i>
          </div>
          <select 
            name="fieldType" 
            value={searchParams.fieldType} 
            onChange={handleChange}
          >
            <option value="">Loại Sân</option>
            <option value="1">Sân tiêu chuẩn</option>
            <option value="premium">Sân cao cấp</option>
          </select>
        </div>
        
        <div className="search-group">
          <div className="icon-container">
            <i className="fas fa-clock"></i>
          </div>
          <select 
            name="time" 
            value={searchParams.time} 
            onChange={handleChange}
          >
            <option value="">Thời Gian</option>
            <option value="8-9">08:00 - 09:00</option>
            <option value="9-10">09:00 - 10:00</option>
            <option value="10-11">10:00 - 11:00</option>
            <option value="14-15">14:00 - 15:00</option>
            <option value="15-16">15:00 - 16:00</option>
            <option value="16-17">16:00 - 17:00</option>
            <option value="17-18">17:00 - 18:00</option>
            <option value="18-19">18:00 - 19:00</option>
            <option value="19-20">19:00 - 20:00</option>
            <option value="20-21">20:00 - 21:00</option>
          </select>
        </div>
        
        <button type="submit">
          <i className="fas fa-search"></i> Tìm Sân
        </button>
      </form>
    </div>
  );
};

export default SearchBox;