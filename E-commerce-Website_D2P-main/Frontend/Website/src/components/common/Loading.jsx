import { Box, CircularProgress, Typography } from '@mui/material'

const Loading = ({ message = 'Đang tải...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}

export default Loading

