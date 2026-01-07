import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
  Grid,
  Typography,
  InputAdornment,
  Tooltip,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS, ADMIN_GRID_STYLES } from '../../constants/adminTheme';
import { adminUsersApi } from '../../services/api';
import { userSchema } from '../../validations/adminSchemas';
import FormTextField from '../../components/common/FormTextField';
import FormSelect from '../../components/common/FormSelect';
import FormSwitch from '../../components/common/FormSwitch';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
  is_active: true,
  address_line: '',
  ward: '',
  city: '',
};

// Role mapping
const ROLE_CONFIG = {
  admin: { label: 'Quản trị viên', color: 'error', icon: 'admin' },
  staff: { label: 'Nhân viên', color: 'warning', icon: 'staff' },
  customer: { label: 'Khách hàng', color: 'default', icon: 'user' },
};

const Users = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  // ✅ Duplicate validation state
  const [emailWarning, setEmailWarning] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');

  const { control, handleSubmit, reset, setError } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: initialFormState,
    mode: 'onChange',
    context: { isEdit: !!selectedUser },
  });

  // Fetch users with auto-refresh
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await adminUsersApi.getAll({ 
        per_page: 1000
      });
      return response.data?.data || response.data || [];
    },
    staleTime: 30 * 1000, // ✅ Cache 30 giây
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  });

  const users = usersData || [];

  // ❌ Removed WebSocket - Admin chỉ cần F5 để refresh
  // Mutations vẫn tự động refetch sau khi save

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesRole =
        roleFilter === 'all' || user.role === roleFilter;

      const matchesTab =
        tabValue === 0 ||
        (tabValue === 1 && user.is_active) ||
        (tabValue === 2 && !user.is_active);

      return matchesSearch && matchesRole && matchesTab;
    });
  }, [users, searchTerm, roleFilter, tabValue]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = users.filter((u) => u.is_active).length;
    const inactiveCount = users.filter((u) => !u.is_active).length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    return { total: users.length, active: activeCount, inactive: inactiveCount, admin: adminCount };
  }, [users]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Thêm người dùng thành công!');
      handleCloseDialog();
    },
    onError: (error) => {
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Cập nhật người dùng thành công!');
      handleCloseDialog();
    },
    onError: (error) => {
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

  const deleteMutation = useMutation({
    mutationFn: (id) => adminUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Xóa người dùng thành công!');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // Lấy lý do đầu tiên
      let message = 'Không thể xóa người dùng';
      
      if (errorData?.reasons && Array.isArray(errorData.reasons) && errorData.reasons.length > 0) {
        // Loại bỏ số khỏi message (ví dụ: "10 đơn hàng" -> "đơn hàng")
        const reason = errorData.reasons[0]
          .replace(/\d+\s*/g, '') // Xóa tất cả số và khoảng trắng sau số
          .replace(/^\s+/, '') // Xóa khoảng trắng đầu
          .toLowerCase();
        message = `Không thể xóa người dùng vì ${reason}`;
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

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      adminUsersApi.update(id, { is_active: is_active ? 1 : 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  // Handlers
  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'customer',
        is_active: user.is_active ?? true,
        address_line: user.address_line || '',
        ward: user.ward || '',
        city: user.city || '',
      });
    } else {
      setSelectedUser(null);
      reset(initialFormState);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setEmailWarning(''); // ✅ Reset warning
    setPhoneWarning(''); // ✅ Reset phone warning
    reset(initialFormState);
  };

  // ✅ Handler khi validation fail
  const onError = (errors) => {
    console.log('Validation errors:', errors);
    
    // Tìm lỗi đầu tiên và hiển thị toast
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin!');
    }
  };

  const onSubmit = (data) => {
    // ✅ Check email duplicate
    const trimmedEmail = data.email.trim().toLowerCase();
    const isDuplicate = users.some(u => 
      u.email && u.email.toLowerCase() === trimmedEmail && 
      u.id !== selectedUser?.id
    );
    
    if (isDuplicate) {
      setError('email', {
        type: 'manual',
        message: 'Email đã tồn tại. Vui lòng sử dụng email khác.'
      });
      toast.error('Email đã tồn tại!');
      return;
    }

    // ✅ Check phone duplicate
    if (data.phone && data.phone.trim()) {
      const trimmedPhone = data.phone.trim();
      const isDuplicatePhone = users.some(u => 
        u.phone && u.phone === trimmedPhone && 
        u.id !== selectedUser?.id
      );
      
      if (isDuplicatePhone) {
        setError('phone', {
          type: 'manual',
          message: 'Số điện thoại đã tồn tại. Vui lòng sử dụng số khác.'
        });
        toast.error('Số điện thoại đã tồn tại!');
        return;
      }
    }
    
    // ✅ Chuẩn bị dữ liệu submit
    const submitData = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      is_active: data.is_active ? 1 : 0,
      address_line: data.address_line?.trim() || null,
      ward: data.ward?.trim() || null,
      city: data.city?.trim() || null,
    };

    // ✅ Chỉ gửi password nếu có giá trị (không rỗng)
    if (data.password && data.password.trim()) {
      submitData.password = data.password.trim();
    }

    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // ✅ Check duplicate email realtime
  const checkDuplicateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      setEmailWarning('');
      return;
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    const isDuplicate = users.some(u => 
      u.email && u.email.toLowerCase() === trimmedEmail && 
      u.id !== selectedUser?.id
    );
    
    if (isDuplicate) {
      setEmailWarning('⚠️ Email đã tồn tại');
    } else {
      setEmailWarning('');
    }
  };

  // ✅ Check duplicate phone realtime
  const checkDuplicatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) {
      setPhoneWarning('');
      return;
    }
    
    const trimmedPhone = phone.trim();
    const isDuplicate = users.some(u => 
      u.phone && u.phone === trimmedPhone && 
      u.id !== selectedUser?.id
    );
    
    if (isDuplicate) {
      setPhoneWarning('⚠️ Số điện thoại đã tồn tại');
    } else {
      setPhoneWarning('');
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({
      id: user.id,
      is_active: !user.is_active,
    });
  };

  const columns = [
    {
      field: 'avatar',
      headerName: 'Avatar',
      flex: 0.4,
      minWidth: 70,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Avatar
          src={params.row.avatar}
          sx={{ bgcolor: ADMIN_COLORS.primary, width: 36, height: 36 }}
        >
          {params.row.name?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Họ tên',
      flex: 1.5,
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ overflow: 'hidden', textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontSize="0.85rem">
          {params.row.phone || 'Chưa có'}
        </Typography>
      ),
    },
    {
      field: 'role',
      headerName: 'Vai trò',
      flex: 0.7,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const config = ROLE_CONFIG[params.value] || ROLE_CONFIG.customer;
        return (
          <Chip
            label={config.label}
            size="small"
            color={config.color}
            variant={params.value === 'customer' ? 'outlined' : 'filled'}
          />
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Trạng thái',
      flex: 0.6,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Hoạt động' : 'Bị khóa'}
          size="small"
          color={params.value ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Ngày tạo',
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" fontSize="0.8rem">
          {params.row.created_at 
            ? new Date(params.row.created_at).toLocaleDateString('vi-VN')
            : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.8,
      minWidth: 130,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={params.row.is_active ? 'Khóa tài khoản' : 'Mở khóa'}>
            <IconButton
              size="small"
              onClick={() => handleToggleStatus(params.row)}
              sx={{
                color: params.row.is_active
                  ? ADMIN_COLORS.warning
                  : ADMIN_COLORS.success,
              }}
            >
              {params.row.is_active ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
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
            <span>
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row)}
                sx={{ color: ADMIN_COLORS.danger }}
                disabled={params.row.role === 'admin'}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Quản lý người dùng"
      subtitle={`${stats.total} người dùng | ${stats.active} hoạt động | ${stats.admin} quản trị viên`}
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
          Thêm người dùng
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
          <Tab label={`Hoạt động (${stats.active})`} />
          <Tab label={`Bị khóa (${stats.inactive})`} />
        </Tabs>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm theo tên, email, SĐT..."
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Vai trò</InputLabel>
          <Select
            value={roleFilter}
            label="Vai trò"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="admin">Quản trị viên</MenuItem>
            <MenuItem value="staff">Nhân viên</MenuItem>
            <MenuItem value="customer">Khách hàng</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Data Grid */}
      <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
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
          {selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormTextField
                name="name"
                control={control}
                label="Họ tên *"
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="email"
                control={control}
                label="Email *"
                type="email"
                onChange={(e) => checkDuplicateEmail(e.target.value)}
                helperText={emailWarning}
                error={!!emailWarning}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="phone"
                control={control}
                label="Số điện thoại"
                onChange={(e) => checkDuplicatePhone(e.target.value)}
                helperText={phoneWarning}
                error={!!phoneWarning}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="address_line"
                control={control}
                label="Địa chỉ chi tiết"
                placeholder="Số nhà, tên đường..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="ward"
                control={control}
                label="Phường/Xã"
                placeholder="Phường 1, Xã ABC..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="city"
                control={control}
                label="Thành phố"
                placeholder="TP. Hồ Chí Minh..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="password"
                control={control}
                label={selectedUser ? 'Mật khẩu mới' : 'Mật khẩu *'}
                type="password"
                helperText={selectedUser ? 'Để trống nếu không đổi' : 'Ít nhất 8 ký tự'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormSelect
                name="role"
                control={control}
                label="Vai trò *"
              >
                <MenuItem value="customer">Khách hàng</MenuItem>
                <MenuItem value="staff">Nhân viên</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
              </FormSelect>
            </Grid>
            <Grid item xs={12}>
              <FormSwitch
                name="is_active"
                control={control}
                label="Tài khoản hoạt động"
              />
            </Grid>
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
            {selectedUser ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn xóa người dùng &quot;{selectedUser?.name}&quot;? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
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

export default Users;
