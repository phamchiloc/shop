// src/view/Cart/OrderSuccess.jsx
import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Session from "../../Session/session";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, orderData } = location.state || {};

  const handleViewOrders = () => {
    const userRole = Session.getRole();
    if (userRole === "admin") {
      navigate("/admin", { state: { activeTab: "orderManager" } });
    } else {
      navigate("/user", { state: { activeTab: "orders" } });
    }
  };

  if (!orderId) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Không tìm thấy thông tin đơn hàng. <Link to="/" className="text-blue-500">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-green-600 mb-4">Đặt hàng thành công!</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="text-lg text-gray-700 mb-2">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được tiếp nhận.
          </p>
          <p className="text-gray-600">
            Mã đơn hàng: <span className="font-bold text-gray-900">#{orderId}</span>
          </p>
          {orderData && (
            <p className="text-gray-600 mt-2">
              Tổng tiền: <span className="font-bold text-green-600">{Number(orderData.total_amount).toLocaleString()} ₫</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-gray-500 text-sm">
            Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.
          </p>
          <p className="text-gray-500 text-sm">
            Theo dõi đơn hàng trong mục <Link to="/user" className="text-blue-500 hover:underline">tài khoản cá nhân</Link>.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            ← Tiếp tục mua sắm
          </Link>
          <button
            onClick={handleViewOrders}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Xem đơn hàng của tôi
          </button>
        </div>
      </div>
    </div>
  );
}