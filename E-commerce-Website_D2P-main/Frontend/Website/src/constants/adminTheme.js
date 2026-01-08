export const ADMIN_COLORS = {
  primary: '#1976d2',
  primaryDark: '#115293',
  primaryLight: '#42a5f5',
  secondary: '#115293',
  dark: '#1a1a1a',
  surface: '#f8f9fa',
  card: '#ffffff',
  border: '#e0e0e0',
  muted: '#757575',
  accent: '#ff9800',
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
}

export const ADMIN_GRADIENT = 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)'

export const ADMIN_SHADOW = '0 2px 8px rgba(0, 0, 0, 0.08)'
export const ADMIN_SHADOW_HOVER = '0 4px 16px rgba(0, 0, 0, 0.12)'

export const ADMIN_GRID_STYLES = {
  fontSize: '0.95rem',
  backgroundColor: '#fff',
  border: `1px solid ${ADMIN_COLORS.border}`,
  borderRadius: 2,
  width: '100%',
  '& .MuiDataGrid-main': {
    overflow: 'auto',
  },
  '& .MuiDataGrid-columnHeaders': {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: ADMIN_COLORS.dark,
    textTransform: 'none',
    minHeight: '56px !important',
    backgroundColor: '#f5f5f5',
    borderBottom: `2px solid ${ADMIN_COLORS.border}`,
  },
  '& .MuiDataGrid-columnHeader': {
    borderRight: `1px solid ${ADMIN_COLORS.border}`,
    '&:last-child': {
      borderRight: 'none',
    },
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'rgba(25, 118, 210, 0.04)',
  },
  '& .MuiDataGrid-row:nth-of-type(even)': {
    backgroundColor: '#fafafa',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${ADMIN_COLORS.border}`,
    borderRight: `1px solid ${ADMIN_COLORS.border}`,
    '&:last-child': {
      borderRight: 'none',
    },
  },
  '& .MuiDataGrid-footerContainer': {
    minHeight: '56px',
    backgroundColor: '#fff',
    borderTop: `2px solid ${ADMIN_COLORS.border}`,
  },
  '& .MuiDataGrid-row': {
    minHeight: '64px !important',
  },
  '& .MuiCheckbox-root .MuiSvgIcon-root': {
    fontSize: '1.4rem',
  },
  '& .MuiDataGrid-virtualScroller': {
    overflowX: 'auto',
  },
}
