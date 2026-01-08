import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Typography,
  InputAdornment,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as PromotionIcon,
  Search as SearchIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS, ADMIN_GRID_STYLES } from '../../constants/adminTheme';
import { adminPromotionsApi, adminProductsApi } from '../../services/api';
import { getImageUrl } from '../../services/utils';
import { promotionSchema } from '../../validations/adminSchemas';
import FormTextField from '../../components/common/FormTextField';
import FormSelect from '../../components/common/FormSelect';
import FormSwitch from '../../components/common/FormSwitch';

// Loại khuyến mãi
const PROMOTION_CATEGORIES = {
  flash_sale: { label: '🔥 Flash Sale', description: 'Giờ vàng giá sốc - Áp dụng cho sản phẩm cụ thể' },
  special_offer: { label: '⭐ Khuyến mãi đặc biệt', description: 'Giảm giá sản phẩm - Áp dụng cho sản phẩm cụ thể' },
  coupon: { label: '🎟️ Mã giảm giá', description: 'Áp dụng cho toàn bộ đơn hàng khi thanh toán' },
};

const initialFormState = {
  code: '',
  name: '',
  description: '',
  promotion_type: 'percentage',
  value: 0,
  min_order_value: 0,
  max_discount_value: 0,
  usage_limit: 0,
  starts_at: null,
  ends_at: null,
  is_active: true,
  is_flash_sale: false,
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const Promotions = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  // ✅ Duplicate validation state
  const [codeWarning, setCodeWarning] = useState('');

  const { control, handleSubmit, reset, setError, watch, setValue } = useForm({
    resolver: yupResolver(promotionSchema),
    defaultValues: initialFormState,
    mode: 'onChange',
  });

  const promotionType = watch('promotion_type');

  // Fetch promotions
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const response = await adminPromotionsApi.getAll({ 
        per_page: 1000
      });
      return response.data?.data || response.data || [];
    },
    staleTime: 30 * 1000, // ✅ Cache 30 giây
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  });

  const promotions = promotionsData || [];

  // ❌ Removed WebSocket - Admin chỉ cần F5 để refresh
  // Mutations vẫn tự động refetch sau khi save

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: async () => {
      const response = await adminProductsApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  const products = productsData || [];

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    const now = new Date();
    return promotions.filter((promo) => {
      const matchesSearch =
        promo.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const startDate = new Date(promo.starts_at);
      const endDate = new Date(promo.ends_at);
      const isExpired = endDate < now;
      const isUpcoming = startDate > now;
      const isActive = !isExpired && !isUpcoming && promo.is_active;

      const matchesTab =
        tabValue === 0 ||
        (tabValue === 1 && isActive) ||
        (tabValue === 2 && isUpcoming) ||
        (tabValue === 3 && isExpired);

      return matchesSearch && matchesTab;
    });
  }, [promotions, searchTerm, tabValue]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    let active = 0,
      upcoming = 0,
      expired = 0;
    promotions.forEach((promo) => {
      const startDate = new Date(promo.starts_at);
      const endDate = new Date(promo.ends_at);
      if (endDate < now) expired++;
      else if (startDate > now) upcoming++;
      else if (promo.is_active) active++;
    });
    return { total: promotions.length, active, upcoming, expired };
  }, [promotions]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminPromotionsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-promotions']);
      
      // ✅ Kiểm tra xem có conflicts không
      const conflicts = response.data?.conflicts;
      if (conflicts && conflicts.length > 0) {
        // Hiển thị thông báo về conflicts
        const conflictMessages = conflicts.map(conflict => {
          const categoryName = conflict.category === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi đặc biệt';
          const productNames = Object.values(conflict.products).join(', ');
          return `• Đã loại bỏ khỏi "${conflict.promotion_name}": ${productNames}`;
        }).join('\n');
        
        toast.warning(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              ⚠️ Phát hiện xung đột sản phẩm
            </div>
            <div style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>
              {conflictMessages}
            </div>
          </div>,
          { autoClose: 7000 }
        );
      }
      
      toast.success(response.data?.message || 'Thêm khuyến mãi thành công!');
      handleCloseDialog();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // ✅ Xử lý lỗi giới hạn Flash Sale / Special Offer
      if (errorData?.existing_promotion) {
        const existing = errorData.existing_promotion;
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {errorData.message}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Promotion hiện tại: <strong>{existing.name}</strong> ({existing.code})
            </div>
          </div>,
          { autoClose: 5000 }
        );
        return;
      }
      
      toast.error(errorData?.message || 'Có lỗi xảy ra');
      const backendErrors = errorData?.errors;
      if (backendErrors) {
        Object.keys(backendErrors).forEach((key) => {
          setError(key, {
            type: 'manual',
            message: backendErrors[key][0]
          });
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminPromotionsApi.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-promotions']);
      
      // ✅ Kiểm tra xem có conflicts không
      const conflicts = response.data?.conflicts;
      if (conflicts && conflicts.length > 0) {
        // Hiển thị thông báo về conflicts
        const conflictMessages = conflicts.map(conflict => {
          const categoryName = conflict.category === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi đặc biệt';
          const productNames = Object.values(conflict.products).join(', ');
          return `• Đã loại bỏ khỏi "${conflict.promotion_name}": ${productNames}`;
        }).join('\n');
        
        toast.warning(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              ⚠️ Phát hiện xung đột sản phẩm
            </div>
            <div style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>
              {conflictMessages}
            </div>
          </div>,
          { autoClose: 7000 }
        );
      }
      
      toast.success(response.data?.message || 'Cập nhật khuyến mãi thành công!');
      handleCloseDialog();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // ✅ Xử lý lỗi giới hạn Flash Sale / Special Offer
      if (errorData?.existing_promotion) {
        const existing = errorData.existing_promotion;
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {errorData.message}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Promotion hiện tại: <strong>{existing.name}</strong> ({existing.code})
            </div>
          </div>,
          { autoClose: 5000 }
        );
        return;
      }
      
      toast.error(errorData?.message || 'Có lỗi xảy ra');
      const backendErrors = errorData?.errors;
      if (backendErrors) {
        Object.keys(backendErrors).forEach((key) => {
          setError(key, {
            type: 'manual',
            message: backendErrors[key][0]
          });
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminPromotionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-promotions']);
      toast.success('Xóa khuyến mãi thành công!');
      setOpenDeleteDialog(false);
      setSelectedPromotion(null);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // Lấy lý do đầu tiên
      let message = 'Không thể xóa khuyến mãi';
      
      if (errorData?.reasons && Array.isArray(errorData.reasons) && errorData.reasons.length > 0) {
        // Loại bỏ số khỏi message (ví dụ: "15 đơn hàng" -> "đơn hàng")
        const reason = errorData.reasons[0]
          .replace(/\d+\s*/g, '') // Xóa tất cả số và khoảng trắng sau số
          .replace(/^\s+/, '') // Xóa khoảng trắng đầu
          .toLowerCase();
        message = `Không thể xóa khuyến mãi vì ${reason}`;
      } else if (errorData?.message) {
        message = errorData.message;
      }
      
      toast.error(message, { 
        autoClose: 4000,
        style: { 
          fontSize: '14px'
        }
      });
      setOpenDeleteDialog(false);
    },
  });

  // Handlers
  const handleOpenDialog = (promotion = null) => {
    if (promotion) {
      setSelectedPromotion(promotion);
      
      // ✅ Format dates correctly - convert to local date string for input[type="date"]
      const formatDateForInput = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        // Get local date in YYYY-MM-DD format
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const formValues = {
        code: promotion.code || '',
        name: promotion.name || '',
        description: promotion.description || '',
        promotion_type: promotion.promotion_type || 'percentage',
        value: promotion.value || 0,
        min_order_value: promotion.min_order_value || 0,
        max_discount_value: promotion.max_discount_value || 0,
        usage_limit: promotion.usage_limit || 0,
        starts_at: formatDateForInput(promotion.starts_at),
        ends_at: formatDateForInput(promotion.ends_at),
        is_active: promotion.is_active ?? true,
        is_flash_sale: promotion.is_flash_sale ?? false,
      };
      reset(formValues);
      setFormData({
        ...formValues,
        promotion_category: promotion.promotion_category || 'coupon',
        product_ids: promotion.products?.map(p => p.id) || [],
      });
    } else {
      setSelectedPromotion(null);
      reset(initialFormState);
      setFormData({
        ...initialFormState,
        promotion_category: 'coupon',
        product_ids: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPromotion(null);
    setCodeWarning(''); // ✅ Reset warning
    reset(initialFormState);
    setFormData({
      ...initialFormState,
      promotion_category: 'coupon',
      product_ids: [],
    });
  };

  const generateCode = () => {
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    
    // ✅ Generate unique code
    do {
      code = 'PROMO' + Math.random().toString(36).substring(2, 8).toUpperCase();
      attempts++;
    } while (
      promotions.some(p => p.code === code) && 
      attempts < maxAttempts
    );
    
    setValue('code', code);
    setCodeWarning(''); // Clear warning
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Handler khi validation fail
  const onError = (errors) => {
    console.log('Validation errors:', errors);
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin!');
    }
  };

  const onSubmit = (data) => {
    // ✅ Check code duplicate
    const trimmedCode = data.code.trim().toUpperCase();
    const isDuplicate = promotions.some(p => 
      p.code && p.code.toUpperCase() === trimmedCode && 
      p.id !== selectedPromotion?.id
    );
    
    if (isDuplicate) {
      setError('code', {
        type: 'manual',
        message: 'Mã khuyến mãi đã tồn tại. Vui lòng chọn mã khác.'
      });
      toast.error('Mã khuyến mãi đã tồn tại!');
      return;
    }
    
    console.log('📤 [Promotions] Submitting data:', {
      is_active: data.is_active,
      is_active_type: typeof data.is_active,
      is_flash_sale: data.is_flash_sale,
      all_data: data,
    });
    
    // ✅ Format dates to end of day in local timezone to avoid timezone issues
    const formatDateToEndOfDay = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      // Set to end of day (23:59:59) in local timezone
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    };
    
    const formatDateToStartOfDay = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      // Set to start of day (00:00:00) in local timezone
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    };
    
    const submitData = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      promotion_type: data.promotion_type,
      value: Number(data.value),
      min_order_value: Number(data.min_order_value) || 0,
      max_discount_value: Number(data.max_discount_value) || 0,
      usage_limit: Number(data.usage_limit) || 0,
      starts_at: formatDateToStartOfDay(data.starts_at),
      ends_at: formatDateToEndOfDay(data.ends_at),
      is_active: data.is_active ? 1 : 0,
      is_flash_sale: data.is_flash_sale ? 1 : 0,
      product_ids: formData.product_ids || [], // ✅ Thêm product_ids
    };
    
    console.log('📤 [Promotions] Submit data after transform:', {
      is_active: submitData.is_active,
      is_active_type: typeof submitData.is_active,
      starts_at: submitData.starts_at,
      ends_at: submitData.ends_at,
    });

    if (selectedPromotion) {
      updateMutation.mutate({ id: selectedPromotion.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // ✅ Check duplicate code realtime
  const checkDuplicateCode = (code) => {
    if (!code || code.trim().length === 0) {
      setCodeWarning('');
      return;
    }
    
    const trimmedCode = code.trim().toUpperCase();
    const isDuplicate = promotions.some(p => 
      p.code && p.code.toUpperCase() === trimmedCode && 
      p.id !== selectedPromotion?.id
    );
    
    if (isDuplicate) {
      setCodeWarning('⚠️ Mã khuyến mãi đã tồn tại');
    } else {
      setCodeWarning('');
    }
  };

  const handleDelete = (promotion) => {
    setSelectedPromotion(promotion);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPromotion) {
      deleteMutation.mutate(selectedPromotion.id);
    }
  };

  const getStatusChip = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.starts_at);
    const endDate = new Date(promo.ends_at);

    if (endDate < now) {
      return <Chip label="Hết hạn" size="small" color="error" />;
    }
    if (startDate > now) {
      return <Chip label="Sắp diễn ra" size="small" color="info" />;
    }
    if (!promo.is_active) {
      return <Chip label="Tạm dừng" size="small" color="warning" />;
    }
    return <Chip label="Đang áp dụng" size="small" color="success" />;
  };

  const columns = [
    {
      field: 'code',
      headerName: 'Mã khuyến mãi',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          icon={<PromotionIcon />}
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
          onClick={() => handleCopyCode(params.value)}
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Tên khuyến mãi',
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: 'promotion_category',
      headerName: 'Loại',
      flex: 0.9,
      minWidth: 130,
      renderCell: (params) => {
        const category = params.row.promotion_category || 'coupon';
        const categoryInfo = PROMOTION_CATEGORIES[category] || PROMOTION_CATEGORIES.coupon;
        const colors = {
          flash_sale: 'error',
          special_offer: 'warning',
          coupon: 'info',
        };
        return (
          <Chip
            label={categoryInfo.label}
            size="small"
            color={colors[category] || 'default'}
          />
        );
      },
    },
    {
      field: 'discount',
      headerName: 'Giảm giá',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          icon={params.row.promotion_type === 'percentage' ? <PercentIcon /> : <MoneyIcon />}
          label={
            params.row.promotion_type === 'percentage'
              ? `${params.row.value}%`
              : formatCurrency(params.row.value)
          }
          size="small"
          color="secondary"
        />
      ),
    },
    {
      field: 'min_order_value',
      headerName: 'Đơn tối thiểu',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontSize="0.8rem">
          {params.row.min_order_value ? formatCurrency(params.row.min_order_value) : 'Không giới hạn'}
        </Typography>
      ),
    },
    {
      field: 'usage',
      headerName: 'Sử dụng',
      flex: 0.6,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const used = params.row.used_count || 0;
        const limit = params.row.usage_limit || 0;
        return (
          <Typography variant="body2" fontSize="0.8rem">
            {used}/{limit || '∞'}
          </Typography>
        );
      },
    },
    {
      field: 'period',
      headerName: 'Thời gian',
      flex: 1.0,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontSize="0.75rem">
          {formatDate(params.row.starts_at)} - {formatDate(params.row.ends_at)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.7,
      minWidth: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => getStatusChip(params.row),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Sửa">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              sx={{ color: ADMIN_COLORS.primary }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row)}
              sx={{ color: ADMIN_COLORS.danger }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Quản lý khuyến mãi"
      subtitle={`${stats.total} khuyến mãi | ${stats.active} đang áp dụng | ${stats.upcoming} sắp diễn ra`}
      actionButton={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: ADMIN_COLORS.primary,
            '&:hover': { bgcolor: ADMIN_COLORS.secondary },
          }}
        >
          Thêm khuyến mãi
        </Button>
      }
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none' },
            '& .Mui-selected': { color: ADMIN_COLORS.primary },
            '& .MuiTabs-indicator': { bgcolor: ADMIN_COLORS.primary },
          }}
        >
          <Tab label={`Tất cả (${stats.total})`} />
          <Tab label={`Đang áp dụng (${stats.active})`} />
          <Tab label={`Sắp diễn ra (${stats.upcoming})`} />
          <Tab label={`Hết hạn (${stats.expired})`} />
        </Tabs>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm theo mã, tên khuyến mãi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* Data Grid */}
      <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
        <DataGrid
          rows={filteredPromotions}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          autoHeight
          getRowHeight={() => 56}
          sx={ADMIN_GRID_STYLES}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: ADMIN_COLORS.primary, color: 'white' }}>
          {selectedPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <FormTextField
                name="code"
                control={control}
                label="Mã khuyến mãi *"
                onChange={(e) => checkDuplicateCode(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={generateCode}>
                        Tạo mã
                      </Button>
                    </InputAdornment>
                  ),
                }}
                helperText={codeWarning}
                error={!!codeWarning}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormSwitch
                name="is_active"
                control={control}
                label="Kích hoạt"
              />
            </Grid>
            
            {/* Loại khuyến mãi */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại khuyến mãi *</InputLabel>
                <Select
                  name="promotion_category"
                  value={formData.promotion_category}
                  label="Loại khuyến mãi *"
                  onChange={handleInputChange}
                >
                  {Object.entries(PROMOTION_CATEGORIES).map(([key, info]) => (
                    <MenuItem key={key} value={key}>
                      <Box>
                        <Typography variant="body2">{info.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {info.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormTextField
                name="name"
                control={control}
                label="Tên khuyến mãi *"
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="description"
                control={control}
                label="Mô tả"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormSelect
                name="promotion_type"
                control={control}
                label="Loại giảm giá *"
              >
                <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                <MenuItem value="fixed">Số tiền cố định (VNĐ)</MenuItem>
              </FormSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="value"
                control={control}
                label="Giá trị giảm *"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {promotionType === 'percentage' ? '%' : 'VNĐ'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="min_order_value"
                control={control}
                label="Đơn tối thiểu"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">VNĐ</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="max_discount_value"
                control={control}
                label="Giảm tối đa"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">VNĐ</InputAdornment>
                  ),
                }}
                helperText="Chỉ áp dụng cho giảm %"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="usage_limit"
                control={control}
                label="Số lần sử dụng tối đa"
                type="number"
                helperText="0 = không giới hạn"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="starts_at"
                control={control}
                label="Ngày bắt đầu *"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="ends_at"
                control={control}
                label="Ngày kết thúc *"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Chỉ hiện chọn sản phẩm cho Flash Sale và Special Offer */}
            {formData.promotion_category !== 'coupon' && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={
                  // Lọc sản phẩm theo điều kiện đơn tối thiểu
                  formData.min_order_value 
                    ? products.filter(p => p.price >= Number(formData.min_order_value))
                    : products
                }
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={products.filter(p => (formData.product_ids || []).includes(p.id))}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    product_ids: newValue.map(p => p.id)
                  }));
                }}
                noOptionsText={
                  formData.min_order_value 
                    ? `Không có sản phẩm nào có giá từ ${formatCurrency(formData.min_order_value)} trở lên`
                    : "Không tìm thấy sản phẩm"
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sản phẩm áp dụng"
                    placeholder="Chọn sản phẩm..."
                    size="small"
                    helperText={
                      formData.min_order_value 
                        ? `Chỉ hiển thị sản phẩm có giá từ ${formatCurrency(formData.min_order_value)} trở lên`
                        : "Để trống để áp dụng cho tất cả sản phẩm"
                    }
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img 
                        src={getImageUrl(option.thumbnail)} 
                        alt={option.name}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {option.sku} | Giá: {formatCurrency(option.price)}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        {...tagProps}
                      />
                    );
                  })
                }
              />
            </Grid>
            )}
            
            {/* Thông báo cho Mã giảm giá */}
            {formData.promotion_category === 'coupon' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Mã giảm giá</strong> sẽ áp dụng cho toàn bộ đơn hàng. Khách hàng nhập mã khi thanh toán để được giảm giá.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit, onError)}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{
              bgcolor: ADMIN_COLORS.primary,
              '&:hover': { bgcolor: ADMIN_COLORS.secondary },
            }}
          >
            {selectedPromotion ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn xóa khuyến mãi "{selectedPromotion?.name}" (mã:{' '}
            {selectedPromotion?.code})? Hành động này không thể hoàn tác.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageLayout>
  );
};

export default Promotions;
