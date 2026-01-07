import * as yup from 'yup'

// ==================== PRODUCTS ====================
export const productSchema = yup.object({
  name: yup
    .string()
    .required('Tên sản phẩm là bắt buộc')
    .max(255, 'Tên sản phẩm không được quá 255 ký tự'),
  
  sku: yup
    .string()
    .nullable()
    .max(100, 'SKU không được quá 100 ký tự'),
  
  short_description: yup
    .string()
    .nullable()
    .max(500, 'Mô tả ngắn không được quá 500 ký tự'),
  
  description: yup
    .string()
    .nullable(),
  
  category_id: yup
    .number()
    .required('Vui lòng chọn danh mục')
    .positive('Danh mục không hợp lệ'),
  
  supplier_id: yup
    .number()
    .nullable()
    .positive('Nhà cung cấp không hợp lệ'),
  
  price: yup
    .number()
    .required('Giá bán là bắt buộc')
    .min(0, 'Giá bán phải lớn hơn hoặc bằng 0')
    .typeError('Giá bán phải là số'),
  
  original_price: yup
    .number()
    .nullable()
    .min(0, 'Giá nhập phải lớn hơn hoặc bằng 0')
    .typeError('Giá nhập phải là số'),
  
  reorder_point: yup
    .number()
    .nullable()
    .min(0, 'Điểm đặt hàng lại phải lớn hơn hoặc bằng 0')
    .integer('Điểm đặt hàng lại phải là số nguyên')
    .typeError('Điểm đặt hàng lại phải là số'),
  
  weight: yup
    .number()
    .nullable()
    .min(0, 'Trọng lượng phải lớn hơn hoặc bằng 0')
    .typeError('Trọng lượng phải là số'),
  
  dimensions: yup
    .string()
    .nullable()
    .max(50, 'Kích thước không được quá 50 ký tự'),
  
  warranty_months: yup
    .number()
    .nullable()
    .min(0, 'Thời gian bảo hành phải lớn hơn hoặc bằng 0')
    .integer('Thời gian bảo hành phải là số nguyên')
    .typeError('Thời gian bảo hành phải là số'),
  
  status: yup
    .string()
    .oneOf(['published', 'draft', 'discontinued'], 'Trạng thái không hợp lệ'),
  
  is_featured: yup
    .boolean(),
  
  is_flash_sale: yup
    .boolean(),
})

// ==================== CATEGORIES ====================
export const categorySchema = yup.object({
  name: yup
    .string()
    .required('Tên danh mục là bắt buộc')
    .max(255, 'Tên danh mục không được quá 255 ký tự'),
  
  description: yup
    .string()
    .nullable(),
  
  parent_id: yup
    .number()
    .nullable()
    .positive('Danh mục cha không hợp lệ'),
  
  is_active: yup
    .boolean(),
})

// ==================== PROMOTIONS ====================
export const promotionSchema = yup.object({
  code: yup
    .string()
    .required('Mã khuyến mãi là bắt buộc')
    .max(50, 'Mã khuyến mãi không được quá 50 ký tự')
    .matches(/^[A-Z0-9_-]+$/, 'Mã chỉ được chứa chữ in hoa, số, gạch ngang và gạch dưới'),
  
  name: yup
    .string()
    .required('Tên khuyến mãi là bắt buộc')
    .max(255, 'Tên khuyến mãi không được quá 255 ký tự'),
  
  description: yup
    .string()
    .nullable(),
  
  promotion_type: yup
    .string()
    .required('Vui lòng chọn loại khuyến mãi')
    .oneOf(['percentage', 'fixed'], 'Loại khuyến mãi không hợp lệ'),
  
  value: yup
    .number()
    .required('Giá trị giảm là bắt buộc')
    .min(0, 'Giá trị giảm phải lớn hơn hoặc bằng 0')
    .when('promotion_type', {
      is: 'percentage',
      then: (schema) => schema.max(100, 'Giảm % không được quá 100%'),
    })
    .typeError('Giá trị giảm phải là số'),
  
  min_order_value: yup
    .number()
    .nullable()
    .min(0, 'Đơn tối thiểu phải lớn hơn hoặc bằng 0')
    .typeError('Đơn tối thiểu phải là số'),
  
  max_discount_value: yup
    .number()
    .nullable()
    .min(0, 'Giảm tối đa phải lớn hơn hoặc bằng 0')
    .typeError('Giảm tối đa phải là số'),
  
  usage_limit: yup
    .number()
    .nullable()
    .min(0, 'Số lần sử dụng phải lớn hơn hoặc bằng 0')
    .integer('Số lần sử dụng phải là số nguyên')
    .typeError('Số lần sử dụng phải là số'),
  
  starts_at: yup
    .date()
    .nullable()
    .typeError('Ngày bắt đầu không hợp lệ'),
  
  ends_at: yup
    .date()
    .nullable()
    .min(yup.ref('starts_at'), 'Ngày kết thúc phải sau ngày bắt đầu')
    .typeError('Ngày kết thúc không hợp lệ'),
  
  is_active: yup
    .boolean(),
  
  is_flash_sale: yup
    .boolean(),
})

// ==================== USERS ====================
export const userSchema = yup.object({
  name: yup
    .string()
    .required('Tên người dùng là bắt buộc')
    .max(255, 'Tên không được quá 255 ký tự'),
  
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ')
    .max(255, 'Email không được quá 255 ký tự'),
  
  password: yup
    .string()
    .when('$isEdit', {
      is: false,
      then: (schema) => schema
        .required('Mật khẩu là bắt buộc')
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
      otherwise: (schema) => schema
        .transform((value) => value === '' ? null : value)
        .nullable()
        .test('min-length', 'Mật khẩu phải có ít nhất 8 ký tự', (value) => {
          if (!value) return true; // Cho phép null/undefined khi edit
          return value.length >= 8;
        }),
    }),
  
  phone: yup
    .string()
    .nullable()
    .transform((value) => value === '' ? null : value)
    .test('phone-format', 'Số điện thoại phải có 10 số và bắt đầu bằng số 0', (value) => {
      if (!value) return true; // Cho phép null/undefined
      return /^0\d{9}$/.test(value);
    }),
  
  address_line: yup
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .max(255, 'Địa chỉ không được quá 255 ký tự'),
  
  ward: yup
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .max(100, 'Phường/Xã không được quá 100 ký tự'),
  
  city: yup
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .max(100, 'Thành phố không được quá 100 ký tự'),
  
  role: yup
    .string()
    .required('Vui lòng chọn vai trò')
    .oneOf(['admin', 'staff', 'customer'], 'Vai trò không hợp lệ'),
  
  is_active: yup
    .boolean(),
})

// ==================== INVENTORY ====================
export const inventoryItemSchema = yup.object({
  product_id: yup
    .number()
    .required('Vui lòng chọn sản phẩm')
    .positive('Sản phẩm không hợp lệ'),
  
  quantity: yup
    .number()
    .required('Số lượng là bắt buộc')
    .min(1, 'Số lượng phải lớn hơn hoặc bằng 1')
    .integer('Số lượng phải là số nguyên')
    .typeError('Số lượng phải là số'),
  
  unit_cost: yup
    .number()
    .required('Đơn giá là bắt buộc')
    .min(0, 'Đơn giá phải lớn hơn hoặc bằng 0')
    .typeError('Đơn giá phải là số'),
})

export const inventorySchema = yup.object({
  supplier_id: yup
    .number()
    .nullable()
    .positive('Nhà cung cấp không hợp lệ'),
  
  notes: yup
    .string()
    .nullable(),
  
  items: yup
    .array()
    .of(inventoryItemSchema)
    .min(1, 'Phải có ít nhất 1 sản phẩm'),
})
