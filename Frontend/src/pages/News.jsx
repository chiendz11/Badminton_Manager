import React, { useState, useEffect } from 'react';
import '../styles/news.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const News = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const buttons = document.querySelectorAll('.news-categories button:nth-child(3)');
    
    function createRipple(event) {
      const button = event.currentTarget;
      
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
      circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
      circle.classList.add('ripple');
      
      const ripple = button.getElementsByClassName('ripple')[0];
      
      if (ripple) {
        ripple.remove();
      }
      
      button.appendChild(circle);
    }
    
    buttons.forEach(button => {
      button.addEventListener('click', createRipple);
    });
    
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', createRipple);
      });
    };
  }, []);

  const newsData = [
    {
      id: 1,
      title: 'Thùy Linh thua cựu số một thế giới ở giải Anh',
      summary: 'Tay vợt nữ số một Việt Nam Nguyễn Thùy Linh gác vợt 19-21, 12-21 trước Akane Yamaguchi ở vòng một giải cầu lông Toàn Anh Mở rộng 2025, ngày 11/3.',
      image: '/images/news/linh1.webp',
      category: 'tournaments',
      date: '11/03/2025',
      source: 'VnExpress',
      url: 'https://vnexpress.net/thuy-linh-thua-cuu-so-mot-the-gioi-o-giai-anh-4860062.html'
    },
    {
      id: 2,
      title: 'Thùy Linh lại lỡ hẹn ngôi vô địch Đức Mở rộng',
      summary: 'Tay vợt nữ số một Việt Nam thua Yeo Jia Min 17-21, 16-21 trong trận chung kết tối 2/3, lần thứ hai liên tiếp về nhì giải cầu lông Đức Mở rộng.',
      image: '/images/news/linh2.webp',
      category: 'tournaments',
      date: '02/03/2025',
      source: 'VnExpress',
      url: 'https://vnexpress.net/thuy-linh-lai-lo-hen-ngoi-vo-dich-duc-mo-rong-4855891.html'
    },
    {
      id: 3,
      title: 'Thùy Linh vào chung kết giải Đức Mở rộng 2025',
      summary: 'Thể hiện bản lĩnh đúng lúc, ghi những điểm số khó tin, Nguyễn Thùy Linh đánh bại Riko Gunji 21-17, 21-19 để lần thứ hai liên tiếp vào chung kết giải Đức mở rộng.',
      image: '/images/news/linh3.webp',
      category: 'tournaments',
      date: '01/03/2025',
      source: 'VnExpress',
      url: 'https://vnexpress.net/thuy-linh-vao-chung-ket-giai-duc-mo-rong-2025-4855710.html'
    },
    {
      id: 4,
      title: 'Thùy Linh vào bán kết giải Đức Mở rộng',
      summary: 'Nguyễn Thùy Linh thắng Clara Lassaux 21-8, 21-15 ở tứ kết cầu lông Đức Mở rộng Super 300 hôm 29/2, tiến gần tới việc bảo vệ thành công ngôi á quân.',
      image: '/images/news/linh4.webp',
      category: 'tournaments',
      date: '29/02/2025',
      source: 'VnExpress',
      url: 'https://vnexpress.net/thuy-linh-vao-ban-ket-giai-duc-mo-rong-4855405.html'
    },
    {
      id: 5,
      title: 'Lê Đức Phát vào tứ kết đơn nam U19 châu Á',
      summary: 'Hạt giống số một Lê Đức Phát thắng đối thủ Trung Quốc Xu Pu Yang ở vòng ba, đi tiếp tại giải cầu lông U19 châu Á hôm 27/2.',
      image: '/images/news/phat1.webp',
      category: 'tournaments',
      date: '27/02/2025',
      source: 'Thanhnienvn',
      url: 'https://thanhnien.vn/le-duc-phat-nguyen-thuy-linh-tien-vao-tu-ket-giai-cau-long-viet-nam-mo-rong-185240912184920924.htm'
    },
    {
      id: 6,
      title: 'Tiến Minh thua trận đầu tại Giải đấu quốc tế Maldives',
      summary: 'Cựu tay vợt số một Việt Nam Nguyễn Tiến Minh thua tuyển thủ giải nghệ của Thái Lan ở vòng đầu giải cầu lông quốc tế Maldives Future Series 2025.',
      image: '/images/news/tienminh.jpg',
      category: 'tournaments',
      date: '15/02/2025',
      source: '24h',
      url: 'https://www.24h.com.vn/the-thao/tien-minh-23-phut-huy-diet-doi-thu-dan-em-dai-thang-giai-quoc-te-c101a1086227.html'
    },
    {
      id: 7,
      title: 'Tập cầu lông thế nào để giảm cân?',
      summary: 'Cầu lông là môn thể thao giúp đốt cháy nhiều calo, tăng cường sức khỏe tim mạch và phát triển cơ bắp, nhưng người tập cần điều chỉnh chế độ ăn uống để giảm cân hiệu quả.',
      image: '/images/news/giamcan.avif',
      category: 'health',
      date: '10/02/2025',
      source: 'AIA',
      url: 'https://www.aia.com.vn/vi/song-khoe/loi-khuyen/tap-luyen/danh-cau-long-co-giam-can-khong.html'
    }
  ];

  const filterNewsByCategory = (category) => {
    setActiveCategory(category);
  };

  const filteredNews = activeCategory === 'all' 
    ? newsData 
    : newsData.filter(item => item.category === activeCategory);

  const getCategoryName = (category) => {
    switch(category) {
      case 'tournaments': return 'Giải đấu';
      case 'venues': return 'Sân cầu lông';
      case 'tips': return 'Kỹ thuật';
      case 'equipment': return 'Dụng cụ';
      case 'health': return 'Sức khỏe';
      case 'app': return 'Ứng dụng';
      default: return 'Tin tức';
    }
  };

  return (
    <>
    < Header/>
    <div className="news-categories-wrapper"></div>
    <div className="news-page">
      <div className="news-content container">
        <div className="news-categories">
          <button 
            className={activeCategory === 'all' ? 'active' : ''} 
            onClick={() => filterNewsByCategory('all')}
          >
            Tất cả
          </button>
          <button 
            className={activeCategory === 'tournaments' ? 'active' : ''} 
            onClick={() => filterNewsByCategory('tournaments')}
          >
            Giải đấu
          </button>
          <button 
            className={activeCategory === 'health' ? 'active' : ''} 
            onClick={() => filterNewsByCategory('health')}
          >
            Sức khỏe
          </button>
        </div>

        <div className="news-list">
          {filteredNews.map(item => (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="news-item" 
              key={item.id}
            >
              <div className="news-item-image">
                <img src={item.image} alt={item.title} />
                <div className="news-source">{item.source}</div>
              </div>
              <div className="news-item-content">
                <h3 className="news-title">{item.title}</h3>
                <p className="news-summary">{item.summary}</p>
                <div className="news-meta">
                  <span className="news-category">{getCategoryName(item.category)}</span>
                  <span className="news-date">{item.date}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
    < Footer/>
    </>
  );
};

export default News;



