// src/view/User/OrderManager.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, deleteOrder } from "../../api";
import Session from "../../Session/session";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);

  const user = Session.getUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setDisplayedOrders(orders.slice(0, visibleCount));
  }, [orders, visibleCount]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await getAllOrders();
      
      const userOrders = allOrders
        .filter(order => order.account_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(userOrders);
    } catch (err) {
      setError("Lỗi khi tải danh sách đơn hàng");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      alert("Hủy đơn hàng thành công!");
      fetchOrders(); // Refresh danh sách
    } catch (err) {
      alert("Lỗi khi hủy đơn hàng: " + (err.message || "Vui lòng thử lại!"));
      console.error("Lỗi:", err);
    }
  };

  const loadMoreOrders = () => {
    setVisibleCount(prev => prev + 8);
  };

  const collapseOrders = () => {
    setVisibleCount(8);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipping': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'received': return 'Đã giao thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Kiểm tra trạng thái thanh toán (nếu đã nhận hàng và COD thì coi như đã thanh toán)
  const getPaymentStatus = (order) => {
    // Đã thanh toán qua VNPay (hoặc đã chọn VNPay)
    if (order.payment_method === 'vnpay') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    // Đã thanh toán (is_paid = 1) hoặc thanh toán qua bank
    if (order.is_paid || order.payment_method === 'bank') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    // COD và đã nhận hàng
    if (order.status === 'received' && order.payment_method === 'cod') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    return { text: 'Chưa TT', color: 'text-red-600', canView: false };
  };

  // Hàm lấy thông tin ngân hàng từ payment_info
  const getBankCode = (order) => {
    if ((order.payment_method !== 'bank' && order.payment_method !== 'vnpay') || !order.payment_info) {
      return null;
    }
    try {
      const paymentInfo = JSON.parse(order.payment_info);
      return paymentInfo.bankCode || paymentInfo.vnpay_bank_code || null;
    } catch (error) {
      console.error('Error parsing payment_info:', error);
      return null;
    }
  };

  // Hàm xử lý đường dẫn hình ảnh
  const resolveImage = (img) => {
    if (!img) return '/images/placeholder.png';
    const trimmed = String(img).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  // Kiểm tra xem user có thể hủy đơn hàng không
  const canCancelOrder = (order) => {
    // Chỉ có thể hủy khi đơn hàng đang pending
    return order.status === 'pending';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedOrders.map((order) => {
              const paymentStatus = getPaymentStatus(order);
              const bankCode = getBankCode(order);
              return (
                <div key={order.id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  {/* Header đơn hàng */}
                  <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          Đơn hàng #{order.id}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        {Number(order.total_amount).toLocaleString()} ₫
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">
                          Ngày đặt: {formatDate(order.created_at)}
                        </span>
                        <span className={`text-xs ${paymentStatus.color}`}>
                          {paymentStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin giao hàng */}
                  <div className="bg-gray-50 px-3 py-2 border-t">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-600 truncate">
                        <strong>{order.name}</strong>
                      </p>
                      <p className="text-gray-500 truncate" title={order.address}>
                        {order.address}
                      </p>
                      <div className="flex justify-between text-gray-500">
                        <span>
                          {order.payment_method === 'cod' 
                            ? 'COD' 
                            : (order.payment_method === 'vnpay' 
                                ? (bankCode ? `Bank (VN Pay - ${bankCode})` : 'Bank (VN Pay)') 
                                : (bankCode ? `Bank (${bankCode})` : 'Bank'))}
                        </span>
                        <span className={paymentStatus.color}>
                          {paymentStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="px-3 py-2 bg-white border-t flex gap-2">
                    {/* Nút xem chi tiết - luôn hiển thị */}
                    <button
                      onClick={() => handleShowDetail(order)}
                      className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Xem chi tiết
                    </button>
                    
                    {/* Nút hủy đơn hàng - chỉ hiển thị khi pending */}
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex-1 bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút load more và thu gọn */}
          <div className="flex justify-center mt-6 gap-4">
            {visibleCount < orders.length && (
              <button
                onClick={loadMoreOrders}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>Xem thêm đơn hàng ({orders.length - visibleCount} đơn còn lại)</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            )}
            
            {visibleCount > 8 && (
              <button
                onClick={collapseOrders}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
                <span>Thu gọn</span>
              </button>
            )}
          </div>

          <div className="text-center text-gray-500 text-sm">
            Hiển thị {Math.min(visibleCount, orders.length)} trong tổng số {orders.length} đơn hàng
          </div>
        </>
      )}

      {/* Modal chi tiết đơn hàng */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng #{selectedOrder.id}</h3>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Thông tin đơn hàng */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Thông tin đơn hàng
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-semibold">#{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày đặt:</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thanh toán:</span>
                      <span className="font-medium">
                        {selectedOrder.payment_method === 'cod' 
                          ? 'COD (Tiền mặt)' 
                          : selectedOrder.payment_method === 'vnpay'
                          ? 'VNPay'
                          : 'Chuyển khoản'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái TT:</span>
                      <span className={`font-semibold ${getPaymentStatus(selectedOrder).color}`}>
                        {getPaymentStatus(selectedOrder).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin người nhận
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Họ tên:</span>
                      <p className="font-semibold text-gray-900">{selectedOrder.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Số điện thoại:</span>
                      <p className="font-medium text-gray-900">{selectedOrder.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Địa chỉ:</span>
                      <p className="font-medium text-gray-900">{selectedOrder.address}</p>
                    </div>
                    {selectedOrder.note && (
                      <div>
                        <span className="text-gray-600">Ghi chú:</span>
                        <p className="font-medium text-gray-900 italic">{selectedOrder.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Sản phẩm đã đặt ({selectedOrder.order_details?.length || 0} sản phẩm)
                </h4>
                
                {selectedOrder.order_details && selectedOrder.order_details.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.order_details.map((detail, index) => (
                      <div 
                        key={index} 
                        onClick={() => navigate(`/product/${detail.product_id}`)}
                        className="bg-gray-50 rounded-lg p-4 flex items-center gap-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer border border-transparent"
                      >
                        <div className="flex-shrink-0 w-20 h-20 bg-white rounded border border-gray-200 overflow-hidden">
                          <img 
                            src={resolveImage(detail.image)} 
                            alt={detail.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/placeholder.png';
                            }}
                          />
                        </div>
                        <div className="flex-grow">
                          <h5 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{detail.product_name}</h5>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Size: <span className="font-medium ml-1">{detail.size_name}</span>
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              Số lượng: <span className="font-medium ml-1">{detail.quantity}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Đơn giá</div>
                          <div className="font-semibold text-blue-600">
                            {Number(detail.price).toLocaleString()} ₫
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Thành tiền: <span className="font-semibold text-gray-700">
                              {(Number(detail.price) * detail.quantity).toLocaleString()} ₫
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có thông tin sản phẩm
                  </div>
                )}
              </div>

              {/* Tổng tiền */}
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Tổng tiền đơn hàng</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tổng cộng {selectedOrder.order_details?.reduce((sum, item) => sum + item.quantity, 0) || 0} sản phẩm
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {Number(selectedOrder.total_amount).toLocaleString()} ₫
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        (Đã bao gồm giảm giá)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCloseDetail}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}