/**
 * Helper functions to manually control the progress bar
 * Use these for form submissions, file uploads, or any custom loading states
 */

/**
 * Start loading indicator
 */
export const startLoading = () => {
  window.dispatchEvent(new CustomEvent('loading:start'))
}

/**
 * End loading indicator
 */
export const endLoading = () => {
  window.dispatchEvent(new CustomEvent('loading:end'))
}

/**
 * Update loading progress (0-100)
 * @param {number} progress - Progress percentage (0-100)
 */
export const updateLoadingProgress = (progress) => {
  window.dispatchEvent(
    new CustomEvent('loading:progress', {
      detail: { progress: Math.min(100, Math.max(0, progress)) },
    })
  )
}

/**
 * Wrapper for async functions that automatically shows loading
 * @param {Function} asyncFn - Async function to wrap
 * @returns {Promise} - Promise that resolves with the result
 */
export const withLoading = async (asyncFn) => {
  try {
    startLoading()
    const result = await asyncFn()
    return result
  } finally {
    endLoading()
  }
}

/**
 * Wrapper for file uploads with progress tracking
 * @param {Function} uploadFn - Upload function that accepts onProgress callback
 * @returns {Promise} - Promise that resolves with the result
 */
export const withUploadProgress = async (uploadFn) => {
  return new Promise((resolve, reject) => {
    startLoading()
    updateLoadingProgress(0)

    uploadFn((progressEvent) => {
      if (progressEvent.lengthComputable) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        updateLoadingProgress(progress)
      }
    })
      .then((result) => {
        updateLoadingProgress(100)
        setTimeout(() => {
          endLoading()
          resolve(result)
        }, 300)
      })
      .catch((error) => {
        endLoading()
        reject(error)
      })
  })
}

