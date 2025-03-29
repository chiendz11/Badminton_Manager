import React, { useState, useEffect } from 'react';
import { getInventories } from '../apis/inventoriesAPI.js';
import pic1 from '../image/pic1.jpg'; // Import ảnh nền

// Style cho container toàn màn hình với ảnh nền full màn hình
const containerStyle = {
  width: '100vw',
  height: '100vh',
  padding: '2rem',
  fontFamily: 'Arial, sans-serif',
  backgroundImage: `url(${pic1})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

// Khung chứa nội dung (sản phẩm và giỏ hàng), căn giữa màn hình
const productContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: '8px',
  padding: '2rem',
};

// Style cho tiêu đề
const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
  color: '#333',
};

// Style cho phần nội dung chính, chia làm 2 cột (sản phẩm và giỏ hàng)
const mainContentStyle = {
  display: 'flex',
  gap: '2rem',
};

// Style cho phần danh sách sản phẩm
const productListContainerStyle = {
  flex: 2,
};

const productListStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)', // 3 cột
  gap: '1rem',
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const productItemStyle = {
  border: '1px solid #ccc',
  borderRadius: '6px',
  padding: '1rem',
  backgroundColor: '#fff',
};

const productImageStyle = {
  width: '100%',
  height: '150px',      // Chiều cao cố định để ảnh hiển thị theo dạng ngang
  objectFit: 'cover',   // Cắt ảnh cho vừa khung
  marginBottom: '0.5rem',
};

// Style cho phân trang
const paginationStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '1rem',
  gap: '0.5rem',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #007bff',
  backgroundColor: '#007bff',
  color: '#fff',
};

// Style cho khung giỏ hàng
const cartContainerStyle = {
  flex: 1,
  backgroundColor: 'rgba(255,255,255,0.95)',
  padding: '1rem',
  borderRadius: '6px',
  boxShadow: '0 0 5px rgba(0,0,0,0.1)',
  maxHeight: '600px',
  overflowY: 'auto',
};

const cartListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const cartItemStyle = {
  borderBottom: '1px solid #ddd',
  paddingBottom: '1rem',
  marginBottom: '1rem',
};

// -------------------
//  Style cho modal
// -------------------
const modalOverlayStyle = {
  position: 'fixed',
  top: 0, 
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)', // overlay mờ
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  width: '90%',
  maxWidth: '400px',
  borderRadius: '8px',
  padding: '1rem',
};

// Form style gợi ý theo ảnh (xanh lá). Bạn có thể tuỳ chỉnh
const formContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const formTitleStyle = {
  backgroundColor: '#016e3d',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '4px',
  textAlign: 'center',
  marginBottom: '1rem',
};

const labelStyle = {
  fontWeight: 'bold',
  marginBottom: '0.25rem',
};

const selectStyle = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const inputStyle = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

// Nút "Tiếp tục"
const submitButtonStyle = {
  padding: '0.75rem',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#016e3d',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 'bold',
};

const Shop = () => {
  const [inventories, setInventories] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Hiển thị 9 sản phẩm mỗi trang (3 cột x 3 hàng)

  // State để quản lý việc hiển thị modal
  const [showModal, setShowModal] = useState(false);

  // State cho form thêm hàng (tối giản)
  const [stockCode, setStockCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [importType, setImportType] = useState('Đơn vị'); // Mặc định
  const [quantity, setQuantity] = useState(0);


  // Lấy dữ liệu sản phẩm khi component mount
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const data = await getInventories();
        setInventories(data);
      } catch (error) {
        console.error('Error fetching inventories:', error);
      }
    };
    fetchInventories();
  }, []);

  // Tính toán sản phẩm hiển thị theo trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = inventories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(inventories.length / itemsPerPage);

  // Hàm thêm sản phẩm vào giỏ hàng
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item._id === product._id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantityInCart: item.quantityInCart + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantityInCart: 1 }];
      }
    });
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng
  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  // Xử lý thanh toán
  const handleCheckout = () => {
    console.log('Checkout with cart:', cart);
    setCart([]);
  };

  // Mở modal
  const openModal = () => {
    setShowModal(true);
  };

  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Submit form trong modal
  const handleAddStock = (e) => {
    e.preventDefault();
    // Ở đây bạn có thể gọi API để thêm hàng, ví dụ addInventory(...)
    console.log('Đã nhập hàng:', {
      stockCode,
      supplier,
      serviceType,
      selectedItem,
      importType,
      quantity,
    });
    // Reset form
    setStockCode('');
    setSupplier('');
    setServiceType('');
    setSelectedItem('');
    setImportType('Đơn vị');
    setQuantity(0);
    // Đóng modal
    closeModal();
  };

  return (
    <div style={containerStyle}>
      <div style={productContainerStyle}>
        {/* Phần tiêu đề + nút Thêm hàng */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={headerStyle}>Shop</h1>
          <button
            style={buttonStyle}
            onClick={openModal}
          >
            Thêm hàng
          </button>
        </div>

        <div style={mainContentStyle}>
          {/* Phần danh sách sản phẩm */}
          <div style={productListContainerStyle}>
            {currentItems.length === 0 ? (
              <p>No products available.</p>
            ) : (
              <ul style={productListStyle}>
                {currentItems.map((product) => (
                  <li key={product._id} style={productItemStyle}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={productImageStyle}
                    />
                    <h3>{product.name}</h3>
                    <p>Category: {product.category}</p>
                    <p>Supplier: {product.supplier}</p>
                    <p>Stock: {product.quantity}</p>
                  
                    <p>
                      Price:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(product.price)}
                    </p>
                    <button
                      style={buttonStyle}
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to cart
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Phân trang */}
            {totalPages > 1 && (
              <div style={paginationStyle}>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    style={{
                      ...buttonStyle,
                      backgroundColor: currentPage === page ? '#0056b3' : '#007bff',
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phần giỏ hàng */}
          <div style={cartContainerStyle}>
            <h2>Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul style={cartListStyle}>
                {cart.map((item) => (
                  <li key={item._id} style={cartItemStyle}>
                    <h3>{item.name}</h3>
                    <p>Quantity: {item.quantityInCart}</p>
                    <p>
                      Subtotal:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(item.quantityInCart * item.price)}
                    </p>
                    <button
                      style={buttonStyle}
                      onClick={() => handleRemoveFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {cart.length > 0 && (
              <button
                style={{ ...buttonStyle, marginTop: '1rem' }}
                onClick={handleCheckout}
              >
                Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal (hiện khi showModal = true) */}
      {showModal && (
  <div style={modalOverlayStyle} onClick={closeModal}>
    {/* Ngăn chặn sự kiện click nổi bọt để không đóng modal khi click bên trong */}
    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
      {/* Tiêu đề modal */}
      <div style={formTitleStyle}>Thêm hàng nhập</div>

      <form onSubmit={handleAddStock} style={formContainerStyle}>
        {/* Mã nhập hàng */}
        <div>
          <label style={labelStyle}>Nhập/Quét mã nhập hàng</label>
          <input
            type="text"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value)}
            style={inputStyle}
            placeholder="Nhập mã..."
          />
        </div>

        {/* Nhà cung cấp (cho phép gõ hoặc chọn gợi ý) */}
        <div>
          <label style={labelStyle}>Nhà cung cấp</label>
          <input
            type="text"
            list="suppliersList"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            style={inputStyle}
            placeholder="Nhập hoặc chọn..."
          />
          <datalist id="suppliersList">
            <option value="PepsiCo Vietnam" />
            <option value="Suntory PepsiCo" />
            <option value="Vinamilk" />
            {/* Thêm nhà cung cấp khác nếu muốn */}
          </datalist>
        </div>

        {/* Loại dịch vụ (cho phép gõ hoặc chọn gợi ý) */}
        <div>
          <label style={labelStyle}>Loại dịch vụ</label>
          <input
            type="text"
            list="servicesList"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            style={inputStyle}
            placeholder="Nhập hoặc chọn..."
          />
          <datalist id="servicesList">
            <option value="Nước giải khát" />
            <option value="Cầu lông" />
            <option value="Bóng đá" />
            {/* Thêm dịch vụ khác nếu muốn */}
          </datalist>
        </div>

        {/* Chọn một hàng (cho phép gõ hoặc chọn gợi ý) */}
        <div>
          <label style={labelStyle}>Chọn một hàng</label>
          <input
            type="text"
            list="itemsList"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            style={inputStyle}
            placeholder="Nhập hoặc chọn..."
          />
          <datalist id="itemsList">
            <option value="Nước cam Twister" />
            <option value="Bia Heineken" />
            <option value="Sữa tươi Vinamilk" />
            {/* Thêm mặt hàng khác nếu muốn */}
          </datalist>
        </div>

        {/* Chọn kiểu nhập hàng */}
        <div>
          <label style={labelStyle}>Chọn kiểu nhập hàng</label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            style={selectStyle}
          >
            <option value="Đơn vị">Đơn vị</option>
            <option value="Thùng">Thùng</option>
            <option value="Kiện">Kiện</option>
          </select>
        </div>

        {/* Số lượng */}
        <div>
          <label style={labelStyle}>Số lượng</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
            placeholder="Nhập số lượng..."
          />
        </div>

        <button type="submit" style={submitButtonStyle}>
          Tiếp tục
        </button>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default Shop;
