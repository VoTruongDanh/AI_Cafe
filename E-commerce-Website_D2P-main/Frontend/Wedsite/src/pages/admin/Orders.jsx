import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Tab,
  Tabs,
  Alert,
  TextField,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Visibility, Print, Close, CheckCircle, AccountBalance } from '@mui/icons-material'
import { adminOrdersApi } from '../../services/api'
import { formatCurrency, formatDateTime, getStatusText, getStatusColor, getImageUrl } from '../../services/utils'
import { toast } from 'react-toastify'
import AdminPageLayout, { AdminCard, adminDataGridStyles } from '../../components/admin/AdminPageLayout'
import InvoicePrint from '../../components/common/InvoicePrint'

const Orders = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openPrintDialog, setOpenPrintDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [statusForm, setStatusForm] = useState({
    status: '',
    payment_status: '',
  })
  // State cho admin hủy đơn
  const [adminCancelReason, setAdminCancelReason] = useState('')
  const [showCancelReasonInput, setShowCancelReasonInput] = useState(false)
  // State cho xác nhận hủy đơn (2 bước)
  const [cancelStep, setCancelStep] = useState(1) // 1: Xác nhận nhận tiền, 2: Xác nhận hủy
  const [hasReceivedMoney, setHasReceivedMoney] = useState(null) // true/false/null
  const queryClient = useQueryClient()

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminOrdersApi.getAll({ per_page: 1000 }).then(res => res.data),
    staleTime: 30 * 1000, // ✅ Cache 30 giây
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  })

  const orders = useMemo(() => {
    let data = []
    if (!ordersResponse) return data
    if (Array.isArray(ordersResponse)) data = ordersResponse
    else if (ordersResponse?.data) data = ordersResponse.data
    
    // Tạo bản copy để tránh lỗi read-only
    data = [...data]
    
    if (filterStatus !== 'all') {
      data = data.filter(o => o.status === filterStatus)
    }
    
    // Sắp xếp theo created_at giảm dần (mới nhất lên đầu)
    return data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [ordersResponse, filterStatus])

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }) => adminOrdersApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Cập nhật trạng thái thành công')
      setOpenDialog(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  // Mutation xác nhận thanh toán
  const verifyPaymentMutation = useMutation({
    mutationFn: (id) => adminOrdersApi.verifyPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Đã xác nhận thanh toán thành công!')
      setOpenDialog(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xác nhận thất bại')
    },
  })

  // Mutation từ chối xác nhận thanh toán
  const rejectPaymentMutation = useMutation({
    mutationFn: ({ id, reason }) => adminOrdersApi.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Đã từ chối xác nhận thanh toán!')
      setOpenDialog(false)
      setRejectReason('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Từ chối thất bại')
    },
  })

  // Mutation xác nhận hủy đơn (khi khách yêu cầu hủy sau khi đã xác nhận CK)
  const confirmCancelMutation = useMutation({
    mutationFn: ({ id, data }) => adminOrdersApi.confirmCancel(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success(response.data.message)
      // Cập nhật selectedOrder và statusForm để UI hiển thị đúng
      const updatedOrder = response.data.order
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
        setStatusForm({
          status: updatedOrder.status || '',
          payment_status: updatedOrder.payment_status || '',
        })
      }
      // Đóng dialog sau 1 giây để user thấy kết quả
      setTimeout(() => setOpenDialog(false), 1000)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xác nhận hủy thất bại')
    },
  })

  // Mutation từ chối hủy đơn
  const rejectCancelMutation = useMutation({
    mutationFn: ({ id, reason }) => adminOrdersApi.rejectCancel(id, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Đã từ chối yêu cầu hủy đơn!')
      // Cập nhật selectedOrder và statusForm
      const updatedOrder = response.data.order
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
        setStatusForm({
          status: updatedOrder.status || '',
          payment_status: updatedOrder.payment_status || '',
        })
      }
      setTimeout(() => setOpenDialog(false), 1000)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Từ chối thất bại')
    },
  })

  // Mutation xử lý hoàn tiền
  const processRefundMutation = useMutation({
    mutationFn: ({ id, data }) => adminOrdersApi.processRefund(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success(response.data.message)
      setOpenDialog(false)
      setRefundNote('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xử lý hoàn tiền thất bại')
    },
  })

  // State cho refund note
  const [refundNote, setRefundNote] = useState('')
  // State cho reject payment reason
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const handleVerifyPayment = () => {
    if (!selectedOrder) return
    verifyPaymentMutation.mutate(selectedOrder.id)
  }

  const handleRejectPayment = () => {
    if (!selectedOrder) return
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối')
      return
    }
    rejectPaymentMutation.mutate({ id: selectedOrder.id, reason: rejectReason })
  }

  const handleProcessRefund = (action) => {
    if (!selectedOrder) return
    processRefundMutation.mutate({ 
      id: selectedOrder.id, 
      data: { action, refund_note: refundNote } 
    })
  }

  const handleView = (order) => {
    setSelectedOrder(order)
    setStatusForm({
      status: order.status || '',
      payment_status: order.payment_status || '',
    })
    setAdminCancelReason('')
    setShowCancelReasonInput(false)
    setRejectReason('')
    setShowRejectInput(false)
    // Reset state cho xác nhận hủy đơn
    setCancelStep(1)
    setHasReceivedMoney(null)
    setOpenDialog(true)
  }

  // Xử lý khi thay đổi status
  const handleStatusChange = (newStatus) => {
    setStatusForm(prev => ({ ...prev, status: newStatus }))
    // Hiện input lý do hủy nếu chọn cancelled và đơn hiện tại không phải cancelled
    if (newStatus === 'cancelled' && selectedOrder?.status !== 'cancelled') {
      setShowCancelReasonInput(true)
    } else {
      setShowCancelReasonInput(false)
      setAdminCancelReason('')
    }
  }

  const handleUpdateStatus = () => {
    if (!selectedOrder) return
    const updateData = {}
    if (statusForm.status) updateData.status = statusForm.status
    if (statusForm.payment_status) updateData.payment_status = statusForm.payment_status

    // Nếu hủy đơn, cần có lý do
    if (statusForm.status === 'cancelled' && selectedOrder.status !== 'cancelled') {
      if (!adminCancelReason.trim()) {
        toast.warning('Vui lòng nhập lý do hủy đơn')
        return
      }
      updateData.cancel_reason = adminCancelReason
    }

    if (Object.keys(updateData).length === 0) {
      toast.warning('Vui lòng chọn ít nhất một trạng thái')
      return
    }
    updateStatusMutation.mutate({ id: selectedOrder.id, data: updateData })
  }

  const handlePrint = () => {
    setOpenPrintDialog(true)
  }

  const handleClosePrintDialog = () => {
    setOpenPrintDialog(false)
  }

  const statusTabs = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ]

  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.3, minWidth: 50, align: 'center', headerAlign: 'center' },
    { 
      field: 'code', 
      headerName: 'Mã đơn', 
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography fontWeight={600} color="primary" fontSize="0.875rem" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.row.code || `ORD-${params.row.id}`}
        </Typography>
      ),
    },
    {
      field: 'customer',
      headerName: 'Khách hàng',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ overflow: 'hidden', width: '100%' }}>
          <Typography fontWeight={500} fontSize="0.875rem" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.row.customer_name || params.row.user?.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.row.customer_phone || params.row.user?.phone || ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'grand_total',
      headerName: 'Tổng tiền',
      flex: 0.8,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography fontWeight={700} color="error.main" fontSize="0.875rem">
          {formatCurrency(params.row.grand_total || params.row.total || 0)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={getStatusText(params.row.status)}
          size="small"
          sx={{ 
            bgcolor: getStatusColor(params.row.status), 
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
            minWidth: 100,
          }}
        />
      ),
    },
    {
      field: 'payment_status',
      headerName: 'Thanh toán',
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const status = params.row.payment_status || 'unpaid'
        const hasConfirmed = params.row.transfer_confirmed_at
        const colors = { unpaid: '#ff9800', pending: '#2196f3', paid: '#4caf50', refunded: '#f44336' }
        const labels = { 
          unpaid: 'Chưa TT', 
          pending: hasConfirmed ? '⏳ Chờ xác nhận' : 'Chờ TT', 
          paid: '✓ Đã TT', 
          refunded: 'Hoàn tiền' 
        }
        return (
          <Chip
            label={labels[status] || status}
            size="small"
            sx={{ 
              bgcolor: status === 'pending' && hasConfirmed ? '#2196f3' : colors[status] || '#757575', 
              color: 'white', 
              fontWeight: 600, 
              fontSize: '0.7rem',
              animation: status === 'pending' && hasConfirmed ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              }
            }}
          />
        )
      },
    },
    {
      field: 'payment_method',
      headerName: 'PT Thanh toán',
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const method = params.row.payment_method
        if (!method) return <Typography fontSize="0.8rem" color="text.secondary">-</Typography>
        
        const methodLabels = {
          'MOMO': '📱 MoMo',
          'momo': '📱 MoMo',
          'VNPAY': '💳 VNPay',
          'vnpay': '💳 VNPay',
          'COD': '💵 COD',
          'cod': '💵 COD',
          'CASH': '💵 Tiền mặt',
          'cash': '💵 Tiền mặt',
        }
        const label = methodLabels[method.code] || method.name || method.code
        return (
          <Typography fontSize="0.8rem" fontWeight={500}>
            {label}
          </Typography>
        )
      },
    },
    {
      field: 'created_at',
      headerName: 'Ngày đặt',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontSize="0.85rem" color="text.secondary">
          {formatDateTime(params.row.created_at)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.4,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleView(params.row)} color="primary">
          <Visibility />
        </IconButton>
      ),
    },
  ]

  return (
    <AdminPageLayout
      title="Quản lý Đơn hàng"
      subtitle={`${orders.length} đơn hàng`}
    >
      {/* Filter Tabs */}
      <AdminCard sx={{ mb: 2, p: 0 }}>
        <Tabs 
          value={filterStatus} 
          onChange={(e, v) => setFilterStatus(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': { 
              textTransform: 'none', 
              fontWeight: 600,
              minHeight: 48,
            }
          }}
        >
          {statusTabs.map(tab => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </AdminCard>

      {/* Data Grid */}
      <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
        <DataGrid
          rows={orders}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          disableSelectionOnClick
          autoHeight
          getRowHeight={() => 56}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
          sx={adminDataGridStyles}
        />
      </Box>

      {/* Order Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Chi tiết đơn hàng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrder?.code || `#${selectedOrder?.id}`}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Customer Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Thông tin khách hàng
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography fontSize="0.9rem">
                    <strong>Tên:</strong> {selectedOrder.customer_name || selectedOrder.user?.name || 'N/A'}
                  </Typography>
                  <Typography fontSize="0.9rem">
                    <strong>SĐT:</strong> {selectedOrder.customer_phone || selectedOrder.user?.phone || 'N/A'}
                  </Typography>
                  <Typography fontSize="0.9rem">
                    <strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.user?.email || 'N/A'}
                  </Typography>
                  {selectedOrder.shipping_address_line && (
                    <Typography fontSize="0.9rem">
                      <strong>Địa chỉ:</strong> {selectedOrder.shipping_address_line}, {selectedOrder.shipping_city}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Order Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Trạng thái & Thanh toán
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip
                      label={getStatusText(selectedOrder.status)}
                      size="small"
                      sx={{ bgcolor: getStatusColor(selectedOrder.status), color: 'white' }}
                    />
                    <Chip
                      label={
                        selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 
                        selectedOrder.payment_status === 'pending' ? 'Chờ thanh toán' : 'Chưa thanh toán'
                      }
                      size="small"
                      sx={{ 
                        bgcolor: selectedOrder.payment_status === 'paid' ? '#4caf50' : '#ff9800', 
                        color: 'white' 
                      }}
                    />
                  </Box>
                  
                  {/* Nhân viên xử lý */}
                  {selectedOrder.processor && (
                    <Typography fontSize="0.9rem" sx={{ mb: 0.5 }}>
                      <strong>👤 Nhân viên xử lý:</strong> {selectedOrder.processor.name}
                      {selectedOrder.updated_at && (
                        <Typography component="span" fontSize="0.8rem" color="text.secondary" sx={{ ml: 1 }}>
                          ({formatDateTime(selectedOrder.updated_at)})
                        </Typography>
                      )}
                    </Typography>
                  )}
                  
                  {/* Phương thức thanh toán */}
                  <Typography fontSize="0.9rem">
                    <strong>Phương thức:</strong>{' '}
                    {selectedOrder.payment_method ? (
                      <>
                        {selectedOrder.payment_method.code === 'MOMO' || selectedOrder.payment_method.code === 'momo'
                          ? '📱 MoMo'
                          : selectedOrder.payment_method.code === 'VNPAY' || selectedOrder.payment_method.code === 'vnpay'
                          ? '💳 VNPay'
                          : selectedOrder.payment_method.code === 'COD' || selectedOrder.payment_method.code === 'cod'
                          ? '💵 Thanh toán khi nhận hàng'
                          : selectedOrder.payment_method.name || selectedOrder.payment_method.code
                        }
                      </>
                    ) : 'Chưa xác định'}
                  </Typography>
                  {/* Thông tin thanh toán bị từ chối */}
                  {selectedOrder.payment_rejected_at && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ef9a9a' }}>
                      <Typography fontSize="0.85rem" color="error.dark" fontWeight={600}>
                        ❌ XÁC NHẬN THANH TOÁN BỊ TỪ CHỐI
                      </Typography>
                      <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 0.5 }}>
                        Thời gian: <strong>{formatDateTime(selectedOrder.payment_rejected_at)}</strong>
                      </Typography>
                      {selectedOrder.payment_reject_reason && (
                        <Typography fontSize="0.8rem" color="text.secondary">
                          Lý do: <strong>{selectedOrder.payment_reject_reason}</strong>
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Thông tin chờ xác nhận hủy - TRẠNG THÁI MỚI */}
                  {selectedOrder.status === 'pending_cancel' && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffcc80' }}>
                      <Typography fontSize="0.85rem" color="warning.dark" fontWeight={600}>
                        ⏳ KHÁCH HÀNG YÊU CẦU HỦY ĐƠN
                      </Typography>
                      <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 0.5 }}>
                        Khách đã xác nhận chuyển khoản trước khi yêu cầu hủy. Vui lòng kiểm tra sao kê ngân hàng.
                      </Typography>
                      {selectedOrder.cancel_reason && (
                        <Typography fontSize="0.8rem" color="text.secondary">
                          Lý do hủy: <strong>{selectedOrder.cancel_reason}</strong>
                        </Typography>
                      )}
                      {selectedOrder.transfer_confirmed_at && (
                        <Typography fontSize="0.8rem" color="text.secondary">
                          Xác nhận CK lúc: <strong>{formatDateTime(selectedOrder.transfer_confirmed_at)}</strong>
                        </Typography>
                      )}
                      {selectedOrder.transfer_content && (
                        <Typography fontSize="0.8rem" color="text.secondary">
                          Nội dung CK: <strong>{selectedOrder.transfer_content}</strong>
                        </Typography>
                      )}
                      
                      {/* BƯỚC 1: Xác nhận đã nhận tiền hay chưa */}
                      {cancelStep === 1 && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                          <Typography fontSize="0.85rem" fontWeight={600} color="info.dark" sx={{ mb: 1.5 }}>
                            📋 Bước 1: Kiểm tra sao kê ngân hàng
                          </Typography>
                          <Typography fontSize="0.8rem" color="text.secondary" sx={{ mb: 1.5 }}>
                            Vui lòng kiểm tra xem đã nhận được tiền chuyển khoản của khách hàng chưa?
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => {
                                setHasReceivedMoney(true)
                                setCancelStep(2)
                              }}
                            >
                              ✅ Đã nhận được tiền
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => {
                                setHasReceivedMoney(false)
                                setCancelStep(2)
                              }}
                            >
                              ❌ Chưa nhận được tiền
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* BƯỚC 2: Xác nhận hành động */}
                      {cancelStep === 2 && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: hasReceivedMoney ? '#e8f5e9' : '#ffebee', borderRadius: 1 }}>
                          <Typography fontSize="0.85rem" fontWeight={600} color={hasReceivedMoney ? 'success.dark' : 'error.dark'} sx={{ mb: 1 }}>
                            📋 Bước 2: Xác nhận hành động
                          </Typography>
                          <Typography fontSize="0.8rem" color="text.secondary" sx={{ mb: 1.5 }}>
                            {hasReceivedMoney 
                              ? '✅ Bạn đã xác nhận ĐÃ NHẬN ĐƯỢC TIỀN. Chọn hành động:' 
                              : '❌ Bạn đã xác nhận CHƯA NHẬN ĐƯỢC TIỀN. Chọn hành động:'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {hasReceivedMoney ? (
                              <>
                                <Button
                                  variant="contained"
                                  color="warning"
                                  size="small"
                                  onClick={() => confirmCancelMutation.mutate({ 
                                    id: selectedOrder.id, 
                                    data: { has_received_money: true } 
                                  })}
                                  disabled={confirmCancelMutation.isPending}
                                >
                                  💰 Hủy đơn & Hoàn tiền
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  onClick={() => rejectCancelMutation.mutate({ 
                                    id: selectedOrder.id, 
                                    reason: 'Admin từ chối yêu cầu hủy - tiếp tục đơn hàng' 
                                  })}
                                  disabled={rejectCancelMutation.isPending}
                                >
                                  🔄 Từ chối hủy - Tiếp tục đơn
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => confirmCancelMutation.mutate({ 
                                    id: selectedOrder.id, 
                                    data: { has_received_money: false } 
                                  })}
                                  disabled={confirmCancelMutation.isPending}
                                >
                                  🚫 Hủy đơn (không hoàn tiền)
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  onClick={() => rejectCancelMutation.mutate({ 
                                    id: selectedOrder.id, 
                                    reason: 'Admin từ chối yêu cầu hủy - tiếp tục đơn hàng' 
                                  })}
                                  disabled={rejectCancelMutation.isPending}
                                >
                                  🔄 Từ chối hủy - Tiếp tục đơn
                                </Button>
                              </>
                            )}
                            <Button
                              variant="text"
                              color="inherit"
                              size="small"
                              onClick={() => {
                                setCancelStep(1)
                                setHasReceivedMoney(null)
                              }}
                            >
                              ← Quay lại
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Thông tin hủy đơn */}
                  {selectedOrder.status === 'cancelled' && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ef9a9a' }}>
                      <Typography fontSize="0.85rem" color="error.dark" fontWeight={600}>
                        ❌ ĐƠN HÀNG ĐÃ BỊ HỦY
                      </Typography>
                      {selectedOrder.cancelled_at && (
                        <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 0.5 }}>
                          Thời gian: <strong>{formatDateTime(selectedOrder.cancelled_at)}</strong>
                        </Typography>
                      )}
                      {selectedOrder.cancel_reason && (
                        <Typography fontSize="0.8rem" color="text.secondary">
                          Lý do: <strong>{selectedOrder.cancel_reason}</strong>
                        </Typography>
                      )}
                      {/* Thông tin hoàn tiền */}
                      {selectedOrder.refund_required && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: selectedOrder.refund_status === 'pending_verification' ? '#e3f2fd' : '#fff3e0', borderRadius: 1 }}>
                          <Typography fontSize="0.8rem" color={selectedOrder.refund_status === 'pending_verification' ? 'info.dark' : 'warning.dark'} fontWeight={600}>
                            💰 {selectedOrder.refund_status === 'pending_verification' 
                              ? '🔍 CẦN XÁC MINH CHUYỂN KHOẢN' 
                              : selectedOrder.refund_status === 'completed' 
                              ? '✅ ĐÃ HOÀN TIỀN' 
                              : selectedOrder.refund_status === 'rejected' 
                              ? '❌ TỪ CHỐI HOÀN TIỀN' 
                              : '⏳ YÊU CẦU HOÀN TIỀN'}
                          </Typography>
                          {selectedOrder.refund_status === 'pending_verification' && (
                            <Typography fontSize="0.75rem" color="text.secondary" sx={{ mt: 0.5 }}>
                              Khách hàng đã xác nhận chuyển khoản trước khi hủy. Vui lòng kiểm tra sao kê ngân hàng để xác minh.
                            </Typography>
                          )}
                          {selectedOrder.refunded_at && (
                            <Typography fontSize="0.75rem" color="text.secondary">
                              Hoàn tiền lúc: {formatDateTime(selectedOrder.refunded_at)}
                            </Typography>
                          )}
                          {selectedOrder.refund_note && (
                            <Typography fontSize="0.75rem" color="text.secondary">
                              Ghi chú: {selectedOrder.refund_note}
                            </Typography>
                          )}
                          {/* Nút xử lý hoàn tiền cho Admin */}
                          {(selectedOrder.refund_status === 'pending' || selectedOrder.refund_status === 'pending_verification') && (
                            <Box sx={{ mt: 1.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Ghi chú hoàn tiền (tùy chọn)"
                                value={refundNote}
                                onChange={(e) => setRefundNote(e.target.value)}
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleProcessRefund('completed')}
                                  disabled={processRefundMutation.isPending}
                                >
                                  {processRefundMutation.isPending ? 'Đang xử lý...' : '✅ Đã hoàn tiền'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleProcessRefund('rejected')}
                                  disabled={processRefundMutation.isPending}
                                >
                                  ❌ {selectedOrder.refund_status === 'pending_verification' ? 'Không có giao dịch' : 'Từ chối'}
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Products */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Sản phẩm
                </Typography>
                {selectedOrder.items?.map((item) => (
                  <Box key={item.id} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1.5, 
                    mb: 1,
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={getImageUrl(item.product?.thumbnail)}
                        alt={item.product_name}
                        sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50' }}
                      />
                      <Box>
                        <Typography fontWeight={500}>{item.product_name || item.product?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          SL: {item.quantity} × {formatCurrency(item.unit_price)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography fontWeight={700} color="error.main">
                      {formatCurrency(item.line_total || item.unit_price * item.quantity)}
                    </Typography>
                  </Box>
                ))}
              </Grid>

              {/* Order Summary Breakdown */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                {(() => {
                  const subtotal = selectedOrder.subtotal || selectedOrder.total || 0
                  const discount = selectedOrder.discount_total || 0
                  const afterDiscount = subtotal - discount
                  const tax = afterDiscount * 0.08
                  const grandTotal = afterDiscount + tax
                  
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontSize="0.9rem" color="text.secondary">Tạm tính:</Typography>
                        <Typography fontSize="0.9rem" fontWeight={600}>
                          {formatCurrency(subtotal)}
                        </Typography>
                      </Box>
                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography fontSize="0.9rem" color="text.secondary">Giảm giá:</Typography>
                          <Typography fontSize="0.9rem" color="error" fontWeight={600}>
                            -{formatCurrency(discount)}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontSize="0.9rem" color="text.secondary">Thuế (8%):</Typography>
                        <Typography fontSize="0.9rem" fontWeight={600}>
                          +{formatCurrency(tax)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        p: 2, 
                        bgcolor: '#e3f2fd',
                        borderRadius: 1,
                      }}>
                        <Typography variant="h6" fontWeight={700}>Tổng cộng:</Typography>
                        <Typography variant="h5" fontWeight={700} color="error.main">
                          {formatCurrency(grandTotal)}
                        </Typography>
                      </Box>
                    </>
                  )
                })()}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Nút xác nhận thanh toán cho đơn chuyển khoản - CHỈ hiển thị khi đơn CHƯA BỊ HỦY và KHÔNG phải pending_cancel */}
              {!['cancelled', 'pending_cancel'].includes(selectedOrder.status) && selectedOrder.payment_status === 'pending' && selectedOrder.transfer_confirmed_at && (
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    icon={<AccountBalance />}
                    sx={{ mb: 2 }}
                  >
                    <Typography fontWeight={600}>Khách hàng đã xác nhận chuyển khoản!</Typography>
                    <Typography fontSize="0.85rem" mb={2}>
                      Vui lòng kiểm tra sao kê ngân hàng và xác nhận nếu đã nhận được tiền.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Button 
                        color="success" 
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={handleVerifyPayment}
                        disabled={verifyPaymentMutation.isPending}
                      >
                        {verifyPaymentMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
                      </Button>
                      <Button 
                        color="error" 
                        variant="outlined"
                        size="small"
                        startIcon={<Close />}
                        onClick={() => setShowRejectInput(true)}
                        disabled={showRejectInput}
                      >
                        Từ chối
                      </Button>
                    </Box>
                    {showRejectInput && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Lý do từ chối"
                          placeholder="Ví dụ: Chưa nhận được tiền trong sao kê"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            color="error" 
                            variant="contained"
                            size="small"
                            onClick={handleRejectPayment}
                            disabled={rejectPaymentMutation.isPending}
                          >
                            {rejectPaymentMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                          </Button>
                          <Button 
                            variant="text"
                            size="small"
                            onClick={() => {
                              setShowRejectInput(false)
                              setRejectReason('')
                            }}
                          >
                            Hủy
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Alert>
                </Grid>
              )}

              {/* Update Status - Ẩn nếu đơn đã hoàn thành VÀ đã thanh toán */}
              {!(selectedOrder.status === 'completed' && selectedOrder.payment_status === 'paid') ? (
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Cập nhật trạng thái
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Trạng thái đơn</InputLabel>
                      <Select
                        value={statusForm.status}
                        label="Trạng thái đơn"
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        <MenuItem value="pending">Chờ xử lý</MenuItem>
                        <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                        <MenuItem value="shipped">Đang giao</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="returned">Đã trả hàng</MenuItem>
                        <MenuItem 
                          value="cancelled" 
                          disabled={selectedOrder?.status !== 'pending'}
                          sx={{ 
                            opacity: selectedOrder?.status !== 'pending' ? 0.5 : 1,
                            '&.Mui-disabled': { opacity: 0.5 }
                          }}
                        >
                          Đã hủy {selectedOrder?.status !== 'pending' && '(Chỉ hủy khi Chờ xử lý)'}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Thanh toán</InputLabel>
                      <Select
                        value={statusForm.payment_status}
                        label="Thanh toán"
                        onChange={(e) => setStatusForm({ ...statusForm, payment_status: e.target.value })}
                        disabled={selectedOrder?.status === 'cancelled'} // Disable khi đã hủy
                      >
                        <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
                        <MenuItem value="paid">Đã thanh toán</MenuItem>
                        {/* Chỉ hiển thị "Đã hoàn tiền" khi đơn đã hủy VÀ có yêu cầu hoàn tiền */}
                        <MenuItem 
                          value="refunded"
                          disabled={!selectedOrder?.refund_required}
                        >
                          Đã hoàn tiền
                        </MenuItem>
                      </Select>
                      {selectedOrder?.status === 'cancelled' && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {selectedOrder?.refund_required 
                            ? '💰 Đơn này cần hoàn tiền - Xử lý ở phần bên trên' 
                            : '✓ Đơn hủy không cần hoàn tiền'}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  {/* Input lý do hủy đơn khi admin chọn "Đã hủy" */}
                  {showCancelReasonInput && (
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        Bạn đang hủy đơn hàng này. Vui lòng nhập lý do hủy.
                        {/* Chỉ cảnh báo hoàn tiền khi: đã thanh toán HOẶC đã xác nhận chuyển khoản */}
                        {(selectedOrder?.payment_status === 'paid' || selectedOrder?.transfer_confirmed_at) && (
                          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                            ⚠️ Khách hàng đã thanh toán/xác nhận chuyển khoản, sẽ yêu cầu hoàn tiền.
                          </Typography>
                        )}
                      </Alert>
                      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Lý do hủy</InputLabel>
                        <Select
                          value={adminCancelReason}
                          label="Lý do hủy"
                          onChange={(e) => setAdminCancelReason(e.target.value)}
                        >
                          <MenuItem value="">-- Chọn lý do --</MenuItem>
                          <MenuItem value="Khách hàng yêu cầu hủy">Khách hàng yêu cầu hủy</MenuItem>
                          <MenuItem value="Hết hàng">Hết hàng</MenuItem>
                          <MenuItem value="Không liên lạc được với khách">Không liên lạc được với khách</MenuItem>
                          <MenuItem value="Khách không nhận hàng">Khách không nhận hàng</MenuItem>
                          <MenuItem value="Đơn hàng trùng lặp">Đơn hàng trùng lặp</MenuItem>
                          <MenuItem value="Thông tin đặt hàng không hợp lệ">Thông tin đặt hàng không hợp lệ</MenuItem>
                          <MenuItem value="other">Khác (nhập bên dưới)</MenuItem>
                        </Select>
                      </FormControl>
                      {adminCancelReason === 'other' && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Nhập lý do khác"
                          placeholder="Nhập lý do hủy đơn..."
                          onChange={(e) => setAdminCancelReason(e.target.value)}
                        />
                      )}
                    </Grid>
                  )}
                </Grid>
              </Grid>
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Đơn hàng đã hoàn thành và đã thanh toán - không thể cập nhật trạng thái.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handlePrint} startIcon={<Print />} variant="outlined">
            In hóa đơn
          </Button>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Đóng
          </Button>
          {/* Ẩn nút Cập nhật nếu đơn đã hoàn thành VÀ đã thanh toán */}
          {!(selectedOrder?.status === 'completed' && selectedOrder?.payment_status === 'paid') && (
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            Cập nhật
          </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog In hóa đơn */}
      <Dialog
        open={openPrintDialog}
        onClose={handleClosePrintDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              boxShadow: 'none',
              margin: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 0,
            },
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            '@media print': { display: 'none' },
          }}
        >
          <Typography variant="h6">Xem trước hóa đơn</Typography>
          <IconButton onClick={handleClosePrintDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <InvoicePrint order={selectedOrder} onClose={handleClosePrintDialog} />
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}

export default Orders
