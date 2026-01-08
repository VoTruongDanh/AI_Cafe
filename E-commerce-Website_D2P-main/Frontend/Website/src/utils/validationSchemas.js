import * as yup from 'yup'

// Regex patterns
const phoneRegex = /^0\d{9}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/

// Custom error messages
const messages = {
  required: (field) => `Vui lòng nhập ${field}`,
  email: 'Email không hợp lệ',
  phone: 'Số điện thoại phải có 10 số và bắt đầu bằng số 0',
  passwordMin: 'Mật khẩu phải có ít nhất 8 ký tự',
  passwordMatch: 'Mật khẩu xác nhận không khớp',
  passwordStrong: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  minLength: (field, min) => `${field} phải có ít nhất ${min} ký tự`,
  maxLength: (field, max) => `${field} không được vượt quá ${max} ký tự`,
}

// ==================== AUTH SCHEMAS ====================

// Login Schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .required(messages.required('email'))
    .email(messages.email),
  password: yup
    .string()
    .required(messages.required('mật khẩu'))
    .min(6, messages.minLength('Mật khẩu', 6)),
})

// Register Schema
export const registerSchema = yup.object({
  name: yup
    .string()
    .required(messages.required('họ và tên'))
    .min(2, messages.minLength('Họ và tên', 2))
    .max(100, messages.maxLength('Họ và tên', 100)),
  email: yup
    .string()
    .required(messages.required('email'))
    .email(messages.email),
  phone: yup
    .string()
    .matches(phoneRegex, { message: messages.phone, excludeEmptyString: true }),
  address: yup
    .string()
    .max(255, messages.maxLength('Địa chỉ', 255)),
  city: yup
    .string()
    .max(100, messages.maxLength('Tỉnh/Thành phố', 100)),
  ward: yup
    .string()
    .max(100, messages.maxLength('Phường/Xã', 100)),
  password: yup
    .string()
    .required(messages.required('mật khẩu'))
    .min(8, messages.passwordMin),
  passwordConfirmation: yup
    .string()
    .required(messages.required('xác nhận mật khẩu'))
    .oneOf([yup.ref('password')], messages.passwordMatch),
})

// Forgot Password Schema
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required(messages.required('email'))
    .email(messages.email),
})

// Reset Password Schema
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required(messages.required('mật khẩu mới'))
    .min(8, messages.passwordMin),
  passwordConfirmation: yup
    .string()
    .required(messages.required('xác nhận mật khẩu'))
    .oneOf([yup.ref('password')], messages.passwordMatch),
})

// ==================== CHECKOUT SCHEMA ====================

export const checkoutSchema = yup.object({
  name: yup
    .string()
    .required(messages.required('họ và tên'))
    .min(2, messages.minLength('Họ và tên', 2))
    .max(100, messages.maxLength('Họ và tên', 100)),
  phone: yup
    .string()
    .required(messages.required('số điện thoại'))
    .matches(phoneRegex, messages.phone),
  email: yup
    .string()
    .required(messages.required('email'))
    .email(messages.email),
  city: yup
    .string()
    .required('Vui lòng chọn Tỉnh/Thành phố'),
  ward: yup
    .string()
    .required('Vui lòng chọn Phường/Xã'),
  address: yup
    .string()
    .required(messages.required('địa chỉ cụ thể'))
    .min(5, messages.minLength('Địa chỉ', 5))
    .max(255, messages.maxLength('Địa chỉ', 255)),
  notes: yup
    .string()
    .max(500, messages.maxLength('Ghi chú', 500)),
})

// ==================== BUSINESS SALES SCHEMA ====================

export const businessSalesSchema = yup.object({
  companyName: yup
    .string()
    .required(messages.required('tên công ty'))
    .min(2, messages.minLength('Tên công ty', 2))
    .max(200, messages.maxLength('Tên công ty', 200)),
  taxCode: yup
    .string()
    .required(messages.required('mã số thuế'))
    .matches(/^[0-9]{10,13}$/, 'Mã số thuế phải có 10-13 chữ số'),
  contactName: yup
    .string()
    .required(messages.required('tên người liên hệ'))
    .min(2, messages.minLength('Tên người liên hệ', 2)),
  contactEmail: yup
    .string()
    .required(messages.required('email liên hệ'))
    .email(messages.email),
  contactPhone: yup
    .string()
    .required(messages.required('số điện thoại'))
    .matches(phoneRegex, messages.phone),
  message: yup
    .string()
    .max(1000, messages.maxLength('Nội dung', 1000)),
})

// ==================== PROFILE SCHEMA ====================

export const profileSchema = yup.object({
  name: yup
    .string()
    .required(messages.required('họ và tên'))
    .min(2, messages.minLength('Họ và tên', 2))
    .max(100, messages.maxLength('Họ và tên', 100)),
  phone: yup
    .string()
    .matches(phoneRegex, { message: messages.phone, excludeEmptyString: true }),
  address: yup
    .string()
    .max(255, messages.maxLength('Địa chỉ', 255)),
})

// Change Password Schema
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required(messages.required('mật khẩu hiện tại')),
  newPassword: yup
    .string()
    .required(messages.required('mật khẩu mới'))
    .min(8, messages.passwordMin)
    .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới phải khác mật khẩu hiện tại'),
  confirmPassword: yup
    .string()
    .required(messages.required('xác nhận mật khẩu'))
    .oneOf([yup.ref('newPassword')], messages.passwordMatch),
})

// ==================== REVIEW SCHEMA ====================

export const reviewSchema = yup.object({
  rating: yup
    .number()
    .required('Vui lòng chọn số sao đánh giá')
    .min(1, 'Vui lòng chọn ít nhất 1 sao')
    .max(5, 'Tối đa 5 sao'),
  title: yup
    .string()
    .max(255, messages.maxLength('Tiêu đề', 255)),
  comment: yup
    .string()
    .required(messages.required('nội dung đánh giá'))
    .min(10, messages.minLength('Nội dung đánh giá', 10))
    .max(1000, messages.maxLength('Nội dung đánh giá', 1000)),
})

// ==================== CONTACT SCHEMA ====================

export const contactSchema = yup.object({
  name: yup
    .string()
    .required(messages.required('họ và tên'))
    .min(2, messages.minLength('Họ và tên', 2)),
  email: yup
    .string()
    .required(messages.required('email'))
    .email(messages.email),
  phone: yup
    .string()
    .matches(phoneRegex, { message: messages.phone, excludeEmptyString: true }),
  subject: yup
    .string()
    .required(messages.required('tiêu đề'))
    .min(5, messages.minLength('Tiêu đề', 5)),
  message: yup
    .string()
    .required(messages.required('nội dung'))
    .min(10, messages.minLength('Nội dung', 10))
    .max(2000, messages.maxLength('Nội dung', 2000)),
})

// ==================== ADMIN SCHEMAS ====================

// Category Schema
export const categorySchema = yup.object({
  name: yup
    .string()
    .required(messages.required('tên danh mục'))
    .min(2, messages.minLength('Tên danh mục', 2))
    .max(100, messages.maxLength('Tên danh mục', 100)),
  description: yup
    .string()
    .max(500, messages.maxLength('Mô tả', 500)),
})

// Product Schema
export const productSchema = yup.object({
  name: yup
    .string()
    .required(messages.required('tên sản phẩm'))
    .min(2, messages.minLength('Tên sản phẩm', 2))
    .max(255, messages.maxLength('Tên sản phẩm', 255)),
  price: yup
    .number()
    .required(messages.required('giá'))
    .positive('Giá phải lớn hơn 0')
    .typeError('Giá phải là số'),
  category_id: yup
    .number()
    .required('Vui lòng chọn danh mục')
    .typeError('Vui lòng chọn danh mục'),
  description: yup
    .string()
    .max(5000, messages.maxLength('Mô tả', 5000)),
  stock_quantity: yup
    .number()
    .min(0, 'Số lượng không được âm')
    .typeError('Số lượng phải là số'),
})

export default {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkoutSchema,
  businessSalesSchema,
  profileSchema,
  changePasswordSchema,
  reviewSchema,
  contactSchema,
  categorySchema,
  productSchema,
}
