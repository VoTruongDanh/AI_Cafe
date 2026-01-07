import { Link, useLocation } from 'react-router-dom'
import { Breadcrumbs, Typography, Box } from '@mui/material'
import { Home, NavigateNext } from '@mui/icons-material'

const Breadcrumb = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <Breadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: '#e63946',
        }}
      >
        <Home sx={{ fontSize: 20, mr: 0.5 }} />
        Trang chủ
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')

        return isLast ? (
          <Typography key={name} color="text.primary" sx={{ textTransform: 'capitalize' }}>
            {displayName}
          </Typography>
        ) : (
          <Link
            key={name}
            to={routeTo}
            style={{
              textDecoration: 'none',
              color: '#666',
              textTransform: 'capitalize',
            }}
          >
            {displayName}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}

export default Breadcrumb

