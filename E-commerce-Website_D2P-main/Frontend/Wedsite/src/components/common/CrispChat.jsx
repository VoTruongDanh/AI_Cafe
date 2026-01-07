import { useEffect } from 'react'
import { useSelector } from 'react-redux'

/**
 * Crisp Chat Component
 * 
 * Setup Instructions:
 * 1. Sign up at https://crisp.chat/
 * 2. Get your Website ID
 * 3. Add to .env:
 *    VITE_CRISP_WEBSITE_ID=your_website_id
 * 
 * Features:
 * - Auto-identify logged in users
 * - Set user email and name
 * - Custom user data
 */

const CrispChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    const websiteId = import.meta.env.VITE_CRISP_WEBSITE_ID

    if (!websiteId) {
      console.warn('Crisp not configured. Please set VITE_CRISP_WEBSITE_ID in .env')
      return
    }

    // Initialize Crisp
    window.$crisp = []
    window.CRISP_WEBSITE_ID = websiteId

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = 1
    document.getElementsByTagName('head')[0].appendChild(script)

    // Set user data if authenticated
    if (isAuthenticated && user) {
      script.onload = () => {
        window.$crisp.push(['set', 'user:email', [user.email]])
        window.$crisp.push(['set', 'user:nickname', [user.name]])
        window.$crisp.push(['set', 'session:data', [[
          ['user_id', user.id],
          ['role', user.role],
        ]]])
      }
    }

    return () => {
      // Cleanup
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:hide'])
      }
    }
  }, [isAuthenticated, user])

  return null
}

export default CrispChat
