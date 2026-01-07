import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
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
  Grid,
  Alert,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add, Edit, Delete, Close } from '@mui/icons-material'
import { adminCategoriesApi } from '../../services/api'
import { toast } from 'react-toastify'
import AdminPageLayout, { adminDataGridStyles } from '../../components/admin/AdminPageLayout'
import { categorySchema } from '../../validations/adminSchemas'
import FormTextField from '../../components/common/FormTextField'
import FormSelect from '../../components/common/FormSelect'
import FormSwitch from '../../components/common/FormSwitch'

const Categories = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [nameWarning, setNameWarning] = useState('') // ✅ Thêm state cho warning
  const [slugWarning, setSlugWarning] = useState('') // ✅ Thêm state cho slug warning

  const queryClient = useQueryClient()

  const { control, handleSubmit, reset, setError } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: '',
      is_active: true,
    },
    mode: 'onChange', // Validate khi đang gõ
  })

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminCategoriesApi.getAll({ 
        per_page: 1000
      });
      return response.data;
    },
    staleTime: 30 * 1000, // ✅ Cache 30 giây
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  })

  const categories = useMemo(() => {
    if (!categoriesResponse) return []
    if (Array.isArray(categoriesResponse)) return categoriesResponse
    if (categoriesResponse?.data) return categoriesResponse.data
    return []
  }, [categoriesResponse])

  // ❌ Removed WebSocket - Admin chỉ cần F5 để refresh
  // Mutations vẫn tự động refetch sau khi save

  const createMutation = useMutation({
    mutationFn: (data) => adminCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      // ✅ Force refetch ngay lập tức
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      }, 100);
      toast.success('Thêm danh mục thành công')
      handleCloseDialog()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Thêm danh mục thất bại')
      // Hiển thị backend validation errors
      const backendErrors = error.response?.data?.errors
      if (backendErrors) {
        Object.keys(backendErrors).forEach((key) => {
          setError(key, {
            type: 'manual',
            message: backendErrors[key][0]
          })
        })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      // ✅ Force refetch ngay lập tức
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      }, 100);
      toast.success('Cập nhật danh mục thành công')
      handleCloseDialog()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật danh mục thất bại')
      // Hiển thị backend validation errors
      const backendErrors = error.response?.data?.errors
      if (backendErrors) {
        Object.keys(backendErrors).forEach((key) => {
          setError(key, {
            type: 'manual',
            message: backendErrors[key][0]
          })
        })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      // ✅ Force refetch ngay lập tức
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      }, 100);
      toast.success('Xóa danh mục thành công')
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // Lấy lý do đầu tiên
      let message = 'Không thể xóa danh mục';
      
      if (errorData?.reasons && Array.isArray(errorData.reasons) && errorData.reasons.length > 0) {
        // Loại bỏ số khỏi message (ví dụ: "20 sản phẩm" -> "sản phẩm")
        const reason = errorData.reasons[0]
          .replace(/\d+\s*/g, '') // Xóa tất cả số và khoảng trắng sau số
          .replace(/^\s+/, '') // Xóa khoảng trắng đầu
          .toLowerCase();
        message = `Không thể xóa danh mục vì ${reason}`;
      } else if (errorData?.message) {
        message = errorData.message;
      }
      
      toast.error(message, { 
        autoClose: 4000,
        style: { 
          fontSize: '14px'
        }
      });
    },
  })

  const handleAdd = () => {
    setSelectedCategory(null)
    reset({
      name: '',
      description: '',
      parent_id: '',
      is_active: true,
    })
    setOpenDialog(true)
  }

  const handleEdit = (category) => {
    setSelectedCategory(category)
    reset({
      name: category.name || '',
      description: category.description || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active ?? true,
    })
    setOpenDialog(true)
  }

  const handleDelete = (category) => {
    setSelectedCategory(category)
    setOpenDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id)
      setOpenDeleteDialog(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedCategory(null)
    setNameWarning('') // ✅ Reset warning
    setSlugWarning('') // ✅ Reset slug warning
    reset({
      name: '',
      description: '',
      parent_id: '',
      is_active: true,
    })
  }

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
    // ✅ Kiểm tra tên danh mục trùng
    const trimmedName = data.name.trim();
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase() && 
      cat.id !== selectedCategory?.id
    );
    
    if (isDuplicate) {
      setError('name', {
        type: 'manual',
        message: 'Tên danh mục đã tồn tại. Vui lòng chọn tên khác.'
      });
      toast.error('Tên danh mục đã tồn tại!');
      return;
    }

    // ✅ Kiểm tra slug trùng
    if (data.slug) {
      const trimmedSlug = data.slug.trim().toLowerCase();
      const isDuplicateSlug = categories.some(cat => 
        cat.slug && cat.slug.toLowerCase() === trimmedSlug && 
        cat.id !== selectedCategory?.id
      );
      
      if (isDuplicateSlug) {
        setError('slug', {
          type: 'manual',
          message: 'Slug đã tồn tại. Vui lòng chọn slug khác.'
        });
        toast.error('Slug đã tồn tại!');
        return;
      }
    }
    
    const submitData = {
      name: trimmedName,
      description: data.description?.trim() || '',
      is_active: data.is_active ? 1 : 0,
    }
    if (data.parent_id) submitData.parent_id = data.parent_id

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  // ✅ Hàm kiểm tra tên trùng realtime
  const checkDuplicateName = (name) => {
    if (!name || name.trim().length === 0) {
      setNameWarning('');
      return;
    }
    
    const trimmedName = name.trim();
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase() && 
      cat.id !== selectedCategory?.id
    );
    
    if (isDuplicate) {
      setNameWarning('⚠️ Tên danh mục đã tồn tại');
    } else {
      setNameWarning('');
    }
  }

  // ✅ Hàm kiểm tra slug trùng realtime
  const checkDuplicateSlug = (slug) => {
    if (!slug || slug.trim().length === 0) {
      setSlugWarning('');
      return;
    }
    
    const trimmedSlug = slug.trim().toLowerCase();
    const isDuplicate = categories.some(cat => 
      cat.slug && cat.slug.toLowerCase() === trimmedSlug && 
      cat.id !== selectedCategory?.id
    );
    
    if (isDuplicate) {
      setSlugWarning('⚠️ Slug đã tồn tại');
    } else {
      setSlugWarning('');
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.3, minWidth: 50, align: 'center', headerAlign: 'center' },
    { 
      field: 'name', 
      headerName: 'Tên danh mục', 
      flex: 1.2, 
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontWeight={500}>{params.row.name}</Typography>
      ),
    },
    { 
      field: 'description', 
      headerName: 'Mô tả', 
      flex: 2, 
      minWidth: 200,
      renderCell: (params) => (
        <Typography color="text.secondary" fontSize="0.85rem" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {params.row.description || '-'}
        </Typography>
      ),
    },
    {
      field: 'parent',
      headerName: 'Danh mục cha',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => params.row.parent?.name || '-',
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
          label={params.row.is_active ? 'Hoạt động' : 'Tắt'}
          size="small"
          sx={{
            bgcolor: params.row.is_active ? '#e8f5e9' : '#fafafa',
            color: params.row.is_active ? '#2e7d32' : '#757575',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.5,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEdit(params.row)} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row)} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <AdminPageLayout
      title="Quản lý Danh mục"
      subtitle={`${categories.length} danh mục`}
      actionButton="Thêm danh mục"
      onActionClick={handleAdd}
    >
      <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
        <DataGrid
          rows={categories}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={isLoading}
          autoHeight
          getRowHeight={() => 56}
          sx={adminDataGridStyles}
        />
      </Box>

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Typography variant="h6" fontWeight={600}>
            {selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormTextField
                  name="name"
                  control={control}
                  label="Tên danh mục *"
                  onChange={(e) => checkDuplicateName(e.target.value)}
                  helperText={nameWarning}
                  error={!!nameWarning}
                />
              </Grid>
              <Grid item xs={12}>
                <FormTextField
                  name="description"
                  control={control}
                  label="Mô tả"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormSelect
                  name="parent_id"
                  control={control}
                  label="Danh mục cha (không bắt buộc)"
                >
                  <MenuItem value="">Không có</MenuItem>
                  {categories
                    .filter(c => c.id !== selectedCategory?.id)
                    .map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                </FormSelect>
              </Grid>
              <Grid item xs={12}>
                <FormSwitch
                  name="is_active"
                  control={control}
                  label="Hoạt động"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} variant="outlined">Hủy</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedCategory ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"? Hành động này không thể hoàn tác.
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
  )
}

export default Categories
