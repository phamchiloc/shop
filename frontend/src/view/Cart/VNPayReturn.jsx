// src/view/Cart/VNPayReturn.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { updateOrderPaymentStatus } from "../../api";
import Session from "../../Session/session";

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState("");

  const handleViewOrders = () => {
    const userRole = Session.getRole();
    if (userRole === "admin") {
      navigate("/admin", { state: { activeTab: "orderManager" } });
    } else {
      navigate("/user", { state: { activeTab: "orders" } });
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy tất cả query params
        const params = {};
        for (let [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        console.log("VNPay callback params:", params);

        // Kiểm tra response code trực tiếp
        const responseCode = params.vnp_ResponseCode;
        const orderId = params.vnp_TxnRef;
        
        if (!responseCode) {
          setError("Không tìm thấy thông tin thanh toán");
          setLoading(false);
          return;
        }

        // Tạo result object từ params
        const result = {
          success: responseCode === '00',
          code: responseCode,
          message: responseCode === '00' ? 'Giao dịch thành công' : 'Giao dịch thất bại',
          data: {
            orderId: params.vnp_TxnRef,
            amount: params.vnp_Amount ? parseInt(params.vnp_Amount) / 100 : 0,
            orderInfo: params.vnp_OrderInfo,
            responseCode: params.vnp_ResponseCode,
            transactionNo: params.vnp_TransactionNo,
            bankCode: params.vnp_BankCode,
            payDate: params.vnp_PayDate
          }
        };
        
        console.log("Payment result:", result);
        setPaymentResult(result);

        // Nếu thanh toán thành công, cập nhật đơn hàng
        if (result.success && result.code === '00') {
          try {
            const orderId = result.data.orderId;
            
            // Cập nhật trạng thái thanh toán đơn hàng
            const paymentInfo = JSON.stringify({
              transactionNo: result.data.transactionNo,
              bankCode: result.data.bankCode,
              payDate: result.data.payDate,
              amount: result.data.amount,
              responseCode: result.data.responseCode
            });
            
            await updateOrderPaymentStatus(orderId, true, paymentInfo);
            
            console.log(`✅ Order #${orderId} payment status updated successfully`);
            
            // Xóa localStorage sau khi thanh toán thành công
            localStorage.removeItem("last_order");
            localStorage.removeItem("cart");
            localStorage.removeItem("checkout_items");
            localStorage.removeItem("checkout_form");
            localStorage.removeItem("pending_order_id");
            
          } catch (updateError) {
            console.error("❌ Error updating order payment status:", updateError);
            // Không throw error, vẫn hiển thị success cho user
          }
        }

      } catch (err) {
        console.error("Error processing VNPay payment:", err);
        setError(err.message || "Lỗi xử lý thanh toán");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const getResponseMessage = (code) => {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };
    return messages[code] || 'Lỗi không xác định';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xác thực thanh toán...</h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi xác thực</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return null;
  }

  const isSuccess = paymentResult.success && paymentResult.code === '00';

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
        </div>

        <h2 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h2>

        <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Mã đơn hàng:</span>
              <span className="font-bold text-gray-900">#{paymentResult.data?.orderId || 'N/A'}</span>
            </div>
            
            {paymentResult.data?.amount && (
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Số tiền:</span>
                <span className="font-bold text-green-600">
                  {Number(paymentResult.data.amount).toLocaleString()} ₫
                </span>
              </div>
            )}

            {paymentResult.data?.transactionNo && (
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Mã giao dịch VNPay:</span>
                <span className="text-gray-900">{paymentResult.data.transactionNo}</span>
              </div>
            )}

            {paymentResult.data?.bankCode && (
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Ngân hàng:</span>
                <span className="text-gray-900">{paymentResult.data.bankCode}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Trạng thái:</span>
              <span className={`font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {getResponseMessage(paymentResult.code)}
              </span>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="space-y-3">
            <p className="text-gray-600">
              Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ xử lý và giao hàng sớm nhất.
            </p>
            <p className="text-gray-600 text-sm">
              Theo dõi đơn hàng trong mục <Link to="/user" className="text-blue-500 hover:underline">tài khoản cá nhân</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-600">
              Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            ← Về trang chủ
          </Link>
          {isSuccess && (
            <button
              onClick={handleViewOrders}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Xem đơn hàng của tôi
            </button>
          )}
          {!isSuccess && (
            <Link
              to="/cart"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Thử lại
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
