import { useEffect, useState } from 'react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { LinearProgress } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

const TopProgressBar = () => {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const [manualLoading, setManualLoading] = useState(false)
  const [axiosLoading, setAxiosLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Check if any queries, mutations, or manual loading are running
  const isLoading = isFetching > 0 || isMutating > 0 || manualLoading || axiosLoading

  // Listen for custom loading events
  useEffect(() => {
    const handleManualLoadingStart = () => {
      setManualLoading(true)
      setProgress(0)
    }

    const handleManualLoadingEnd = () => {
      setManualLoading(false)
      setProgress(100)
      // Reset progress after animation
      setTimeout(() => setProgress(0), 300)
    }

    const handleAxiosLoadingStart = () => {
      setAxiosLoading(true)
      setProgress(0)
    }

    const handleAxiosLoadingEnd = () => {
      setAxiosLoading(false)
      setProgress(100)
      // Reset progress after animation
      setTimeout(() => setProgress(0), 300)
    }

    const handleLoadingProgress = (event) => {
      if (event.detail?.progress !== undefined) {
        setProgress(event.detail.progress)
      }
    }

    // Manual loading events (for form submissions, etc.)
    window.addEventListener('loading:start', handleManualLoadingStart)
    window.addEventListener('loading:end', handleManualLoadingEnd)
    
    // Axios loading events (for non-React Query requests)
    window.addEventListener('axios:loading:start', handleAxiosLoadingStart)
    window.addEventListener('axios:loading:end', handleAxiosLoadingEnd)
    
    // Progress update events
    window.addEventListener('loading:progress', handleLoadingProgress)

    return () => {
      window.removeEventListener('loading:start', handleManualLoadingStart)
      window.removeEventListener('loading:end', handleManualLoadingEnd)
      window.removeEventListener('axios:loading:start', handleAxiosLoadingStart)
      window.removeEventListener('axios:loading:end', handleAxiosLoadingEnd)
      window.removeEventListener('loading:progress', handleLoadingProgress)
    }
  }, [])

  // Simulate progress for automatic loading (queries/mutations)
  useEffect(() => {
    if (isLoading && !manualLoading) {
      // Reset progress when loading starts
      setProgress(0)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev // Don't go to 100% until loading is complete
          return prev + Math.random() * 15
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (!isLoading && progress < 100) {
      // Complete progress when loading ends
      setProgress(100)
      const timer = setTimeout(() => setProgress(0), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading, manualLoading])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        >
          <LinearProgress
            variant={progress > 0 ? 'determinate' : 'indeterminate'}
            value={progress}
            sx={{
              height: 4,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #1976d2 0%, #e63946 100%)',
                transition: progress > 0 
                  ? 'transform 0.2s linear' 
                  : 'none',
              },
              '& .MuiLinearProgress-bar1Indeterminate': {
                background: 'linear-gradient(90deg, #1976d2 0%, #e63946 100%)',
              },
              '& .MuiLinearProgress-bar2Indeterminate': {
                background: 'linear-gradient(90deg, #1976d2 0%, #e63946 100%)',
              },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TopProgressBar

