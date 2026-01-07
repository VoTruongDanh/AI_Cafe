import { useEffect } from 'react'
import { formatCurrency, formatDateTime } from '../../services/utils'

const InvoicePrint = ({ order, onClose, autoPrint = false }) => {
  useEffect(() => {
    // Tự động in khi component mount nếu autoPrint = true
    if (autoPrint) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
    
    // Đóng dialog sau khi in (nếu có callback)
    const handleAfterPrint = () => {
      if (onClose && autoPrint) {
        setTimeout(() => onClose(), 100)
      }
    }
    
    window.addEventListener('afterprint', handleAfterPrint)
    
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onClose, autoPrint])

  if (!order) return null

  const currentDate = new Date()
  const orderDate = order.placed_at || order.created_at
  
  // Tính toán giống email
  const subtotal = order.subtotal || 0
  const discount = order.discount_total || 0
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * 0.08
  const grandTotal = afterDiscount + tax
  const isPaid = order.payment_status === 'paid'

  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        lineHeight: '1.6',
        color: '#000',
        backgroundColor: '#fff',
        fontSize: '14px',
        maxWidth: '700px',
        margin: '20px auto',
        padding: '30px',
        border: '1px solid #000',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            textTransform: 'uppercase',
            marginBottom: '5px',
            fontWeight: 'bold',
          }}
        >
          ELECTROSHOP
        </h1>
        <p style={{ fontSize: '13px', margin: '3px 0' }}>
          Địa chỉ: 568 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh
        </p>
        <p style={{ fontSize: '13px', margin: '3px 0' }}>
          Hotline: 0328316192 | Email: phamduy14032004@gmail.com
        </p>
      </div>

      {/* Invoice Title */}
      <div style={{ textAlign: 'center', margin: '25px 0' }}>
        <h2
          style={{
            fontSize: '20px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            marginBottom: '5px',
          }}
        >
          HÓA ĐƠN BÁN HÀNG
        </h2>
        <p style={{ fontSize: '13px', fontStyle: 'italic', margin: '3px 0' }}>
          Mã đơn hàng: {order.code || `#${order.id}`}
        </p>
        <p style={{ fontSize: '13px', fontStyle: 'italic', margin: '3px 0' }}>
          Ngày: {formatDateTime(orderDate)}
        </p>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '10px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #000',
            paddingBottom: '5px',
          }}
        >
          Thông tin khách hàng
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ display: 'inline-block', width: '180px' }}>
            Họ tên khách hàng:
          </span>
          <span>{order.customer_name || order.user?.name || 'N/A'}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ display: 'inline-block', width: '180px' }}>
            Số điện thoại:
          </span>
          <span>{order.customer_phone || order.user?.phone || 'N/A'}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ display: 'inline-block', width: '180px' }}>
            Địa chỉ giao hàng:
          </span>
          <span>
            {order.shipping_address_line}
            {order.shipping_city && `, ${order.shipping_city}`}
          </span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ display: 'inline-block', width: '180px' }}>
            Phương thức thanh toán:
          </span>
          <span>
            {order.paymentMethod?.name ||
              order.payment_method?.name ||
              'Thanh toán khi nhận hàng'}
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '10px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #000',
            paddingBottom: '5px',
          }}
        >
          Chi tiết đơn hàng
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '15px 0',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '10px 8px',
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '5%',
                }}
              >
                STT
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '10px 8px',
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '45%',
                }}
              >
                Tên sản phẩm
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '10px 8px',
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '10%',
                }}
              >
                SL
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '10px 8px',
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '20%',
                }}
              >
                Đơn giá
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '10px 8px',
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '20%',
                }}
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={item.id}>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '10px 8px',
                  }}
                >
                  {item.product_name || item.product?.name || 'Sản phẩm'}
                </td>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '10px 8px',
                    textAlign: 'right',
                  }}
                >
                  {formatCurrency(item.unit_price || 0)}
                </td>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '10px 8px',
                    textAlign: 'right',
                  }}
                >
                  {formatCurrency(
                    item.line_total || item.unit_price * item.quantity || 0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <table
          style={{
            width: '50%',
            marginLeft: 'auto',
            marginTop: '15px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '5px 10px' }}>Tạm tính:</td>
              <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                {formatCurrency(subtotal)}
              </td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={{ padding: '5px 10px' }}>Giảm giá:</td>
                <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                  -{formatCurrency(discount)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '5px 10px' }}>Thuế VAT (8%):</td>
              <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                {formatCurrency(tax)}
              </td>
            </tr>
            <tr
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                borderTop: '2px solid #000',
              }}
            >
              <td style={{ padding: '5px 10px' }}>
                <strong>TỔNG CỘNG:</strong>
              </td>
              <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                <strong>{formatCurrency(grandTotal)}</strong>
              </td>
            </tr>
            <tr>
              <td
                colSpan="2"
                style={{ textAlign: 'center', paddingTop: '15px' }}
              >
                <span
                  style={{
                    backgroundColor: isPaid ? '#4CAF50' : '#FF9800',
                    color: 'white',
                    padding: '8px 20px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {isPaid ? '✓ ĐÃ THANH TOÁN' : 'THANH TOÁN KHI NHẬN HÀNG'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{ fontStyle: 'italic', marginTop: '20px', fontSize: '13px' }}>
        <strong>Ghi chú:</strong>{' '}
        {isPaid
          ? 'Đơn hàng đã được thanh toán thành công. Đơn hàng sẽ được giao trong vòng 2-5 ngày làm việc.'
          : 'Đơn hàng sẽ được giao trong vòng 2-5 ngày làm việc. Quý khách vui lòng kiểm tra hàng trước khi thanh toán.'}
      </div>

      {/* Signature */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '40px',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '45%' }}>
          <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>
            Khách hàng
          </p>
          <span>(Ký, ghi rõ họ tên)</span>
        </div>
        <div style={{ width: '45%' }}>
          <p style={{ marginBottom: '60px', fontWeight: 'bold' }}>
            Người bán hàng
          </p>
          <span>(Ký, ghi rõ họ tên)</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '30px',
          textAlign: 'center',
          fontSize: '13px',
          borderTop: '1px solid #000',
          paddingTop: '15px',
        }}
      >
        <p style={{ margin: '5px 0' }}>
          Cảm ơn Quý khách đã mua hàng tại ElectroShop!
        </p>
        <p style={{ margin: '5px 0' }}>
          Mọi thắc mắc xin liên hệ: 0328316192 hoặc phamduy14032004@gmail.com
        </p>
      </div>

      {/* Print Button - Hidden when printing */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
        className="no-print"
      >
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          In hóa đơn
        </button>
      </div>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>
    </div>
  )
}

export default InvoicePrint

