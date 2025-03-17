import React from 'react';
import SearchBox from '../components/SearchBox';
import FieldCard from '../components/FieldCard';
import HowItWorks from '../components/HowItWorks';

// Mẫu dữ liệu sân bóng
const featuredFields = [
  {
    id: 1,
    name: 'Sân cầu Mỹ Đình',
    location: 'Quận Nam Từ Liêm, Hà Nội',
    priceRange: '300.000đ - 500.000đ',
    rating: 5,
    reviews: 45,
    image: '/images/fields/field1.jpg'
  },
  {
    id: 2,
    name: 'Sân cầu 24h',
    location: 'Quận Thanh Xuân, Hà Nội',
    priceRange: '250.000đ - 400.000đ',
    rating: 4,
    reviews: 32,
    image: '/images/fields/field2.jpg'
  },
  {
    id: 3,
    name: 'Sân cầu Thành Đô',
    location: 'Quận Cầu Giấy, Hà Nội',
    priceRange: '280.000đ - 450.000đ',
    rating: 5,
    reviews: 57,
    image: '/images/fields/field3.jpg'
  },
  {
    id: 4,
    name: 'Sân cầu Thủ Đô',
    location: 'Quận Hà Đông, Hà Nội',
    priceRange: '230.000đ - 380.000đ',
    rating: 4,
    reviews: 28,
    image: '/images/fields/field4.jpg'
  },  
  {
    id: 5,
    name: 'Sân cầu Cầu Giấy',
    location: 'Quận Cầu Giấy, Hà Nội',
    priceRange: '150.000đ - 280.000đ',
    rating: 4,
    reviews: 28,
    image: '/images/fields/field5.jpg'
  },   
  {
    id: 6,
    name: 'Sân Bóng Tuấn',
    location: 'Quận Hà Đông, Hà Nội',
    priceRange: '230.000đ - 380.000đ',
    rating: 4,
    reviews: 29,
    image: '/images/fields/field6.jpg'
  }
];

const Home = () => {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Đặt Sân cầu lông Nhanh Chóng và Tiện Lợi</h1>
          <p>Tìm kiếm và đặt sân cầu lông ở bất kỳ đâu, bất kỳ lúc nào</p>
          <SearchBox />
        </div>
      </section>

      <section className="featured-fields container">
        <h2 className="section-title">Sân cầu</h2>
        <div className="fields-grid">
          {featuredFields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      </section>

      <HowItWorks />
    </>
  );
};

export default Home;