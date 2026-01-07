import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Typography,
  InputAdornment,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS, ADMIN_GRID_STYLES } from '../../constants/adminTheme';
import { adminInventoryApi, adminProductsApi, adminSuppliersApi } from '../../services/api';
import { getImageUrl } from '../../services/utils';
import { inventorySchema } from '../../validations/adminSchemas';
import FormTextField from '../../components/common/FormTextField';
import FormSelect from '../../components/common/FormSelect';

const initialFormState = {
  supplier_id: '',
  items: [
    {
      product_id: '',
      quantity: '',
      unit_cost: '',
    },
  ],
  notes: '',
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
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Inventory = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, status: null });
  const [selectedImport, setSelectedImport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const { control, handleSubmit, reset, setError, watch, setValue } = useForm({
    resolver: yupResolver(inventorySchema),
    defaultValues: initialFormState,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items để tính tổng tiền
  const watchedItems = useWatch({
    control,
    name: 'items',
  });

  // Watch supplier_id để force re-render dropdown
  const watchedSupplierId = watch('supplier_id');

  // Fetch inventory imports
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const response = await adminInventoryApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-for-inventory'],
    queryFn: async () => {
      const response = await adminProductsApi.getAll({ 
        per_page: 1000
      });
      const products = response.data?.data || response.data || [];
      console.log('📦 Products for inventory:', products.length);
      if (products.length > 0) {
        console.log('📦 First product:', products[0]);
        console.log('📦 First product keys:', Object.keys(products[0]));
        console.log('📦 Has supplier_id?', 'supplier_id' in products[0]);
        console.log('📦 Has supplier?', 'supplier' in products[0]);
      }
      return products;
    },
  });

  // Fetch suppliers for dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['admin-suppliers-for-inventory'],
    queryFn: async () => {
      const response = await adminSuppliersApi.getAll({ per_page: 1000 });
      return response.data;
    },
  });

  const inventory = inventoryData || [];
  const products = productsData || [];
  const suppliers = suppliersData || { data: [] };

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  // Filtered inventory - handle backend structure
  const filteredInventory = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    
    return inventory.filter((item) => {
      const matchesSearch =
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [inventory, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalImports = inventory.length;
    const pendingImports = inventory.filter((i) => i.status === 'pending' || i.status === 'draft').length;
    const approvedImports = inventory.filter((i) => i.status === 'approved').length;
    const completedImports = inventory.filter((i) => i.status === 'completed').length;
    
    const totalValue = inventory
      .filter((i) => i.status !== 'cancelled')
      .reduce((sum, i) => sum + (parseFloat(i.grand_total) || 0), 0);

    const lowStockProducts = products.filter(
      (p) => (p.quantity || 0) <= (p.reorder_point || 10)
    ).length;

    return {
      totalImports,
      pendingImports,
      approvedImports,
      completedImports,
      totalValue,
      lowStockProducts,
    };
  }, [inventory, products]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => {
      // Transform data to match backend expectations
      const payload = {
        supplier_id: data.supplier_id || null,
        notes: data.notes || '',
        items: data.items,
        status: 'draft',
      };
      return adminInventoryApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inventory']);
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Tạo phiếu nhập kho thành công!');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      const backendErrors = error.response?.data?.errors;
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

  // Mutation cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminInventoryApi.updateStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-inventory']);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-products-for-inventory']);
      toast.success(response.data?.message || 'Cập nhật trạng thái thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    },
  });

  // Handler mở confirm dialog
  const openConfirmDialog = (id, status) => {
    setConfirmDialog({ open: true, id, status });
  };

  // Handler đóng confirm dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, id: null, status: null });
  };

  // Handler xác nhận cập nhật trạng thái
  const handleConfirmStatus = () => {
    if (confirmDialog.id && confirmDialog.status) {
      updateStatusMutation.mutate({ id: confirmDialog.id, status: confirmDialog.status });
    }
    closeConfirmDialog();
  };

  // Handler duyệt phiếu nhập
  const handleApprove = (id) => {
    openConfirmDialog(id, 'approved');
  };

  // Handler hoàn thành phiếu nhập
  const handleComplete = (id) => {
    openConfirmDialog(id, 'completed');
  };

  // Lấy thông tin confirm dialog
  const getConfirmDialogContent = () => {
    const statusConfig = {
      approved: {
        title: 'Xác nhận duyệt phiếu nhập',
        message: 'Bạn có chắc chắn muốn duyệt phiếu nhập này?',
        confirmText: 'Duyệt',
        color: 'primary',
      },
      completed: {
        title: 'Xác nhận hoàn thành phiếu nhập',
        message: 'Phiếu nhập sẽ được đánh dấu hoàn thành và số lượng sản phẩm sẽ được cộng vào tồn kho. Bạn có chắc chắn?',
        confirmText: 'Hoàn thành',
        color: 'success',
      },
      cancelled: {
        title: 'Xác nhận hủy phiếu nhập',
        message: 'Bạn có chắc chắn muốn hủy phiếu nhập này?',
        confirmText: 'Hủy phiếu',
        color: 'error',
      },
    };
    return statusConfig[confirmDialog.status] || { title: '', message: '', confirmText: 'Xác nhận', color: 'primary' };
  };

  // Handlers
  const handleOpenDialog = () => {
    reset(initialFormState);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset(initialFormState);
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
    createMutation.mutate(data);
  };

  const handleAddItem = () => {
    append({
      product_id: '',
      quantity: '',
      unit_cost: '',
    });
  };

  const handleRemoveItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Handler xem chi tiết phiếu nhập
  const handleViewImport = (importData) => {
    setSelectedImport(importData);
    setViewDialog(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { label: 'Nháp', color: 'default', icon: <EditIcon /> },
      pending: { label: 'Chờ duyệt', color: 'warning', icon: <WarningIcon /> },
      approved: { label: 'Đã duyệt', color: 'info', icon: <CheckIcon /> },
      completed: { label: 'Hoàn thành', color: 'success', icon: <CheckIcon /> },
      cancelled: { label: 'Đã hủy', color: 'error', icon: <CancelIcon /> },
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        color={config.color}
      />
    );
  };

  const columns = [
    {
      field: 'code',
      headerName: 'Mã phiếu',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {params.value || `#${params.row.id}`}
        </Typography>
      ),
    },
    {
      field: 'supplier',
      headerName: 'Nhà cung cấp',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.supplier?.name || 'N/A',
    },
    {
      field: 'items_count',
      headerName: 'Số sản phẩm',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.items?.length || 0} mặt hàng
        </Typography>
      ),
    },
    {
      field: 'grand_total',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          {formatCurrency(params.value || 0)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'created_at',
      headerName: 'Ngày tạo',
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => formatDate(params.row.created_at),
    },
    {
      field: 'notes',
      headerName: 'Ghi chú',
      flex: 1.2,
      minWidth: 120,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 1.3,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => {
        const status = params.row.status;
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Nút xem chi tiết */}
            <Tooltip title="Xem chi tiết">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleViewImport(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {(status === 'draft' || status === 'pending') && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={() => handleApprove(params.row.id)}
                disabled={updateStatusMutation.isPending}
              >
                Duyệt
              </Button>
            )}
            {status === 'approved' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleComplete(params.row.id)}
                disabled={updateStatusMutation.isPending}
              >
                Hoàn thành
              </Button>
            )}
            {status === 'completed' && (
              <Chip
                label="Đã hoàn thành"
                color="success"
                size="small"
              />
            )}
            {status === 'cancelled' && (
              <Chip
                label="Đã hủy"
                color="error"
                size="small"
              />
            )}
          </Box>
        );
      },
    },
  ];

  // Low stock products columns
  const lowStockColumns = [
    {
      field: 'image',
      headerName: 'Ảnh',
      flex: 0.3,
      minWidth: 60,
      renderCell: (params) => (
        <Avatar
          src={getImageUrl(params.row.thumbnail || params.row.images?.[0]?.path)}
          variant="rounded"
          sx={{ width: 40, height: 40 }}
        >
          <InventoryIcon />
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Sản phẩm',
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      flex: 0.8,
      minWidth: 100,
    },
    {
      field: 'quantity',
      headerName: 'Tồn kho',
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          icon={params.value === 0 ? <CancelIcon /> : <WarningIcon />}
          label={params.value || 0}
          size="small"
          color={params.value === 0 ? 'error' : 'warning'}
        />
      ),
    },
    {
      field: 'category',
      headerName: 'Danh mục',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => params.row.category?.name || 'N/A',
    },
  ];

  const lowStockProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const quantity = p.quantity || 0;
      const reorderPoint = p.reorder_point || 10;
      return quantity <= reorderPoint;
    });
    console.log('📊 Low stock products:', filtered.length);
    console.log('📊 Sample product for low stock check:', products[0]);
    return filtered;
  }, [products]);

  return (
    <AdminPageLayout
      title="Quản lý kho hàng"
      subtitle="Theo dõi nhập xuất kho và tồn kho sản phẩm"
      actionButton={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            bgcolor: ADMIN_COLORS.primary,
            '&:hover': { bgcolor: ADMIN_COLORS.secondary },
          }}
        >
          Tạo phiếu kho
        </Button>
      }
    >
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng phiếu nhập"
            value={stats.totalImports}
            icon={<InventoryIcon />}
            color={ADMIN_COLORS.primary}
            subtitle={`${stats.pendingImports} chờ duyệt`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đã duyệt"
            value={stats.approvedImports}
            icon={<CheckIcon />}
            color={ADMIN_COLORS.info}
            subtitle={`${stats.completedImports} hoàn thành`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng giá trị"
            value={formatCurrency(stats.totalValue)}
            icon={<TrendingUpIcon />}
            color={ADMIN_COLORS.success}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sắp hết hàng"
            value={stats.lowStockProducts}
            icon={<WarningIcon />}
            color={ADMIN_COLORS.warning}
            subtitle="sản phẩm cần nhập"
          />
        </Grid>
      </Grid>

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
          <Tab label="Tất cả phiếu nhập" />
          <Tab label="Sản phẩm sắp hết" />
        </Tabs>
      </Box>

      {/* Filters */}
      {tabValue !== 1 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Tìm kiếm mã phiếu, nhà cung cấp..."
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
      )}

      {/* Data Grid */}
      {tabValue !== 1 ? (
        <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
          <DataGrid
            rows={filteredInventory}
            columns={columns}
            loading={isLoading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            autoHeight
            getRowHeight={() => 56}
            sx={ADMIN_GRID_STYLES}
          />
        </Box>
      ) : (
        <>
          {lowStockProducts.length > 0 ? (
            <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
              <DataGrid
                rows={lowStockProducts}
                columns={lowStockColumns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                autoHeight
                getRowHeight={() => 56}
                sx={ADMIN_GRID_STYLES}
              />
            </Box>
          ) : (
            <Alert severity="success" icon={<CheckIcon />}>
              Tất cả sản phẩm đều có số lượng tồn kho tốt!
            </Alert>
          )}
        </>
      )}

      {/* Add Inventory Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: ADMIN_COLORS.primary, color: 'white' }}>
          Tạo phiếu nhập mới
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormSelect
                name="supplier_id"
                control={control}
                label="Nhà cung cấp *"
                key={watchedSupplierId || 'supplier-select'} // Force re-render khi supplier_id thay đổi
              >
                {suppliers?.data?.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>

            {/* Items Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Sản phẩm nhập
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  variant="outlined"
                  size="small"
                >
                  Thêm sản phẩm
                </Button>
              </Box>

              {fields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <Controller
                        name={`items.${index}.product_id`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <FormControl fullWidth size="small" error={!!error}>
                            <InputLabel>Sản phẩm *</InputLabel>
                            <Select
                              {...field}
                              label="Sản phẩm *"
                              value={field.value ?? ''}
                              onChange={async (e) => {
                                const productId = e.target.value;
                                field.onChange(productId); // Cập nhật giá trị trong form
                                
                                // Tự động điền nhà cung cấp và đơn giá
                                const selectedProduct = products?.find(p => p.id === productId);
                                if (selectedProduct) {
                                  console.log('Selected Product:', selectedProduct);
                                  
                                  // Tự động điền đơn giá
                                  const unitCost = selectedProduct.original_price || selectedProduct.price || 0;
                                  setValue(`items.${index}.unit_cost`, unitCost, { 
                                    shouldValidate: true, 
                                    shouldDirty: true 
                                  });
                                  
                                  // Fetch chi tiết product để lấy supplier_id
                                  try {
                                    const detailResponse = await adminProductsApi.getById(productId);
                                    const fullProduct = detailResponse.data?.data || detailResponse.data;
                                    console.log('📦 Full product detail:', fullProduct);
                                    
                                    const supplierId = fullProduct.supplier_id || fullProduct.supplier?.id;
                                    if (supplierId) {
                                      console.log('✅ Setting supplier_id:', supplierId);
                                      setValue('supplier_id', supplierId, { 
                                        shouldValidate: true, 
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    } else {
                                      console.warn('⚠️ Product detail không có supplier_id');
                                    }
                                  } catch (error) {
                                    console.error('❌ Error fetching product detail:', error);
                                  }
                                }
                              }}
                              renderValue={(value) => {
                                const selectedProduct = products?.find(p => p.id === value);
                                return selectedProduct?.name || '';
                              }}
                            >
                              {products?.map((product) => (
                                <MenuItem key={product.id} value={product.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <img 
                                      src={getImageUrl(product.thumbnail)} 
                                      alt={product.name}
                                      style={{ 
                                        width: 40, 
                                        height: 40, 
                                        objectFit: 'cover', 
                                        borderRadius: 4,
                                        border: '1px solid #e0e0e0'
                                      }}
                                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                                    />
                                    <Box>
                                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                        {product.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        SKU: {product.sku} | Giá: {formatCurrency(product.original_price || product.price)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                            {error && <FormHelperText>{error.message}</FormHelperText>}
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={5} md={2.5}>
                      <FormTextField
                        name={`items.${index}.quantity`}
                        control={control}
                        label="Số lượng *"
                        type="number"
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={5} md={3.5}>
                      <FormTextField
                        name={`items.${index}.unit_cost`}
                        control={control}
                        label="Đơn giá *"
                        type="number"
                        inputProps={{ min: 0 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={2} md={1}>
                      <IconButton
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                        disabled={fields.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                        Thành tiền: {formatCurrency(
                          (parseFloat(watchedItems?.[index]?.quantity) || 0) * 
                          (parseFloat(watchedItems?.[index]?.unit_cost) || 0)
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {/* Grand Total */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  Tổng cộng: {formatCurrency(
                    (watchedItems || []).reduce((sum, item) => {
                      const quantity = parseFloat(item?.quantity) || 0;
                      const unitCost = parseFloat(item?.unit_cost) || 0;
                      return sum + (quantity * unitCost);
                    }, 0)
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormTextField
                name="notes"
                control={control}
                label="Ghi chú"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit, onError)}
            disabled={createMutation.isPending}
            sx={{
              bgcolor: ADMIN_COLORS.primary,
              '&:hover': { bgcolor: ADMIN_COLORS.secondary },
            }}
          >
            Tạo phiếu
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Import Detail Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: ADMIN_COLORS.primary, color: 'white' }}>
          Chi tiết phiếu nhập #{selectedImport?.code}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedImport && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Thông tin chung */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin phiếu nhập
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Mã phiếu:</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedImport.code}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                      {getStatusChip(selectedImport.status)}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                      <Typography variant="body2">{formatDate(selectedImport.created_at)}</Typography>
                    </Box>
                    {selectedImport.completed_at && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Ngày hoàn thành:</Typography>
                        <Typography variant="body2">{formatDate(selectedImport.completed_at)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Nhà cung cấp
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Tên:</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedImport.supplier?.name || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Điện thoại:</Typography>
                      <Typography variant="body2">{selectedImport.supplier?.phone || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body2">{selectedImport.supplier?.email || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Danh sách sản phẩm */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Danh sách sản phẩm ({selectedImport.items?.length || 0} sản phẩm)
                </Typography>
                <Paper sx={{ overflow: 'hidden' }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: ADMIN_COLORS.primary }}>
                          <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>STT</th>
                          <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Sản phẩm</th>
                          <th style={{ padding: '12px', color: 'white', textAlign: 'center' }}>Số lượng</th>
                          <th style={{ padding: '12px', color: 'white', textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ padding: '12px', color: 'white', textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedImport.items?.map((item, index) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>{index + 1}</td>
                            <td style={{ padding: '12px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={getImageUrl(item.product?.thumbnail || item.product?.images?.[0]?.path)}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40 }}
                                >
                                  <InventoryIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.product?.name || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {item.product?.sku || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <Chip label={item.quantity} size="small" color="primary" />
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {formatCurrency(item.unit_cost)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                              {formatCurrency(item.quantity * item.unit_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <td colSpan={4} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                            Tổng cộng:
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: ADMIN_COLORS.primary }}>
                            {formatCurrency(selectedImport.grand_total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </Box>
                </Paper>
              </Grid>

              {/* Ghi chú */}
              {selectedImport.notes && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Ghi chú
                    </Typography>
                    <Typography variant="body2">{selectedImport.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialog(false)} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Status Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: getConfirmDialogContent().color === 'success' ? '#4caf50' : 
                   getConfirmDialogContent().color === 'error' ? '#f44336' : ADMIN_COLORS.primary,
          color: 'white'
        }}>
          {getConfirmDialogContent().title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, py: 3 }}>
          <Typography>{getConfirmDialogContent().message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeConfirmDialog} variant="outlined">
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirmStatus}
            variant="contained"
            color={getConfirmDialogContent().color}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Đang xử lý...' : getConfirmDialogContent().confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageLayout>
  );
};

export default Inventory;
