import { useEffect } from 'react'

/**
 * Live Chat Component using Tawk.to
 * 
 * Setup Instructions:
 * 1. Sign up at https://www.tawk.to/
 * 2. Create a property
 * 3. Get your Property ID and Widget ID
 * 4. Replace in .env file:
 *    VITE_TAWK_PROPERTY_ID=your_property_id
 *    VITE_TAWK_WIDGET_ID=your_widget_id
 */

const LiveChat = () => {
  useEffect(() => {
    const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID
    const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID

    // Skip if not configured (silent mode)
    if (!propertyId || !widgetId) {
      return
    }

    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    const script = document.createElement('script')
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')
    
    const firstScript = document.getElementsByTagName('script')[0]
    firstScript.parentNode.insertBefore(script, firstScript)

    // Cleanup
    return () => {
      // Remove Tawk.to widget on unmount
      const tawkWidget = document.getElementById('tawk-bubble')
      if (tawkWidget) {
        tawkWidget.remove()
      }
    }
  }, [])

  return null
}

export default LiveChat
