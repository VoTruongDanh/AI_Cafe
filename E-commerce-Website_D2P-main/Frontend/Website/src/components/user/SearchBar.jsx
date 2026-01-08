import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, InputBase, IconButton } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { fetchProducts } from '../../store/slices/productsSlice'

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSearch = () => {
    if (searchTerm.trim()) {
      dispatch(fetchProducts({ search: searchTerm, page: 1, limit: 12 }))
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        px: 2,
        border: '1px solid #ddd',
        flexGrow: 1,
        maxWidth: 600,
      }}
    >
      <InputBase
        placeholder="Tìm kiếm sản phẩm..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ flexGrow: 1 }}
      />
      <IconButton onClick={handleSearch} color="primary">
        <SearchIcon />
      </IconButton>
    </Box>
  )
}

export default SearchBar

