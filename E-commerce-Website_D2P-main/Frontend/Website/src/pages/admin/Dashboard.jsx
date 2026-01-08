import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon,
  ArrowForward as ArrowIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  LocalShipping as ShippingIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS } from '../../constants/adminTheme';
import { adminOrdersApi, adminProductsApi, adminUsersApi, adminDashboardApi } from '../../services/api';
import { getImageUrl } from '../../services/utils';
import { clearAllCache } from '../../utils/cacheHelper';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

const formatCurrencyCompact = (value) => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + ' tỷ';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + ' tr';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return new Intl.NumberFormat('vi-VN').format(value || 0) + ' đ';
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatCard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick }) => (
  <Card
    sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick
        ? {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
              {trend === 'up' ? (
                <TrendingUpIcon color="success" sx={{ fontSize: 16 }} />
              ) : (
                <TrendingDownIcon color="error" sx={{ fontSize: 16 }} />
              )}
              <Typography
                variant="caption"
                color={trend === 'up' ? 'success.main' : 'error.main'}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}20`,
            color: color,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    processing: 'info',
    shipping: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Hàm refresh tất cả data và xóa cache
  const handleRefreshAll = () => {
    clearAllCache();
    queryClient.invalidateQueries();
    toast.success('Đã xóa cache và làm mới dữ liệu!');
  };

  // Fetch statistics from dashboard API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: async () => {
      const response = await adminDashboardApi.getStatistics();
      return response.data || {};
    },
  });

  // Fetch today statistics
  const { data: todayStatsData, isLoading: todayStatsLoading } = useQuery({
    queryKey: ['dashboard-today-statistics'],
    queryFn: async () => {
      const response = await adminDashboardApi.getTodayStatistics();
      return response.data || {};
    },
    staleTime: 60 * 1000, // ✅ Cache 1 phút
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút
    refetchOnWindowFocus: false,
  });

  // Fetch recent orders from dashboard API
  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: async () => {
      const response = await adminDashboardApi.getRecentOrders();
      return response.data || [];
    },
  });

  // Fetch sales chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-sales-chart'],
    queryFn: async () => {
      const response = await adminDashboardApi.getSalesChart({ period: '7days' });
      return response.data || [];
    },
  });

  // Fetch all orders for status count
  const { data: allOrdersData, isLoading: allOrdersLoading } = useQuery({
    queryKey: ['dashboard-all-orders'],
    queryFn: async () => {
      const response = await adminOrdersApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  // Fetch products for low stock
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: async () => {
      const response = await adminProductsApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  const stats = statsData || {};
  const todayStats = todayStatsData || {};
  const recentOrders = recentOrdersData || [];
  const orders = allOrdersData || [];
  const products = productsData || [];

  const isLoading = statsLoading || todayStatsLoading || ordersLoading || chartLoading || allOrdersLoading || productsLoading;

  // Calculate additional statistics
  const additionalStats = useMemo(() => {
    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).toISOString().split('T')[0] === today
    );
    const todayRevenue = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);

    // Pending orders count
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;

    // Low stock products (quantity <= reorder_point or quantity <= 10)
    const lowStockProducts = products.filter(
      (p) => (p.quantity || 0) <= (p.reorder_point || 10)
    ).length;

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      pendingOrders,
      lowStockProducts,
    };
  }, [orders, products]);

  // Order status counts
  const orderStatusCounts = useMemo(() => {
    return {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    };
  }, [orders]);

  // Low stock products list
  const lowStockList = useMemo(() => {
    return products
      .filter((p) => (p.quantity || 0) <= (p.reorder_point || 10))
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      .slice(0, 5);
  }, [products]);

  // Format chart data for display
  const revenueChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      // Generate empty data for last 7 days if no data
      const last7Days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: 'numeric',
        });
        last7Days.push({
          name: dayName,
          revenue: 0,
          orders: 0,
        });
      }
      return last7Days;
    }

    return chartData.map((item) => {
      const date = new Date(item.date);
      return {
        name: date.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: 'numeric',
        }),
        revenue: parseFloat(item.revenue) || 0,
        orders: item.orders || 0,
      };
    });
  }, [chartData]);

  return (
    <AdminPageLayout
      title="Dashboard"
      subtitle={`Chào mừng trở lại! Hôm nay có ${additionalStats.todayOrders} đơn hàng mới`}
      actionButton={
        <Tooltip title="Xóa cache và làm mới dữ liệu">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            sx={{ borderColor: ADMIN_COLORS.primary, color: ADMIN_COLORS.primary }}
          >
            Làm mới
          </Button>
        </Tooltip>
      }
    >
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Today's Highlight */}
      {todayStats.today && (
        <Box sx={{ mb: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayIcon color="primary" />
            Thống kê hôm nay
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Đơn hàng hôm nay
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {todayStats.today.orders_count}
                  </Typography>
                  <Chip
                    size="small"
                    icon={todayStats.changes.orders_trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${todayStats.changes.orders_change > 0 ? '+' : ''}${todayStats.changes.orders_change}%`}
                    color={todayStats.changes.orders_trend === 'up' ? 'success' : 'error'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  So với hôm qua: {todayStats.yesterday.orders_count} đơn
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Doanh thu hôm nay
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {formatCurrencyCompact(todayStats.today.revenue)}
                  </Typography>
                  <Chip
                    size="small"
                    icon={todayStats.changes.revenue_trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${todayStats.changes.revenue_change > 0 ? '+' : ''}${todayStats.changes.revenue_change}%`}
                    color={todayStats.changes.revenue_trend === 'up' ? 'success' : 'error'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  So với hôm qua: {formatCurrency(todayStats.yesterday.revenue)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Đơn chờ xử lý
                </Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                  {todayStats.today.pending_orders}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cần xử lý ngay
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Giá trị TB/đơn
                </Typography>
                <Typography variant="h4" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                  {formatCurrencyCompact(todayStats.today.avg_order_value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {todayStats.today.completed_orders} đơn hoàn thành
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrencyCompact(stats.totalRevenue || 0)}
            subtitle={`Hôm nay: ${formatCurrency(additionalStats.todayRevenue)}`}
            icon={<MoneyIcon />}
            color={ADMIN_COLORS.success}
            trend="up"
            trendValue="+12.5%"
            onClick={() => navigate('/admin/analytics')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đơn hàng"
            value={formatNumber(stats.totalOrders || 0)}
            subtitle={`${additionalStats.pendingOrders} chờ xử lý`}
            icon={<CartIcon />}
            color={ADMIN_COLORS.primary}
            trend="up"
            trendValue="+8.2%"
            onClick={() => navigate('/admin/orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sản phẩm"
            value={formatNumber(stats.totalProducts || 0)}
            subtitle={`${additionalStats.lowStockProducts} sắp hết hàng`}
            icon={<InventoryIcon />}
            color={ADMIN_COLORS.warning}
            onClick={() => navigate('/admin/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Khách hàng"
            value={formatNumber(stats.totalUsers || 0)}
            subtitle={`Khách hàng đã đăng ký`}
            icon={<PeopleIcon />}
            color={ADMIN_COLORS.secondary}
            trend="up"
            trendValue="+5.7%"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
      </Grid>

      {/* Chart & Recent Orders */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Doanh thu 7 ngày qua
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/analytics')}
              >
                Xem chi tiết
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ADMIN_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ADMIN_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(0) + 'tr';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                    return value;
                  }} 
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={ADMIN_COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quick Actions & Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Trạng thái đơn hàng
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                {
                  label: 'Chờ xử lý',
                  value: orderStatusCounts.pending,
                  color: 'warning',
                  icon: <TimeIcon />,
                },
                {
                  label: 'Đang xử lý',
                  value: orderStatusCounts.processing,
                  color: 'info',
                  icon: <CartIcon />,
                },
                {
                  label: 'Đang giao',
                  value: orderStatusCounts.shipping,
                  color: 'primary',
                  icon: <ShippingIcon />,
                },
                {
                  label: 'Hoàn thành',
                  value: orderStatusCounts.completed,
                  color: 'success',
                  icon: <CheckIcon />,
                },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderBottom: index < 3 ? '1px solid #eee' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${item.color}.light`,
                        color: `${item.color}.main`,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography variant="body2">{item.label}</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/admin/orders')}
            >
              Quản lý đơn hàng
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders & Low Stock */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Đơn hàng mới nhất
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/orders')}
              >
                Xem tất cả
              </Button>
            </Box>
            <List disablePadding>
              {recentOrders.slice(0, 5).map((order, index) => (
                <Box key={order.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: ADMIN_COLORS.primary }}>
                        #{order.id}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {order.customer_name || order.user?.name || 'Khách hàng'}
                          </Typography>
                          <Chip
                            label={getStatusLabel(order.status)}
                            size="small"
                            color={getStatusColor(order.status)}
                          />
                        </Box>
                      }
                      secondary={formatDate(order.created_at)}
                    />
                    <Typography variant="body2" fontWeight={600} color="success.main" sx={{ minWidth: 100, textAlign: 'right' }}>
                      {formatCurrency(order.grand_total)}
                    </Typography>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => navigate('/admin/orders')}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                  {index < Math.min(recentOrders.length, 5) - 1 && <Divider />}
                </Box>
              ))}
              {recentOrders.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Chưa có đơn hàng nào
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  Sắp hết hàng
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/inventory')}
              >
                Quản lý kho
              </Button>
            </Box>
            <List disablePadding>
              {lowStockList.map((product, index) => (
                <Box key={product.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={getImageUrl(product.thumbnail || product.images?.[0]?.path)}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                      >
                        <InventoryIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>
                          {product.name}
                        </Typography>
                      }
                      secondary={`SKU: ${product.sku || 'N/A'}`}
                    />
                    <Chip
                      label={`Còn ${product.quantity || 0}`}
                      size="small"
                      color={(product.quantity || 0) === 0 ? 'error' : 'warning'}
                    />
                  </ListItem>
                  {index < lowStockList.length - 1 && <Divider />}
                </Box>
              ))}
              {lowStockList.length === 0 && (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <CheckIcon color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tất cả sản phẩm đều có đủ hàng!
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </AdminPageLayout>
  );
};

export default Dashboard;
