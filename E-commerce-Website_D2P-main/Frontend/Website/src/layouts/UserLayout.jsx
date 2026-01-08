import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategories } from '../store/slices/categoriesSlice'
import { useGlobalPolling } from '../hooks/useGlobalPolling'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import FloatingCartButton from '../components/common/FloatingCartButton'
import AIChatBot from '../components/user/AIChatBot'

const UserLayout = () => {
  const dispatch = useDispatch()
  const { categories } = useSelector((state) => state.categories)

  // ❌ TẠM THỜI TẮT POLLING - Gây load lại liên tục
  // useGlobalPolling({
  //   products: true,
  //   promotions: true,
  //   interval: 10000  // 10 giây - User không cần realtime cao như Admin
  // })

  useEffect(() => {
    // Only fetch if not already loaded
    if (categories.length === 0) {
      dispatch(fetchCategories())
    }
  }, [dispatch, categories.length])

  return (
    <div className="app" style={{ position: 'relative', overflow: 'hidden' }}>
      <Header />
      <main style={{ 
        minHeight: 'calc(100vh - 200px)', 
        width: '100%',
        position: 'relative',
        zIndex: 1,
        paddingTop: 170 // Đảm bảo nội dung không bị header che
      }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingCartButton />
      <AIChatBot />
    </div>
  )
}

export default UserLayout

