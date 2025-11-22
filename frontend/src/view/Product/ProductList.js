// src/view/Product/ProductList.js
import React, { useEffect, useState, useRef } from "react";
import { getAllProducts, deleteProduct, getAllCategories, getAllSizes, getAllProductSizes } from "../../api";
import { Link, useNavigate } from "react-router-dom";

// Session utility - định nghĩa trước để sử dụng trong component
const Session = {
  setUser(id, username, role = "user", email = "") {
    const user = { id, username, role, email };
    localStorage.setItem("user", JSON.stringify(user));
  },
  isLoggedIn() {
    return localStorage.getItem("user") !== null;
  },
  isAdmin() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role === "admin";
  },
  getUser() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.username ? user : null;
  },
  logout() {
    localStorage.removeItem("user");
  }
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [cartCount, setCartCount] = useState(0);

  const navigate = useNavigate();
  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  const fetchData = async () => {
    try {
      const [prodData, catData, sizesData, productSizesData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllSizes(),
        getAllProductSizes()
      ]);
      
      console.log('🔍 ProductSizes từ API:', productSizesData.slice(0, 3));
      console.log('🔍 Sample warehouse values:', productSizesData.slice(0, 5).map(ps => ({ id: ps.id, warehouse: ps.warehouse })));
      
      setProducts(prodData);
      setCategories(catData);
      setSizes(sizesData);
      setProductSizes(productSizesData);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("🗑️ Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Xóa sản phẩm thất bại:", err);
      }
    }
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const getAvailableSizes = (productId) => {
    const availableProductSizes = productSizes.filter(ps => ps.product_id === productId);
    const result = availableProductSizes.map(ps => {
      const size = sizes.find(s => s.id === ps.size_id);
      const stock = Number(ps.stock ?? 0);
      if (productId === 60) console.log(`🔍 Size ${size?.size} stock:`, ps.stock, '→', stock);
      return size ? { id: ps.id, size: size.size, stock } : null;
    }).filter(Boolean);
    return result;
  };

  const getStockForSize = (productId, sizeName) => {
    const match = productSizes.find(ps => ps.product_id === productId && (sizes.find(s => s.id === ps.size_id)?.size === sizeName));
    return Number(match?.stock ?? 0);
  };

  const handleAddToCart = (product, sizeOverride = null) => {
    const selectedSize = sizeOverride || selectedSizes[product.id];
    
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn size trước khi thêm vào giỏ hàng!");
      return;
    }

    const stock = getStockForSize(product.id, selectedSize);
    if (stock <= 0) {
      alert("❌ Size này đã hết hàng. Vui lòng chọn size khác.");
      return;
    }

    // Tính giá sau giảm
    const discount = Number(product.discount_percent || 0);
    const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      // Kiểm tra không vượt quá stock
      if (existingItem.quantity >= stock) {
        alert(`❌ Bạn đã thêm tối đa ${stock} sản phẩm size ${selectedSize} (đã hết trong kho)!`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        price: finalPrice, // Lưu giá đã giảm
        original_price: product.price, // Lưu giá gốc để tham khảo
        discount_percent: discount,
        size: selectedSize,
        quantity: 1 
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(`🛒 Đã thêm "${product.name}" (Size: ${selectedSize}) vào giỏ hàng!`);
  };

  const handleLogout = () => {
    Session.logout();
    window.location.reload();
  };

  const handleSearch = (term) => {
    setSearchName(term);
    setIsSearching(term.trim() !== "");
  };

  const handleImageClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchName.toLowerCase());
    
    // Lọc theo khoảng giá
    const discount = Number(p.discount_percent || 0);
    const finalPrice = discount > 0 ? p.price * (1 - discount / 100) : p.price;
    const matchesPrice = finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    
    // Lọc theo danh mục
    const matchesCategory = selectedCategory === "all" || p.category_id === Number(selectedCategory);
    
    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    const discountA = Number(a.discount_percent || 0);
    const discountB = Number(b.discount_percent || 0);
    const priceA = discountA > 0 ? a.price * (1 - discountA / 100) : a.price;
    const priceB = discountB > 0 ? b.price * (1 - discountB / 100) : b.price;
    
    if (sortOrder === "price-asc") return priceA - priceB;
    if (sortOrder === "price-desc") return priceB - priceA;
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    return 0; // default
  });

  // Featured products: those having discount_percent > 0
  const featuredProducts = filteredProducts.filter((p) => Number(p.discount_percent || 0) > 0);

  // Phân loại sản phẩm theo danh mục - chỉ lấy từ category_id
  const categorizedProducts = categories.map((cat) => {
    const catProducts = filteredProducts.filter((p) => p.category_id === cat.id);
    return { ...cat, products: catProducts };
  }).filter(cat => cat.products.length > 0); // Chỉ giữ category có sản phẩm

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products}
        onSearch={handleSearch}
        cartCount={cartCount}
      />

      {/* Add custom scrollbar hide style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* Main content wrapper */}
      <div className="flex gap-6 mt-20">
        {/* Right Content Area - Full width */}
        <div className="flex-1 px-4">
          {/* Video Banner */}
          <div className="relative w-full h-64 sm:h-80 lg:h-[400px] overflow-hidden mb-4 rounded-lg">
            <video
              src="https://media3.coolmate.me/uploads/videos/banner_chaybo_coolfast.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <h1 className="text-white text-3xl sm:text-5xl font-bold uppercase tracking-wide text-center">
                Khám phá sản phẩm mới
              </h1>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-10 flex justify-end">
              <button
                onClick={() => navigate("/add", { state: { returnTo: "/" } })}
                className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
              >
                ➕ Thêm sản phẩm
              </button>
            </div>
          )}

          {/* Hàng đầu: Sản phẩm nổi bật (khuyến mãi) */}
          <div className="pb-20 space-y-10">
        {featuredProducts.length > 0 && (
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold uppercase">Sản phẩm nổi bật</h2>
            </div>

            <div className="relative overflow-hidden">
              {featuredProducts.length > 4 && (
                <button
                  onClick={() => {
                    const container = document.getElementById('category-featured');
                    if (!container) return;
                    const row = container.querySelector('.product-row');
                    const firstItem = row && row.children && row.children[0];
                    if (!row || !firstItem) return;
                    const styles = getComputedStyle(row);
                    const gapRaw = styles.columnGap || styles.gap || '0';
                    const gap = parseFloat(gapRaw) || 0;
                    const itemWidth = firstItem.getBoundingClientRect().width + gap;
                    const total = row.children.length;
                    const maxStart = Math.max(0, total - 4);
                    const currentIndex = Math.round(container.scrollLeft / itemWidth);
                    const prevIndex = Math.max(0, Math.min(maxStart, currentIndex - 1));
                    container.scrollTo({ left: Math.round(prevIndex * itemWidth), behavior: 'smooth' });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {featuredProducts.length > 4 && (
                <button
                  onClick={() => {
                    const container = document.getElementById('category-featured');
                    if (!container) return;
                    const row = container.querySelector('.product-row');
                    const firstItem = row && row.children && row.children[0];
                    if (!row || !firstItem) return;
                    const styles = getComputedStyle(row);
                    const gapRaw = styles.columnGap || styles.gap || '0';
                    const gap = parseFloat(gapRaw) || 0;
                    const itemWidth = firstItem.getBoundingClientRect().width + gap;
                    const total = row.children.length;
                    const maxStart = Math.max(0, total - 4);
                    const currentIndex = Math.round(container.scrollLeft / itemWidth);
                    const nextIndex = Math.min(maxStart, currentIndex + 1);
                    container.scrollTo({ left: Math.round(nextIndex * itemWidth), behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              <div 
                id={`category-featured`}
                className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth snap-x snap-mandatory"
                style={{ maxWidth: '1048px' }}
              >
                <div className="product-row flex gap-2" style={{ width: 'max-content' }}>
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="w-64 flex-shrink-0 snap-start">
                      <ProductCard
                        product={product}
                        availableSizes={getAvailableSizes(product.id)}
                        selectedSize={selectedSizes[product.id]}
                        onSizeSelect={handleSizeSelect}
                        handleAddToCart={handleAddToCart}
                        handleDelete={handleDelete}
                        handleImageClick={handleImageClick}
                        isAdmin={isAdmin}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Khi đang tìm kiếm, hiển thị theo danh mục */}
        {isSearching && (
          <h2 className="text-3xl font-bold mb-6">
            Kết quả tìm kiếm cho "{searchName}"
          </h2>
        )}

        {categorizedProducts.map(
          (cat) =>
            cat.products.length > 0 && (
              <div key={cat.id} className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold uppercase">{cat.name}</h2>
                  <Link to={`/category/${cat.id}`} className="text-sm text-blue-600 hover:underline">
                    Xem thêm
                  </Link>
                </div>
                
                {/* Horizontal scrollable product list with arrows */}
                <div className="relative overflow-hidden">
                  {/* Left arrow */}
                  {cat.products.length > 4 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`category-${cat.id}`);
                        if (!container) return;
                        const row = container.querySelector('.product-row');
                        const firstItem = row && row.children && row.children[0];
                        if (!row || !firstItem) return;
                        const styles = getComputedStyle(row);
                        const gapRaw = styles.columnGap || styles.gap || '0';
                        const gap = parseFloat(gapRaw) || 0;
                        const itemWidth = firstItem.getBoundingClientRect().width + gap;
                        const total = row.children.length;
                        const maxStart = Math.max(0, total - 4);
                        const currentIndex = Math.round(container.scrollLeft / itemWidth);
                        const prevIndex = Math.max(0, Math.min(maxStart, currentIndex - 1));
                        container.scrollTo({ left: Math.round(prevIndex * itemWidth), behavior: 'smooth' });
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Right arrow */}
                  {cat.products.length > 4 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`category-${cat.id}`);
                        if (!container) return;
                        const row = container.querySelector('.product-row');
                        const firstItem = row && row.children && row.children[0];
                        if (!row || !firstItem) return;
                        const styles = getComputedStyle(row);
                        const gapRaw = styles.columnGap || styles.gap || '0';
                        const gap = parseFloat(gapRaw) || 0;
                        const itemWidth = firstItem.getBoundingClientRect().width + gap;
                        const total = row.children.length;
                        const maxStart = Math.max(0, total - 4);
                        const currentIndex = Math.round(container.scrollLeft / itemWidth);
                        const nextIndex = Math.min(maxStart, currentIndex + 1);
                        container.scrollTo({ left: Math.round(nextIndex * itemWidth), behavior: 'smooth' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  <div 
                    id={`category-${cat.id}`}
                    className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth snap-x snap-mandatory"
                    style={{ maxWidth: '1048px' }}
                  >
                    <div className="product-row flex gap-2" style={{ width: 'max-content' }}>
                      {cat.products.map((product) => (
                        <div key={product.id} className="w-64 flex-shrink-0 snap-start">
                          <ProductCard
                            product={product}
                            availableSizes={getAvailableSizes(product.id)}
                            selectedSize={selectedSizes[product.id]}
                            onSizeSelect={handleSizeSelect}
                            handleAddToCart={handleAddToCart}
                            handleDelete={handleDelete}
                            handleImageClick={handleImageClick}
                            isAdmin={isAdmin}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
        )}

        {/* Nếu không tìm thấy sản phẩm */}
        {isSearching &&
          filteredProducts.length === 0 && (
            <p className="text-gray-500 text-lg text-center py-10">
              🛒 Không tìm thấy sản phẩm nào.
            </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Resolve image URL for products:
// - If image is an absolute URL (http/https) -> keep it
// - If image starts with '/' -> treat as absolute path
// - Otherwise, assume it's stored in frontend's `public/images` and prefix `/images/`
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png'; // optional fallback
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return encodeURI(trimmed);
  return `/images/${encodeURI(trimmed)}`;
};

/* Header component */
function Header({ user, handleLogout, products = [], onSearch, cartCount = 0 }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef();
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = products
      .filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6);
    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (name) => {
    setSearchTerm(name);
    setSuggestions([]);
    if (onSearch) onSearch(name);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (onSearch) onSearch(searchTerm);
    }
  };

  const handleLogoClick = () => {
    setSearchTerm("");
    if (onSearch) onSearch("");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <span
            onClick={handleLogoClick}
            className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-wide cursor-pointer"
          >
            CoolShop
          </span>
        </div>

        <div className="relative w-1/2 sm:w-2/5 md:w-1/2" ref={searchRef}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 z-50 max-h-64 overflow-y-auto">
              {suggestions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectSuggestion(p.name)}
                >
                  <img
                    src={resolveImage(p.image)}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 text-sm text-left">
                    <p className="truncate">{p.name}</p>
                    {(() => {
                      const price = Number(p.price || 0);
                      const discount = Number(p.discount_percent || 0);
                      const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
                      return (
                        <div className="flex items-baseline gap-2">
                          <span className={`${discount > 0 ? 'text-red-600 font-semibold' : 'text-gray-900 font-normal'}`}>
                            {Math.round(finalPrice).toLocaleString()} đ
                          </span>
                          {discount > 0 && (
                            <>
                              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-semibold">-{discount}%</span>
                              <span className="text-gray-400 line-through text-xs">{Math.round(price).toLocaleString()} đ</span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-5 text-gray-700 font-medium">
          <Link to="/cart" className="relative hover:text-yellow-500 transition">
            🛒 Giỏ hàng
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {user?.username ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 hover:text-blue-500 transition font-medium"
              >
                Xin chào,<span>{user.username}</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md py-2 z-[9999] text-left">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                    >
                      🛠 Thông tin tài khoản quản trị viên
                    </Link>
                  )}
                  {user.role === "user" && (
                    <Link
                      to="/user"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                    >
                      👤 Thông tin tài khoản người dùng
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-red-600"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-500 transition">
                Login
              </Link>
              <Link to="/register" className="hover:text-green-500 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const ProductCard = ({ 
  product, 
  availableSizes, 
  selectedSize, 
  onSizeSelect, 
  handleAddToCart, 
  handleDelete, 
  handleImageClick, 
  isAdmin 
}) => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const price = Number(product.price || 0);
  const discount = Number(product.discount_percent || 0);
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div 
        className="relative overflow-hidden aspect-square cursor-pointer group group/image"
        onClick={() => handleImageClick(product.id)}
        onMouseEnter={() => setOverlayOpen(true)}
        onMouseLeave={() => setOverlayOpen(false)}
        onTouchStart={(e) => {
          e.stopPropagation();
          setOverlayOpen((v) => !v);
        }}
      >
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          className="peer w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover/image:scale-105"
        />
        <div
          className={`absolute inset-x-2 bottom-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500/90 text-white shadow-xl p-3 transition-all duration-300 ease-out z-10 backdrop-blur-sm pointer-events-auto ${overlayOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} group-hover/image:opacity-100 group-hover/image:translate-y-0`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
            <span>Chọn size</span>
          </div>
          {availableSizes.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sizeObj) => {
                  const out = Number(sizeObj.stock) <= 0;
                  const isSelected = selectedSize === sizeObj.size;
                  return (
                    <button
                      key={sizeObj.id}
                      className={`px-3 py-1 text-[11px] rounded-full shadow-sm border transition ${
                        out 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                          : isSelected
                            ? 'bg-yellow-400 text-gray-900 border-yellow-500 font-bold'
                            : 'bg-white text-gray-900 hover:shadow hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (out) return;
                        onSizeSelect(product.id, sizeObj.size);
                      }}
                      aria-disabled={out}
                      title={out ? 'Hết hàng' : `Còn ${sizeObj.stock}`}
                    >
                      {sizeObj.size}
                    </button>
                  );
                })}
              </div>
              {selectedSize && (
                <button
                  className="w-full bg-white text-indigo-600 font-semibold text-xs py-2 rounded-full hover:bg-gray-100 transition shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  ➕ Thêm vào giỏ hàng
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-white/90">Chưa có size khả dụng</div>
          )}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 leading-tight h-10"
            onClick={() => handleImageClick(product.id)}
          >
            {product.name}
          </h3>
          <div className="mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-base ${discount > 0 ? 'font-extrabold text-red-600' : 'font-normal text-gray-900'}`}>
                {Math.round(finalPrice).toLocaleString()}đ
              </span>
              {discount > 0 && (
                <>
                  <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    -{Number.isFinite(discount) ? discount : 0}%
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {Math.round(price).toLocaleString()}đ
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <Link
              to={`/edit/${product.id}`}
              className="flex-1 text-center text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-full hover:bg-blue-600 transition"
            >
              Sửa
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product.id);
              }}
              className="flex-1 text-center text-xs font-medium text-white bg-red-500 px-3 py-1.5 rounded-full hover:bg-red-600 transition"
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};