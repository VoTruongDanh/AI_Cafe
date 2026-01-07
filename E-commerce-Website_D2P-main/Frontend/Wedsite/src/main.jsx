import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import { store } from './store/store'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ❌ Tắt refetch khi focus window
      refetchOnMount: false, // ❌ Không fetch lại khi mount
      refetchOnReconnect: false, // ❌ Không fetch lại khi reconnect
      retry: 1,
      staleTime: 5 * 60 * 1000, // ✅ Cache 5 phút
      gcTime: 10 * 60 * 1000, // ✅ Giữ cache 10 phút
    },
    mutations: {
      retry: 0,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  // ❌ Tắt StrictMode để tránh double render trong development
  // <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  // </React.StrictMode>
)

