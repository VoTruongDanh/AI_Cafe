// Application Constants
export const HOTLINE = import.meta.env.VITE_HOTLINE || '1900 1599'
export const HOTLINE_DISPLAY = import.meta.env.VITE_HOTLINE_DISPLAY || '1900 1599'
export const HOTLINE_LINK = import.meta.env.VITE_HOTLINE_LINK || 'tel:19001599'

export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@electroshop.vn'
export const INFO_EMAIL = import.meta.env.VITE_INFO_EMAIL || 'info@electroshop.vn'

export const ADDRESS_LINE = import.meta.env.VITE_ADDRESS_LINE || '123 Nguyễn Huệ, Quận 1'
export const ADDRESS_CITY = import.meta.env.VITE_ADDRESS_CITY || 'Hồ Chí Minh, Việt Nam'

// Feature Flags
export const GOOGLE_OAUTH_ENABLED = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === 'true'
export const FACEBOOK_OAUTH_ENABLED = import.meta.env.VITE_FACEBOOK_OAUTH_ENABLED === 'true'
