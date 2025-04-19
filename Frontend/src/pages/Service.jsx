import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Search, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import '../styles/service.css';
import CoinFlip from '../pages/CoinFlip';

const RacketCarousel = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [animationState, setAnimationState] = useState('running');

  const showCard = (index) => {
    setActiveCard(index);
    setAnimationState('paused');
  };

  const closeModal = () => {
    setActiveCard(null);
    setAnimationState('running');
  };

  // Mảng hình ảnh cho carousel
  const images = [
    '/images/racket/vot1.jpg',
    '/images/racket/vot2.webp',
    '/images/racket/vot3.jpg',
    '/images/racket/vot4.jpg',
    '/images/racket/vot5.webp',
    '/images/racket/vot6.jpg',
    '/images/racket/vot7.jpg',
    '/images/racket/vot8.jpg',
    '/images/racket/vot9.webp',
    '/images/racket/vot10.webp'
  ];

  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="racket-carousel-container" style={{ padding: '30px 0', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', color: '#2e7d32' }}>
        Bộ sưu tập vợt cầu lông
      </h3>
      
      <div className="wrapper" style={{ 
        height: '400px', 
        position: 'relative',
        marginBottom: '30px'
         }}>
        <div 
          className="inner" 
          style={{ 
            animation: `rotating 20s linear infinite`,
            animationPlayState: animationState
          }}
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="card"
              style={{ 
                '--index': index,
                '--color-card': `${142 + (index * 10)}, ${249 - (index * 10)}, ${252 - (index * 20)}`,
                position: 'absolute',
                borderRadius: '12px',
                overflow: 'hidden',
                inset: '0',
                transform: `rotateY(calc((360deg / 10) * ${index})) translateZ(250px)`,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: `rgba(${142 + (index * 10)}, ${249 - (index * 10)}, ${252 - (index * 20)}, 1)`
              }}
              onClick={() => showCard(index)}
            >
              <div 
                className="img" 
                style={{ 
                  width: '100%',
                  height: '100%',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundImage: images[index] ? `url(${images[index]})` : 'none',
                  backgroundColor: images[index] ? 'transparent' : `rgba(${142 + (index * 10)}, ${249 - (index * 10)}, ${252 - (index * 20)}, 0.3)`
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal overlay */}
      {activeCard !== null && (
        <>
          <div 
            className="modal-overlay" 
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: '900',
              display: 'block'
            }}
            onClick={closeModal}
          />
          
          <div 
            className="card active"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '300px',
              height: '450px',
              zIndex: '999',
              transform: 'translate(-50%, -50%) rotateX(0deg) rotateY(0deg)',
              transition: 'all 0.4s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid',
              borderColor: `rgba(${142 + (activeCard * 10)}, ${249 - (activeCard * 10)}, ${252 - (activeCard * 20)}, 1)`
            }}
          >
            <div 
              className="img" 
              style={{ 
                width: '100%',
                height: '100%',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundImage: images[activeCard] ? `url(${images[activeCard]})` : 'none',
                backgroundColor: images[activeCard] ? 'transparent' : `rgba(${142 + (activeCard * 10)}, ${249 - (activeCard * 10)}, ${252 - (activeCard * 20)}, 0.3)`
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

const Service = () => {
  const calculateEndDate = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 100); 
    return endDate;
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const endDate = calculateEndDate();
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = endDate - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    };
    
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (number) => {
    return number < 10 ? `0${number}` : number;
  };

  const categories = [
    { id: 'all', name: 'Tất cả sản phẩm', icon: '📦' },
    { id: 'drink', name: 'Đồ uống', icon: '🥤' },
    { id: 'shuttlecock', name: 'Hộp cầu', icon: '/images/cau.png' },
    { id: 'racket', name: 'Vợt cầu lông', icon: '🏸' },
    { id: 'shoes', name: 'Giày cầu lông', icon: '👟' }
  ];

  const products = [
    {
      id: 1,
      name: 'Hộp Cầu Lông Yonex AS-30',
      category: 'shuttlecock',
      price: 450000,
      image: '/images/shuttlecocks/shuttlecock1.webp',
      description: 'Cầu lông cao cấp Yonex AS-30, 12 quả/hộp, độ bền cao, phù hợp thi đấu',
      available: true
    },
    {
      id: 2,
      name: 'Nước khoáng Lavie 500ml',
      category: 'drink',
      price: 10000,
      image: '/images/drinks/drink1.jpg',
      description: 'Nước khoáng thiên nhiên, giải khát nhanh chóng sau khi tập luyện',
      available: true
    },
    {
      id: 3,
      name: 'Vợt Cầu Lông Lining N90IV',
      category: 'racket',
      price: 150000,
      image: '/images/racket/vot10.webp',
      description: 'Vợt cầu lông cao cấp, công nghệ mới nhất, phù hợp với người chơi chuyên nghiệp',
      available: true
    },
    {
      id: 4,
      name: 'Nước tăng lực Redbull',
      category: 'drink',
      price: 25000,
      image: '/images/drinks/drink2.jpg',
      description: 'Nước tăng lực, giúp bổ sung năng lượng tức thì khi chơi thể thao',
      available: true
    },
    {
      id: 5,
      name: 'Hộp Cầu Lông Victor Gold',
      category: 'shuttlecock',
      price: 380000,
      image: '/images/shuttlecocks/shuttlecock2.jpeg',
      description: 'Cầu lông Victor Gold Champion, 12 quả/hộp, chất lượng cao',
      available: true
    },
    {
      id: 6,
      name: 'Vợt Cầu Lông Yonex Astrox 88D',
      category: 'racket',
      price: 420000,
      image: '/images/racket/vot1.jpg',
      description: 'Vợt cầu lông cao cấp, siêu nhẹ, phù hợp tấn công, lực đánh mạnh',
      available: true
    },
    {
      id: 7,
      name: 'Giày Cầu Lông Yonex Power Cushion',
      category: 'shoes',
      price: 250000,
      image: '/images/shoes/s1.jpeg',
      description: 'Giày cầu lông chuyên nghiệp, độ bám tốt, giảm chấn hiệu quả',
      available: true
    },
    {
      id: 8,
      name: 'Chanh muối',
      category: 'drink',
      price: 12000,
      image: '/images/drinks/drink3.jpeg',
      description: 'Chanh muối đóng chai, giải khát, bổ sung vitamin C',
      available: true
    },
    {
      id: 9,
      name: 'Giày Cầu Lông Lining Cloud',
      category: 'shoes',
      price: 180000,
      image: '/images/shoes/s2.webp',
      description: 'Giày cầu lông nhẹ, thoáng khí, phù hợp với mọi kiểu di chuyển',
      available: true
    },
    {
      id: 10,
      name: 'Hộp Cầu Lông Kawasaki S7',
      category: 'shuttlecock',
      price: 280000,
      image: '/images/shuttlecocks/shuttlecock3.jpg',
      description: 'Cầu lông Kawasaki S7, 12 quả/hộp, giá tốt cho người mới chơi',
      available: true
    },
    {
        id: 11,
        name: 'Vợt Cầu Lông Victor Jetspeed S10',
        category: 'racket',
        price: 185000,
        image: '/images/racket/vot2.webp',
        description: 'Vợt cầu lông Victor Jetspeed, cân bằng hoàn hảo, phù hợp lối chơi tấn công linh hoạt',
        available: true
      },
      {
        id: 12,
        name: 'Vợt Cầu Lông Yonex Nanoflare 700',
        category: 'racket',
        price: 380000,
        image: '/images/racket/vot3.jpg',
        description: 'Vợt siêu nhẹ với công nghệ Nanoflare, tăng tốc độ đập cầu, dễ điều khiển',
        available: true
      },
      {
        id: 13,
        name: 'Vợt Cầu Lông Apacs Nano 900 Power',
        category: 'racket',
        price: 120000,
        image: '/images/racket/vot4.jpg',
        description: 'Vợt cầu lông khung carbon cao cấp, trọng lượng nhẹ, phù hợp cho người mới và trung cấp',
        available: true
      },
      {
        id: 14,
        name: 'Vợt Cầu Lông Lining Windstorm 74',
        category: 'racket',
        price: 210000,
        image: '/images/racket/vot5.webp',
        description: 'Thiết kế khí động học, tăng tốc độ vung vợt, lực đánh mạnh mẽ',
        available: true
      },
      {
        id: 15,
        name: 'Vợt Cầu Lông Mizuno JPX 900',
        category: 'racket',
        price: 195000,
        image: '/images/racket/vot6.jpg',
        description: 'Vợt cầu lông chuyên nghiệp, kết cấu chắc chắn, phù hợp lối chơi phòng thủ',
        available: true
      },
      {
        id: 16,
        name: 'Vợt Cầu Lông Fleet Volitant Force',
        category: 'racket',
        price: 165000,
        image: '/images/racket/vot7.jpg',
        description: 'Vợt cầu lông chất lượng cao từ Fleet, khung vợt dẻo, tăng độ nảy và kiểm soát cầu',
        available: true
      },
      {
        id: 17,
        name: 'Vợt Cầu Lông Yonex Duora 10',
        category: 'racket',
        price: 340000,
        image: '/images/racket/vot8.jpg',
        description: 'Công nghệ hai mặt đánh khác nhau, một mặt tấn công mạnh mẽ, một mặt kiểm soát tốt',
        available: true
      },
      {
        id: 18,
        name: 'Vợt Cầu Lông Yonex 99D',
        category: 'racket',
        price: 380000,
        image: '/images/racket/vot9.webp',
        description: 'Vợt cầu lông chất lượng cao từ Fleet, khung vợt dẻo',
        available: true
      }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([
    { 
      id: 1, 
      name: 'Hộp Cầu Lông Yonex AS-30', 
      price: 450000, 
      quantity: 1, 
      image: '/images/products/shuttlecock-1.jpg' 
    },
    { 
      id: 4, 
      name: 'Nước tăng lực Redbull', 
      price: 25000, 
      quantity: 2, 
      image: '/images/products/drink-2.jpg' 
    }
  ]);

  useEffect(() => {
    let results = products;
    
    if (selectedCategory !== 'all') {
      results = results.filter(product => product.category === selectedCategory);
    }
    
    if (searchTerm) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(results);
  }, [selectedCategory, searchTerm]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image
      }]);
    }
    
    setCartOpen(true);
  };

  const updateQuantity = (id, amount) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + amount;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', 'đ');
  };

  return (
    <>
      <Header />
      <div className="service-page">
        <div className="promotion-banner">
          <div className="container">
            <div className="promotion-content">
              <div className="promotion-info">
                <h1>Dịch Vụ & Sản Phẩm</h1>
                <p>Cung cấp các sản phẩm và dịch vụ thuê chất lượng cao cho người chơi cầu lông</p>
                <div className="discount-badge">Giảm giá lên đến 50%</div>
              </div>
              
              {cartOpen && <CoinFlip />}
              
              <div className="countdown-container">
                <h3 
                  style={{
                    color: '#e50914',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    fontSize: '1.3rem',
                    letterSpacing: '1px',
                    textShadow: '2px 2px 6px rgba(0, 0, 0, 0.4)',
                    marginBottom: '10px'
                  }}
                >
                  Ưu đãi kết thúc sau:
                </h3>
                <div className="countdown-timer">
                  <div className="countdown-item">
                    <div className="countdown-digit">{formatNumber(timeLeft.days)}</div>
                    <div className="countdown-label">Ngày</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-digit">{formatNumber(timeLeft.hours)}</div>
                    <div className="countdown-label">Giờ</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-digit">{formatNumber(timeLeft.minutes)}</div>
                    <div className="countdown-label">Phút</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-digit">{formatNumber(timeLeft.seconds)}</div>
                    <div className="countdown-label">Giây</div>
                  </div>
                </div>
                <button className="shop-now-btn">Mua ngay</button>
              </div>
            </div>
          </div>
          <div className="promotion-overlay"></div>
        </div>

        <div className="container service-container">
          {/* Thanh tìm kiếm và biểu tượng giỏ hàng */}
          <div className="search-cart-container">
            <div className="search-box">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="cart-icon-container">
              <button className="cart-button" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={22} />
                <span className="cart-count">{cart.length}</span>
              </button>
            </div>
          </div>

          {/* Layout chính */}
          <div className="service-layout">
            {/* Sidebar danh mục */}
            <div className="categories-sidebar">
              <h3>Danh mục sản phẩm</h3>
              <ul className="category-list">
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.icon.includes('/') ? (
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="category-icon"
                        />
                      ) : (
                        <span className="category-icon">{category.icon}</span>
                      )}
                      <span className="category-name">{category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="sidebar-promo">
                <h4>Ưu đãi đặc biệt</h4>
                <p>Giảm 50% cho đơn hàng trên 200 nghìn đồng</p>
                <button className="promo-button">Xem ngay</button>
              </div>
            </div>

            {/* Phần sản phẩm chính */}
            <div className="products-main">
              {/* Hiển thị carousel khi chọn danh mục Vợt cầu lông */}
              {selectedCategory === 'racket' && <RacketCarousel />}
              
              {selectedCategory === 'shoes' && (
              <div 
                style={{
                  backgroundColor: '#f0fdf4',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  borderLeft: '5px solid #34a853',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
               >
                <div style={{ fontSize: '1.5rem', color: '#34a853' }}></div>
                <div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    color: '#1b1b1b', 
                    lineHeight: '1.6' 
                  }}>
                    <strong style={{ color: '#2e7d32' }}>Lưu ý:</strong> Chúng tôi có đầy đủ các loại size giày từ <strong>36 đến 43</strong>. Bạn có thể đến chọn size phù hợp trược tiếp tại quày!
                  </p>
                </div>
              </div>
              )}

              {/* Hiển thị sản phẩm */}
              <div className="products-grid">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div className="product-card" key={product.id}>
                      <div className="product-image">
                        <img src={product.image || '/images/placeholder.jpg'} alt={product.name} />
                        <div className="product-overlay">
                          <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                            Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-category">{categories.find(c => c.id === product.category)?.name}</div>
                        <p className="product-description">{product.description}</p>
                        <div className="product-price">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-products">
                    <img src="/images/icons/empty-box.png" alt="Không có sản phẩm" />
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Giỏ hàng */}
      <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Giỏ hàng của bạn</h3>
          <button className="close-cart" onClick={() => setCartOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items">
          {cart.length > 0 ? (
            cart.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  <img src={item.image || '/images/placeholder.jpg'} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">{formatCurrency(item.price)}</p>
                  <div className="cart-item-quantity">
                    <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>
                      <Plus size={16} />
                    </button>
                    <button className="remove-item" onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <img src="/images/icons/empty-cart.png" alt="Giỏ hàng trống" />
              <p>Giỏ hàng của bạn đang trống</p>
              <button className="continue-shopping" onClick={() => setCartOpen(false)}>
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button className="checkout-button">Thanh toán ngay</button>
            <button className="continue-shopping" onClick={() => setCartOpen(false)}>
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
      
      {/* Lớp phủ khi giỏ hàng mở */}
      {cartOpen && <div className="cart-overlay" onClick={() => setCartOpen(false)}></div>}
      
      <Footer />
    </>
  );
};

export default Service;