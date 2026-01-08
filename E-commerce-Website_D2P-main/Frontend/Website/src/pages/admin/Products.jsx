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
  Paper,
  Divider,
  Card,
  CardMedia,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Collections as CollectionsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS, ADMIN_GRID_STYLES } from '../../constants/adminTheme';
import { adminProductsApi, adminCategoriesApi, adminSuppliersApi } from '../../services/api';
import { getImageUrl } from '../../services/utils';
import { productSchema } from '../../validations/adminSchemas';
import FormTextField from '../../components/common/FormTextField';
import FormSelect from '../../components/common/FormSelect';
import FormSwitch from '../../components/common/FormSwitch';
// ❌ Removed: import { useProductsWebSocket } from '../../hooks/useProductsWebSocket';

// Khớp với database schema
const initialFormState = {
  name: '',
  slug: '',
  sku: '',
  thumbnail: '',
  short_description: '',
  description: '',
  attributes: '',
  category_id: '',
  supplier_id: '',
  original_price: '',
  price: '',
  quantity: '',
  reorder_point: '',
  is_featured: false,
  status: 'draft', // Mặc định là "Nháp", khi nhập kho sẽ tự động chuyển sang "Đang bán"
  warranty_months: '',
  weight: '',
  dimensions: '',
  images: [],
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

// Templates thông số kỹ thuật theo loại sản phẩm
const ATTRIBUTE_TEMPLATES = {
  laptop: [
    { label: 'CPU', key: 'cpu', placeholder: 'VD: Intel Core i7-12700H' },
    { label: 'RAM', key: 'ram', placeholder: 'VD: 16GB DDR4' },
    { label: 'Ổ cứng', key: 'storage', placeholder: 'VD: SSD 512GB NVMe' },
    { label: 'VGA', key: 'gpu', placeholder: 'VD: NVIDIA RTX 3060 6GB' },
    { label: 'Màn hình', key: 'screen', placeholder: 'VD: 15.6" FHD IPS 144Hz' },
    { label: 'Pin', key: 'battery', placeholder: 'VD: 56Wh' },
    { label: 'Hệ điều hành', key: 'os', placeholder: 'VD: Windows 11 Home' },
  ],
  phone: [
    { label: 'Màn hình', key: 'screen', placeholder: 'VD: 6.7" AMOLED 120Hz' },
    { label: 'Camera sau', key: 'rear_camera', placeholder: 'VD: 50MP + 12MP + 10MP' },
    { label: 'Camera trước', key: 'front_camera', placeholder: 'VD: 12MP' },
    { label: 'Chipset', key: 'chipset', placeholder: 'VD: Snapdragon 8 Gen 2' },
    { label: 'RAM', key: 'ram', placeholder: 'VD: 8GB' },
    { label: 'Bộ nhớ', key: 'storage', placeholder: 'VD: 256GB' },
    { label: 'Pin', key: 'battery', placeholder: 'VD: 5000mAh, sạc nhanh 67W' },
    { label: 'Hệ điều hành', key: 'os', placeholder: 'VD: Android 13' },
  ],
  tablet: [
    { label: 'Màn hình', key: 'screen', placeholder: 'VD: 11" LCD 120Hz' },
    { label: 'Chipset', key: 'chipset', placeholder: 'VD: Snapdragon 870' },
    { label: 'RAM', key: 'ram', placeholder: 'VD: 6GB' },
    { label: 'Bộ nhớ', key: 'storage', placeholder: 'VD: 128GB' },
    { label: 'Pin', key: 'battery', placeholder: 'VD: 8600mAh' },
    { label: 'Camera', key: 'camera', placeholder: 'VD: Sau 13MP, Trước 8MP' },
    { label: 'Hệ điều hành', key: 'os', placeholder: 'VD: iPadOS 17' },
  ],
  watch: [
    { label: 'Màn hình', key: 'screen', placeholder: 'VD: 1.4" AMOLED' },
    { label: 'Kết nối', key: 'connectivity', placeholder: 'VD: Bluetooth 5.2, WiFi' },
    { label: 'Cảm biến', key: 'sensors', placeholder: 'VD: Nhịp tim, SpO2, GPS' },
    { label: 'Pin', key: 'battery', placeholder: 'VD: 7 ngày sử dụng' },
    { label: 'Chống nước', key: 'water_resistant', placeholder: 'VD: 5ATM' },
    { label: 'Hệ điều hành', key: 'os', placeholder: 'VD: WearOS 4' },
  ],
  headphone: [
    { label: 'Driver', key: 'driver', placeholder: 'VD: 40mm Dynamic' },
    { label: 'Kết nối', key: 'connectivity', placeholder: 'VD: Bluetooth 5.3, Jack 3.5mm' },
    { label: 'Chống ồn', key: 'anc', placeholder: 'VD: ANC -35dB' },
    { label: 'Pin', key: 'battery', placeholder: 'VD: 30 giờ nghe nhạc' },
    { label: 'Codec', key: 'codec', placeholder: 'VD: LDAC, aptX HD, AAC' },
    { label: 'Tính năng', key: 'features', placeholder: 'VD: Multipoint, Spatial Audio' },
  ],
  accessory: [
    { label: 'Tương thích', key: 'compatibility', placeholder: 'VD: iPhone 12 trở lên' },
    { label: 'Chất liệu', key: 'material', placeholder: 'VD: Nhôm nguyên khối' },
    { label: 'Công suất', key: 'power', placeholder: 'VD: 65W GaN' },
    { label: 'Cổng kết nối', key: 'ports', placeholder: 'VD: 2x USB-C, 1x USB-A' },
    { label: 'Tính năng', key: 'features', placeholder: 'VD: Sạc nhanh PD 3.0' },
  ],
};

const Products = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  // Gallery state
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [attributeTemplate, setAttributeTemplate] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  // ✅ Duplicate validation states
  const [skuWarning, setSkuWarning] = useState('');
  const [slugWarning, setSlugWarning] = useState('');
  const [nameWarning, setNameWarning] = useState('');

  const { control, handleSubmit, reset, setError, watch, setValue } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: initialFormState,
    mode: 'onChange',
  });

  const categoryId = watch('category_id');
  const productName = watch('name');

  // Fetch products
  const { data: productsData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      console.log('🔄 Fetching products from API...');
      const response = await adminProductsApi.getAll({ 
        per_page: 1000
      });
      const products = response.data?.data || response.data || [];
      console.log('✅ Products fetched:', products.length);
      return products;
    },
    staleTime: 0, // ✅ Không cache, luôn fetch mới
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminCategoriesApi.getAll();
      return response.data?.data || response.data || [];
    },
  });

  // Fetch suppliers for dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const response = await adminSuppliersApi.getAll();
      return response.data?.data || response.data || [];
    },
  });

  const products = productsData || [];
  const categories = categoriesData || [];
  const suppliers = suppliersData || [];

  // ❌ Removed WebSocket - Admin chỉ cần F5 để refresh
  // Mutations vẫn tự động refetch sau khi save

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !categoryFilter || product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminProductsApi.create(data),
    onSuccess: async (response) => {
      console.log('✅ Product created:', response.data);
      // ✅ Refetch ngay lập tức
      await queryClient.refetchQueries(['admin-products']);
      console.log('🔄 Products list refreshed after create');
      toast.success('Thêm sản phẩm thành công!');
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
    mutationFn: ({ id, data }) => adminProductsApi.update(id, data),
    onSuccess: async () => {
      // ✅ Refetch ngay lập tức
      await queryClient.refetchQueries(['admin-products']);
      toast.success('Cập nhật sản phẩm thành công!');
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
    mutationFn: (id) => adminProductsApi.delete(id),
    onSuccess: async () => {
      // ✅ Refetch ngay lập tức
      await queryClient.refetchQueries(['admin-products']);
      toast.success('Xóa sản phẩm thành công!');
      setOpenDeleteDialog(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      
      // Lấy lý do đầu tiên
      let message = 'Không thể xóa sản phẩm';
      
      if (errorData?.reasons && Array.isArray(errorData.reasons) && errorData.reasons.length > 0) {
        // Loại bỏ số khỏi message (ví dụ: "20 đơn hàng" -> "đơn hàng")
        const reason = errorData.reasons[0]
          .replace(/\d+\s*/g, '') // Xóa tất cả số và khoảng trắng sau số
          .replace(/^\s+/, '') // Xóa khoảng trắng đầu
          .toLowerCase();
        message = `Không thể xóa sản phẩm vì ${reason}`;
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
  const handleOpenDialog = async (product = null) => {
    if (product) {
      // ✅ Gọi API để lấy đầy đủ thông tin sản phẩm
      try {
        const response = await adminProductsApi.getById(product.id);
        const fullProduct = response.data;
        
        setSelectedProduct(fullProduct);
        reset({
          name: fullProduct.name || '',
          slug: fullProduct.slug || '',
          sku: fullProduct.sku || '',
          thumbnail: fullProduct.thumbnail || '',
          short_description: fullProduct.short_description || '',
          description: fullProduct.description || '',
          attributes: fullProduct.attributes || '',
          category_id: fullProduct.category_id || '',
          supplier_id: fullProduct.supplier_id || '',
          original_price: fullProduct.original_price || null,
          price: fullProduct.price || null,
          quantity: fullProduct.quantity || null,
          reorder_point: fullProduct.reorder_point || null,
          is_featured: fullProduct.is_featured ?? false,
          status: fullProduct.status || 'draft',
          warranty_months: fullProduct.warranty_months || null,
          weight: fullProduct.weight || null,
          dimensions: fullProduct.dimensions || '',
          images: fullProduct.images || [],
        });
        // Set thumbnail preview
        if (fullProduct.thumbnail) {
          setThumbnailPreview(getImageUrl(fullProduct.thumbnail));
        }
        // Set gallery previews
        if (fullProduct.images && fullProduct.images.length > 0) {
          setGalleryPreviews(
            fullProduct.images.map((img) =>
              getImageUrl(typeof img === 'string' ? img : img.path)
            )
          );
        }
      } catch (error) {
        toast.error('Không thể tải thông tin sản phẩm');
        console.error('Error loading product:', error);
        return;
      }
    } else {
      setSelectedProduct(null);
      reset(initialFormState);
      setThumbnailPreview('');
      setGalleryPreviews([]);
    }
    setThumbnailFile(null);
    setGalleryFiles([]);
    setAttributeTemplate({});
    setSelectedTemplate('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    reset(initialFormState);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setAttributeTemplate({});
    setSelectedTemplate('');
    setSkuWarning(''); // ✅ Reset warning
    setSlugWarning(''); // ✅ Reset slug warning
    setNameWarning(''); // ✅ Reset name warning
  };

  // Handle Thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setValue('thumbnail', '');
  };

  // Handle Gallery upload
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryImage = (index) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSlug = () => {
    // Tạo slug từ tên sản phẩm
    const nameSlug = productName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Nếu có category_id, thêm category slug vào trước
    if (categoryId) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.slug) {
        setValue('slug', `${category.slug}/${nameSlug}`);
        return;
      }
    }
    setValue('slug', nameSlug);
  };

  // Hàm tạo SKU tự động
  const generateSKU = (categoryIdParam) => {
    const catId = categoryIdParam || categoryId;
    if (!catId) return '';
    
    const category = categories.find(cat => cat.id === catId);
    if (!category) return '';
    
    // Lấy prefix từ tên category (3-4 ký tự đầu, viết hoa)
    const prefix = category.slug
      ? category.slug.toUpperCase().replace(/-/g, '').substring(0, 4)
      : category.name.substring(0, 4).toUpperCase();
    
    // Tạo mã random 6 ký tự (số + chữ)
    const timestamp = Date.now().toString(36).toUpperCase().substring(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${prefix}-${timestamp}${random}`;
  };

  const handleGenerateSKU = () => {
    const newSKU = generateSKU();
    if (newSKU) {
      setValue('sku', newSKU);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (template && ATTRIBUTE_TEMPLATES[template]) {
      const newTemplate = {};
      ATTRIBUTE_TEMPLATES[template].forEach(attr => {
        newTemplate[attr.key] = '';
      });
      setAttributeTemplate(newTemplate);
    } else {
      setAttributeTemplate({});
    }
  };

  const handleAttributeChange = (key, value) => {
    setAttributeTemplate(prev => ({ ...prev, [key]: value }));
  };

  const generateAttributesString = () => {
    const attrs = Object.entries(attributeTemplate)
      .filter(([_, value]) => value && value.trim())
      .map(([key, value]) => {
        const template = ATTRIBUTE_TEMPLATES[selectedTemplate]?.find(t => t.key === key);
        return `${template?.label || key}: ${value}`;
      })
      .join('\n');
    return attrs;
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
    // ✅ Check SKU duplicate
    const trimmedSKU = data.sku?.trim().toUpperCase();
    if (trimmedSKU) {
      const isDuplicate = products.some(p => 
        p.sku && p.sku.toUpperCase() === trimmedSKU && 
        p.id !== selectedProduct?.id
      );
      
      if (isDuplicate) {
        setError('sku', {
          type: 'manual',
          message: 'Mã SKU đã tồn tại. Vui lòng chọn mã khác.'
        });
        toast.error('Mã SKU đã tồn tại!');
        return;
      }
    }

    // ✅ Check Slug duplicate
    if (data.slug) {
      const trimmedSlug = data.slug.trim().toLowerCase();
      const isDuplicateSlug = products.some(p => 
        p.slug && p.slug.toLowerCase() === trimmedSlug && 
        p.id !== selectedProduct?.id
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

    // ✅ Check Name duplicate (warning only, not blocking)
    if (data.name) {
      const trimmedName = data.name.trim().toLowerCase();
      const isDuplicateName = products.some(p => 
        p.name && p.name.toLowerCase() === trimmedName && 
        p.id !== selectedProduct?.id
      );
      
      if (isDuplicateName) {
        setError('name', {
          type: 'manual',
          message: 'Tên sản phẩm đã tồn tại. Bạn có chắc muốn tiếp tục?'
        });
        toast.warning('Tên sản phẩm đã tồn tại!');
        return;
      }
    }
    
    // Generate attributes from template if selected
    const finalAttributes = selectedTemplate ? generateAttributesString() : data.attributes;

    const submitData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key !== 'images' && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        // Convert boolean to 1/0 for FormData
        if (key === 'is_featured') {
          submitData.append(key, data[key] ? '1' : '0');
        } else if (key === 'attributes') {
          // Use template-generated attributes if available
          if (finalAttributes) {
            submitData.append(key, finalAttributes);
          }
        } else {
          submitData.append(key, data[key]);
        }
      }
    });

    // Append attributes even if not in data but has template values
    if (!data.attributes && finalAttributes) {
      submitData.append('attributes', finalAttributes);
    }

    // Append thumbnail file (ảnh chính)
    if (thumbnailFile) {
      submitData.append('thumbnail_file', thumbnailFile);
    }

    // Append gallery files (ảnh bộ sưu tập)
    galleryFiles.forEach((file) => {
      submitData.append('gallery_files[]', file);
    });

    if (selectedProduct) {
      submitData.append('_method', 'PUT');
      updateMutation.mutate({ id: selectedProduct.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // ✅ Check duplicate SKU realtime
  const checkDuplicateSKU = (sku) => {
    if (!sku || sku.trim().length === 0) {
      setSkuWarning('');
      return;
    }
    
    const trimmedSKU = sku.trim().toUpperCase();
    const isDuplicate = products.some(p => 
      p.sku && p.sku.toUpperCase() === trimmedSKU && 
      p.id !== selectedProduct?.id
    );
    
    if (isDuplicate) {
      setSkuWarning('⚠️ Mã SKU đã tồn tại');
    } else {
      setSkuWarning('');
    }
  };

  // ✅ Check duplicate Slug realtime
  const checkDuplicateSlug = (slug) => {
    if (!slug || slug.trim().length === 0) {
      setSlugWarning('');
      return;
    }
    
    const trimmedSlug = slug.trim().toLowerCase();
    const isDuplicate = products.some(p => 
      p.slug && p.slug.toLowerCase() === trimmedSlug && 
      p.id !== selectedProduct?.id
    );
    
    if (isDuplicate) {
      setSlugWarning('⚠️ Slug đã tồn tại');
    } else {
      setSlugWarning('');
    }
  };

  // ✅ Check duplicate Name realtime
  const checkDuplicateName = (name) => {
    if (!name || name.trim().length === 0) {
      setNameWarning('');
      return;
    }
    
    const trimmedName = name.trim().toLowerCase();
    const isDuplicate = products.some(p => 
      p.name && p.name.toLowerCase() === trimmedName && 
      p.id !== selectedProduct?.id
    );
    
    if (isDuplicate) {
      setNameWarning('⚠️ Tên sản phẩm đã tồn tại');
    } else {
      setNameWarning('');
    }
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const columns = [
    {
      field: 'image',
      headerName: 'Ảnh',
      flex: 0.3,
      minWidth: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar
          src={getImageUrl(
            params.row.thumbnail ||
            params.row.images?.[0]?.path
          )}
          variant="rounded"
          sx={{ width: 45, height: 45 }}
        >
          <InventoryIcon />
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Tên sản phẩm',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ overflow: 'hidden', width: '100%' }}>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            SKU: {params.row.sku || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Danh mục',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
          {params.row.category?.name || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'price',
      headerName: 'Giá bán',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="error.main" fontSize="0.85rem">
            {formatCurrency(params.row.price)}
          </Typography>
          {params.row.original_price > params.row.price && (
            <Typography
              variant="caption"
              sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.7rem' }}
            >
              {formatCurrency(params.row.original_price)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Tồn kho',
      flex: 0.5,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          size="small"
          color={
            params.value > 10
              ? 'success'
              : params.value > 0
                ? 'warning'
                : 'error'
          }
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 0.6,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const statusMap = {
          published: { label: 'Đang bán', color: 'success' },
          draft: { label: 'Chưa bán', color: 'default' },
          discontinued: { label: 'Dừng bán', color: 'error' },
        }
        const status = statusMap[params.value] || statusMap.draft
        return (
          <Chip
            label={status.label}
            size="small"
            color={status.color}
          />
        )
      },
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
        <Box>
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
      title="Quản lý sản phẩm"
      subtitle={`Tổng cộng ${filteredProducts.length} sản phẩm`}
      actionButton={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => queryClient.refetchQueries(['admin-products'])}
            disabled={isFetching}
            sx={{
              borderColor: ADMIN_COLORS.primary,
              color: ADMIN_COLORS.primary,
              '&:hover': { 
                borderColor: ADMIN_COLORS.secondary,
                bgcolor: 'rgba(211, 47, 47, 0.04)'
              },
            }}
          >
            {isFetching ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: ADMIN_COLORS.primary,
              '&:hover': { bgcolor: ADMIN_COLORS.secondary },
            }}
          >
            Thêm sản phẩm
          </Button>
        </Box>
      }
    >
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm sản phẩm..."
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={categoryFilter}
            label="Danh mục"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Data Grid */}
      <Box sx={{ width: '100%', maxHeight: 800, overflow: 'auto' }}>
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          loading={isLoading || isFetching}
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: ADMIN_COLORS.primary, color: 'white' }}>
          {selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Thông tin cơ bản
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <FormTextField
                name="name"
                control={control}
                label="Tên sản phẩm *"
                onChange={(e) => checkDuplicateName(e.target.value)}
                helperText={nameWarning}
                error={!!nameWarning}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormTextField
                name="sku"
                control={control}
                label="SKU"
                onChange={(e) => checkDuplicateSKU(e.target.value)}
                InputProps={{
                  readOnly: !selectedProduct,
                  endAdornment: !selectedProduct && (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={handleGenerateSKU}
                        disabled={!categoryId}
                      >
                        Tạo mới
                      </Button>
                    </InputAdornment>
                  ),
                }}
                helperText={skuWarning || (!selectedProduct ? "Tự động tạo khi chọn danh mục" : "")}
                error={!!skuWarning}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <FormTextField
                name="slug"
                control={control}
                label="Slug"
                onChange={(e) => checkDuplicateSlug(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={generateSlug}
                        disabled={!productName}
                      >
                        Tạo tự động
                      </Button>
                    </InputAdornment>
                  ),
                }}
                helperText={slugWarning || (categoryId ? `Slug theo danh mục: ${categories.find(c => c.id === categoryId)?.slug || ''}` : "Chọn danh mục để xem slug")}
                error={!!slugWarning}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormTextField
                name="warranty_months"
                control={control}
                label="Bảo hành (tháng)"
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="short_description"
                control={control}
                label="Mô tả ngắn"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                name="description"
                control={control}
                label="Mô tả chi tiết"
                multiline
                rows={3}
              />
            </Grid>

            {/* Category & Supplier */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Danh mục & Nhà cung cấp
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormSelect
                name="category_id"
                control={control}
                label="Danh mục *"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormSelect
                name="supplier_id"
                control={control}
                label="Nhà cung cấp"
              >
                <MenuItem value="">Không chọn</MenuItem>
                {suppliers.map((sup) => (
                  <MenuItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>

            {/* Pricing */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Giá cả
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="price"
                control={control}
                label="Giá bán *"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">VNĐ</InputAdornment>
                  ),
                }}
                helperText="Giá khách hàng phải trả"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField
                name="original_price"
                control={control}
                label="Giá nhập"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">VNĐ</InputAdornment>
                  ),
                }}
                helperText="Giá nhập từ nhà cung cấp"
              />
            </Grid>

            {/* Inventory */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Kho hàng & Vận chuyển
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Số lượng"
                name="quantity"
                type="number"
                value={0}
                disabled
                size="small"
                helperText="Số lượng được cập nhật khi nhập kho"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormTextField
                name="reorder_point"
                control={control}
                label="Điểm đặt hàng lại"
                type="number"
                inputProps={{ min: 0 }}
                helperText="Cảnh báo khi tồn kho thấp"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormTextField
                name="weight"
                control={control}
                label="Trọng lượng (gram)"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormTextField
                name="dimensions"
                control={control}
                label="Kích thước (DxRxC)"
                inputProps={{ placeholder: "VD: 20x15x10" }}
              />
            </Grid>

            {/* Attributes */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Thông số kỹ thuật
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Chọn template thông số</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Chọn template thông số"
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <MenuItem value="">Nhập tự do</MenuItem>
                  <MenuItem value="laptop">💻 Laptop</MenuItem>
                  <MenuItem value="phone">📱 Điện thoại</MenuItem>
                  <MenuItem value="tablet">📲 Máy tính bảng</MenuItem>
                  <MenuItem value="watch">⌚ Đồng hồ thông minh</MenuItem>
                  <MenuItem value="headphone">🎧 Tai nghe</MenuItem>
                  <MenuItem value="accessory">🔌 Phụ kiện</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {selectedTemplate && ATTRIBUTE_TEMPLATES[selectedTemplate] && (
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    📋 Điền thông tin vào các trường bên dưới:
                  </Typography>
                  <Grid container spacing={2}>
                    {ATTRIBUTE_TEMPLATES[selectedTemplate].map((attr) => (
                      <Grid item xs={12} sm={6} key={attr.key}>
                        <TextField
                          fullWidth
                          label={attr.label}
                          value={attributeTemplate[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          placeholder={attr.placeholder}
                          size="small"
                          sx={{ bgcolor: 'white' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  {Object.values(attributeTemplate).some(v => v) && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        👁️ Xem trước:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                        {generateAttributesString()}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}

            {!selectedTemplate && (
              <Grid item xs={12}>
                <FormTextField
                  name="attributes"
                  control={control}
                  label="Thuộc tính sản phẩm (Nhập tự do)"
                  multiline
                  rows={4}
                  inputProps={{ placeholder: "RAM: 16GB\nCPU: Intel i7\nSSD: 512GB" }}
                  helperText="Mỗi dòng một thuộc tính. Hoặc chọn template ở trên để nhập nhanh hơn!"
                />
              </Grid>
            )}

            {/* Status */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Trạng thái
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormSelect
                name="status"
                control={control}
                label="Trạng thái"
              >
                <MenuItem value="draft">Chưa bán</MenuItem>
                <MenuItem value="published">Đang bán</MenuItem>
                <MenuItem value="discontinued">Dừng bán</MenuItem>
              </FormSelect>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormSwitch
                name="is_featured"
                control={control}
                label="Sản phẩm nổi bật"
              />
            </Grid>

            {/* Images Section - Thumbnail + Gallery */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                HÌNH ẢNH SẢN PHẨM
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Thumbnail - Ảnh chính */}
            <Grid item xs={12} md={4}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  borderColor: thumbnailPreview ? 'success.main' : 'grey.400',
                  bgcolor: thumbnailPreview ? 'success.50' : 'grey.50',
                }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PhotoCameraIcon color="primary" />
                  Ảnh đại diện (Thumbnail)
                </Typography>
                
                {thumbnailPreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block', mt: 1 }}>
                    <Card sx={{ maxWidth: 200, margin: '0 auto' }}>
                      <CardMedia
                        component="img"
                        height="150"
                        image={thumbnailPreview}
                        alt="Thumbnail preview"
                        sx={{ objectFit: 'cover' }}
                      />
                    </Card>
                    <IconButton
                      size="small"
                      onClick={handleRemoveThumbnail}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ py: 3 }}>
                    <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Ảnh hiển thị chính trên website
                    </Typography>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  component="label"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={{ mt: 2 }}
                >
                  {thumbnailPreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                </Button>
              </Paper>
            </Grid>

            {/* Gallery - Bộ sưu tập ảnh */}
            <Grid item xs={12} md={8}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderStyle: 'dashed',
                  borderColor: galleryPreviews.length > 0 ? 'info.main' : 'grey.400',
                  bgcolor: galleryPreviews.length > 0 ? 'info.50' : 'grey.50',
                  minHeight: 200,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CollectionsIcon color="info" />
                    Bộ sưu tập ảnh ({galleryPreviews.length} ảnh)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                    color="info"
                  >
                    Thêm ảnh
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleGalleryChange}
                    />
                  </Button>
                </Box>
                
                {galleryPreviews.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {galleryPreviews.map((preview, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <Card sx={{ width: 100, height: 100 }}>
                          <CardMedia
                            component="img"
                            height="100"
                            image={preview}
                            alt={`Gallery ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                        </Card>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveGalleryImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                            width: 22,
                            height: 22,
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CollectionsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Thêm nhiều ảnh để khách hàng xem chi tiết sản phẩm
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Có thể chọn nhiều ảnh cùng lúc)
                    </Typography>
                  </Box>
                )}
              </Paper>
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
            {selectedProduct ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? Hành
            động này không thể hoàn tác.
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

export default Products;
