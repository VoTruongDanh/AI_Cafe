import { Box, Typography, Button, Paper } from '@mui/material'
import { Add } from '@mui/icons-material'

/**
 * Admin Page Layout - Layout chung cho tất cả trang admin
 * Đảm bảo giao diện đồng nhất và chuyên nghiệp
 */
const AdminPageLayout = ({ 
  title, 
  subtitle, 
  actionButton,
  onActionClick,
  actionIcon = <Add />,
  children,
  headerExtra 
}) => {
  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            color="text.primary" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {headerExtra}
          {actionButton && (
            typeof actionButton === 'string' ? (
              <Button 
                variant="contained" 
                startIcon={actionIcon} 
                onClick={onActionClick}
                sx={{
                  bgcolor: '#1976d2',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: '#1565c0',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                  },
                }}
              >
                {actionButton}
              </Button>
            ) : actionButton
          )}
        </Box>
      </Box>

      {/* Content */}
      {children}
    </Box>
  )
}

/**
 * Admin Card - Card component cho admin pages
 */
export const AdminCard = ({ children, noPadding, sx, ...props }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        overflow: 'hidden',
        ...(noPadding ? {} : { p: 3 }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  )
}

/**
 * Admin DataGrid Styles - Style chung cho DataGrid
 */
export const adminDataGridStyles = {
  fontSize: '0.9rem',
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  width: '100%',
  '& .MuiDataGrid-main': {
    overflow: 'auto',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#424242',
    minHeight: '52px !important',
  },
  '& .MuiDataGrid-columnHeader': {
    borderRight: '1px solid #e0e0e0',
    '&:last-child': {
      borderRight: 'none',
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 700,
  },
  '& .MuiDataGrid-row': {
    borderBottom: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.04)',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#fafafa',
    },
    '&.Mui-selected': {
      backgroundColor: '#e3f2fd',
      '&:hover': {
        backgroundColor: '#bbdefb',
      },
    },
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #e0e0e0',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    py: 1,
    '&:last-child': {
      borderRight: 'none',
    },
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '2px solid #e0e0e0',
    backgroundColor: '#fff',
    minHeight: '56px',
  },
  '& .MuiCheckbox-root': {
    color: '#9e9e9e',
    '&.Mui-checked': {
      color: '#1976d2',
    },
  },
  '& .MuiDataGrid-columnSeparator': {
    display: 'none',
  },
  '& .MuiDataGrid-virtualScroller': {
    overflowX: 'auto',
  },
}

export default AdminPageLayout
