// Service to manage favorites using localStorage
// This is a temporary solution until backend API is available

const FAVORITES_KEY = 'electroshop_favorites'

export const favoritesService = {
  // Get all favorite product IDs
  getFavorites: () => {
    try {
      const favorites = localStorage.getItem(FAVORITES_KEY)
      return favorites ? JSON.parse(favorites) : []
    } catch (error) {
      console.error('Error getting favorites:', error)
      return []
    }
  },

  // Check if a product is favorite
  isFavorite: (productId) => {
    const favorites = favoritesService.getFavorites()
    return favorites.includes(productId)
  },

  // Add product to favorites
  addFavorite: (productId) => {
    try {
      const favorites = favoritesService.getFavorites()
      if (!favorites.includes(productId)) {
        favorites.push(productId)
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
      }
      return true
    } catch (error) {
      console.error('Error adding favorite:', error)
      return false
    }
  },

  // Remove product from favorites
  removeFavorite: (productId) => {
    try {
      const favorites = favoritesService.getFavorites()
      const updatedFavorites = favorites.filter(id => id !== productId)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites))
      return true
    } catch (error) {
      console.error('Error removing favorite:', error)
      return false
    }
  },

  // Toggle favorite status
  toggleFavorite: (productId) => {
    if (favoritesService.isFavorite(productId)) {
      return favoritesService.removeFavorite(productId)
    } else {
      return favoritesService.addFavorite(productId)
    }
  },

  // Clear all favorites
  clearFavorites: () => {
    try {
      localStorage.removeItem(FAVORITES_KEY)
      return true
    } catch (error) {
      console.error('Error clearing favorites:', error)
      return false
    }
  },
}

