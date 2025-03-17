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
        
        <input 
          type="date" 
          name="date" 
          value={searchParams.date} 
          onChange={handleChange}
        />
        
        <select 
          name="fieldType" 
          value={searchParams.fieldType} 
          onChange={handleChange}
        >
          <option value="">Loại Sân</option>
          <option value="5">Sân 5</option>
          <option value="7">Sân 7</option>
          <option value="11">Sân 11</option>
        </select>
        
        <select 
          name="time" 
          value={searchParams.time} 
          onChange={handleChange}
        >
          <option value="">Thời Gian</option>
          <option value="17-18">17:00 - 18:00</option>
          <option value="18-19">18:00 - 19:00</option>
          <option value="19-20">19:00 - 20:00</option>
          <option value="20-21">20:00 - 21:00</option>
        </select>
        
        <button type="submit">Tìm Sân</button>
      </form>
    </div>
  );
};

export default SearchBox;