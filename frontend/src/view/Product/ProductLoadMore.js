// src/view/Product/ProductLoadMore.js
import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getAllProducts, getAllCategories, getAllSizes, getAllProductSizes, deleteProduct } from "../../api";

// Session utility
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

export default function ProductLoadMore() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(8);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [sortOrder, setSortOrder] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");

  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, [categoryId]);

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
      
      setProducts(prodData);
      setSizes(sizesData);
      setProductSizes(productSizesData);
      
      const currentCategory = catData.find(c => c.id === Number(categoryId));
      setCategory(currentCategory);
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
      return size ? { ...size, stock } : null;
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

    const discount = Number(product.discount_percent || 0);
    const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        alert(`❌ Bạn đã thêm tối đa ${stock} sản phẩm size ${selectedSize} (đã hết trong kho)!`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        price: finalPrice,
        original_price: product.price,
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

  const handleImageClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Lọc sản phẩm theo category và các bộ lọc khác
  const filteredProducts = products.filter((p) => {
    const matchesCategory = p.category_id === Number(categoryId);
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const discount = Number(p.discount_percent || 0);
    const finalPrice = discount > 0 ? p.price * (1 - discount / 100) : p.price;
    const matchesPrice = finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    
    return matchesCategory && matchesSearch && matchesPrice;
  }).sort((a, b) => {
    const discountA = Number(a.discount_percent || 0);
    const discountB = Number(b.discount_percent || 0);
    const priceA = discountA > 0 ? a.price * (1 - discountA / 100) : a.price;
    const priceB = discountB > 0 ? b.price * (1 - discountB / 100) : b.price;
    
    if (sortOrder === "price-asc") return priceA - priceB;
    if (sortOrder === "price-desc") return priceB - priceA;
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleCollapse = () => {
    setVisibleCount(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products.filter(p => p.category_id === Number(categoryId))}
        onSearch={setSearchTerm}
        cartCount={cartCount}
      />

      <style>{`
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

      <div className="flex gap-6 mt-20">
        {/* Right Content Area - Full width */}
        <div className="flex-1 px-4 pb-10">
          <div className="max-w-7xl mx-auto">
            {/* Category Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category?.name || "Đang tải..."}
              </h1>
              <p className="text-gray-600">
                Hiển thị {visibleProducts.length} / {filteredProducts.length} sản phẩm
              </p>
            </div>

            {isAdmin && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => navigate("/add", { state: { returnTo: `/category/${categoryId}` } })}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
                >
                  ➕ Thêm sản phẩm
                </button>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryId={categoryId}
                      availableSizes={getAvailableSizes(product.id)}
                      selectedSize={selectedSizes[product.id]}
                      onSizeSelect={handleSizeSelect}
                      handleAddToCart={handleAddToCart}
                      handleDelete={handleDelete}
                      handleImageClick={handleImageClick}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition font-medium shadow-lg"
                    >
                      Xem thêm sản phẩm ▼
                    </button>
                  </div>
                )}

                {/* Collapse Button */}
                {visibleCount > 8 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleCollapse}
                      className="bg-gray-600 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition font-medium shadow-lg"
                    >
                      Thu gọn ▲
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  🛒 Không tìm thấy sản phẩm nào trong danh mục này.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Resolve image URL
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png';
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
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
                    🚺 Đăng xuất
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

// ProductCard component
const ProductCard = ({ 
  product,
  categoryId,
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
                  const isSelected = selectedSize === sizeObj.size;
                  const isOutOfStock = sizeObj.stock <= 0;
                  return (
                    <button
                      key={sizeObj.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) {
                          onSizeSelect(product.id, sizeObj.size);
                        }
                      }}
                      disabled={isOutOfStock}
                      className={`text-[11px] font-semibold px-3 py-1 rounded-full transition ${
                        isOutOfStock
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-white text-indigo-600 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
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
                    handleAddToCart(product, selectedSize);
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
              state={{ returnTo: `/category/${categoryId}` }}
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
