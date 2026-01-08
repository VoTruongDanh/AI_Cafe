import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  Paper,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Star as StarIcon,
  LocalShipping as ShippingIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS } from '../../constants/adminTheme';
import { adminOrdersApi, adminProductsApi, adminUsersApi, adminDashboardApi } from '../../services/api';
import { getImageUrl } from '../../services/utils';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
};

const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
              {trend === 'up' ? (
                <TrendingUpIcon color="success" fontSize="small" />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" />
              )}
              <Typography
                variant="caption"
                color={trend === 'up' ? 'success.main' : 'error.main'}
              >
                {trendValue} so với tháng trước
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const CHART_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#00bcd4'];

const Analytics = () => {
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch data - Lấy thống kê từ Dashboard API để đồng bộ với Dashboard
  const { data: dashboardStats } = useQuery({
    queryKey: ['analytics-dashboard-stats'],
    queryFn: async () => {
      const response = await adminDashboardApi.getStatistics();
      return response.data || {};
    },
  });

  // Fetch orders - lấy nhiều hơn để phân tích
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const response = await adminOrdersApi.getAll({ per_page: 1000 });
      setLastUpdated(new Date());
      return response.data?.data || response.data || [];
    },
    refetchInterval: 10000, // Auto-refresh mỗi 10 giây
  });

  const { data: productsData } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const response = await adminProductsApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => {
      const response = await adminUsersApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data || [];
    },
  });

  const orders = ordersData || [];
  const products = productsData || [];
  const users = usersData || [];

  // Filter data by date range
  const { filteredOrders, previousOrders } = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'yesterday') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(now);
      switch (dateRange) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }
    }

    // Tính khoảng thời gian trước đó để so sánh
    const duration = endDate - startDate;
    const previousStartDate = new Date(startDate.getTime() - duration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const previous = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousStartDate && orderDate <= previousEndDate;
    });

    return { filteredOrders: filtered, previousOrders: previous };
  }, [orders, dateRange, customStartDate, customEndDate]);

  // Calculate statistics - Tính từ filteredOrders theo khoảng thời gian
  const stats = useMemo(() => {
    // Current period
    const totalRevenue = filteredOrders
      .filter((o) => o.status === 'completed' || o.status === 'delivered' || o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
    const pendingOrders = filteredOrders.filter((o) => o.status === 'pending').length;
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled').length;

    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Previous period
    const prevRevenue = previousOrders
      .filter((o) => o.status === 'completed' || o.status === 'delivered' || o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const prevOrders = previousOrders.length;
    const prevCompleted = previousOrders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
    const prevAvgOrderValue = prevCompleted > 0 ? prevRevenue / prevCompleted : 0;

    // Calculate trends
    const calculateTrend = (current, previous) => {
      if (previous === 0) return { change: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
      const change = ((current - previous) / previous) * 100;
      return {
        change: Math.round(change * 10) / 10,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      };
    };

    const revenueTrend = calculateTrend(totalRevenue, prevRevenue);
    const ordersTrend = calculateTrend(totalOrders, prevOrders);
    const avgOrderTrend = calculateTrend(avgOrderValue, prevAvgOrderValue);

    // New KPIs
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // New customers in period
    const periodStart = dateRange === 'custom' && customStartDate ? new Date(customStartDate) : 
      dateRange === 'today' ? new Date(new Date().setHours(0,0,0,0)) :
      new Date(new Date().setMonth(new Date().getMonth() - 1));
    
    const newCustomers = users.filter((u) => {
      const createdAt = new Date(u.created_at);
      return createdAt >= periodStart;
    }).length;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue,
      totalProducts: products.length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.is_active).length,
      newCustomers,
      conversionRate,
      cancelRate,
      // Trends
      revenueTrend,
      ordersTrend,
      avgOrderTrend,
    };
  }, [filteredOrders, previousOrders, products, users, dateRange, customStartDate]);

  // Revenue by month chart data - Chỉ hiển thị tháng có data
  const revenueByMonth = useMemo(() => {
    const monthlyData = {};
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    filteredOrders.forEach((order) => {
      if (order.status === 'completed' || order.status === 'delivered' || order.payment_status === 'paid') {
        const date = new Date(order.created_at);
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            year,
            month,
            revenue: 0,
          };
        }
        monthlyData[key].revenue += order.grand_total || 0;
      }
    });

    // Chuyển thành array và sort theo thời gian
    const result = Object.values(monthlyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map((item) => ({
        name: `${months[item.month]} ${item.year}`,
        revenue: item.revenue,
      }));

    // Nếu không có data, trả về array rỗng thay vì 12 tháng 0
    return result.length > 0 ? result : [];
  }, [filteredOrders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusCount = {};
    const statusLabels = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đang giao',
      completed: 'Hoàn thành',
      delivered: 'Đã giao',
      returned: 'Đã trả hàng',
      cancelled: 'Đã hủy',
    };

    filteredOrders.forEach((order) => {
      const status = order.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      }))
      .filter((item) => item.value > 0); // Chỉ hiển thị trạng thái có đơn hàng
  }, [filteredOrders]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales = {};

    filteredOrders.forEach((order) => {
      // Tính từ đơn đã giao (delivered) hoặc hoàn thành (completed)
      if ((order.status === 'completed' || order.status === 'delivered') && order.items) {
        order.items.forEach((item) => {
          const productId = item.product_id;
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              name: item.product?.name || item.product_name || 'Sản phẩm',
              image: getImageUrl(item.product?.thumbnail || item.product?.images?.[0]?.path),
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[productId].quantity += item.quantity || 0;
          // Dùng line_total hoặc unit_price * quantity
          productSales[productId].revenue += item.line_total || item.subtotal || 
            ((item.quantity || 0) * (item.unit_price || item.price || 0));
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const categoryCount = {};

    products.forEach((product) => {
      const categoryName = product.category?.name || 'Khác';
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  // Daily orders trend - Hiển thị theo khoảng thời gian đã chọn
  const dailyOrdersTrend = useMemo(() => {
    const now = new Date();
    let daysToShow = 7;
    let groupBy = 'day'; // 'day', 'week', 'month'

    switch (dateRange) {
      case 'week':
        daysToShow = 7;
        groupBy = 'day';
        break;
      case 'month':
        daysToShow = 30;
        groupBy = 'day';
        break;
      case 'quarter':
        daysToShow = 90;
        groupBy = 'week';
        break;
      case 'year':
        daysToShow = 365;
        groupBy = 'month';
        break;
      default:
        daysToShow = 30;
        groupBy = 'day';
    }

    if (groupBy === 'day') {
      const days = [];
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

        const dayOrders = filteredOrders.filter((order) => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
          return orderDate === dateStr;
        });

        days.push({
          name: dayName,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
        });
      }
      // Chỉ hiển thị 10 điểm dữ liệu gần nhất để chart không quá đông
      return days.slice(-10);
    } else if (groupBy === 'week') {
      const weeks = [];
      const weeksCount = Math.ceil(daysToShow / 7);
      for (let i = weeksCount - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const weekOrders = filteredOrders.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });

        weeks.push({
          name: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          orders: weekOrders.length,
          revenue: weekOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
        });
      }
      return weeks.slice(-10);
    } else {
      // month
      const months = [];
      const monthsCount = 12;
      for (let i = monthsCount - 1; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const monthOrders = filteredOrders.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        months.push({
          name: `T${monthDate.getMonth() + 1}`,
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
        });
      }
      return months;
    }
  }, [filteredOrders, dateRange]);

  return (
    <AdminPageLayout
      title="Phân tích & Thống kê"
      subtitle="Tổng quan hiệu suất kinh doanh"
    >
      {/* Date Range Filter */}
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                label="Khoảng thời gian"
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
              >
                <MenuItem value="today">Hôm nay</MenuItem>
                <MenuItem value="yesterday">Hôm qua</MenuItem>
                <MenuItem value="week">7 ngày qua</MenuItem>
                <MenuItem value="month">30 ngày qua</MenuItem>
                <MenuItem value="quarter">Quý này</MenuItem>
                <MenuItem value="year">Năm nay</MenuItem>
                <MenuItem value="custom">Tùy chỉnh</MenuItem>
              </Select>
            </FormControl>

            {dateRange === 'custom' && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Từ ngày"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="Đến ngày"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: customStartDate,
                    max: new Date().toISOString().split('T')[0]
                  }}
                />
              </>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => refetchOrders()}
              variant="outlined"
            >
              Làm mới
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            icon={<MoneyIcon />}
            color={ADMIN_COLORS.success}
            trend={stats.revenueTrend.trend}
            trendValue={`${stats.revenueTrend.change > 0 ? '+' : ''}${stats.revenueTrend.change}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đơn hàng"
            value={formatNumber(stats.totalOrders)}
            icon={<CartIcon />}
            color={ADMIN_COLORS.primary}
            trend={stats.ordersTrend.trend}
            trendValue={`${stats.ordersTrend.change > 0 ? '+' : ''}${stats.ordersTrend.change}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Giá trị TB/đơn"
            value={formatCurrency(stats.avgOrderValue)}
            icon={<ShippingIcon />}
            color={ADMIN_COLORS.warning}
            trend={stats.avgOrderTrend.trend}
            trendValue={`${stats.avgOrderTrend.change > 0 ? '+' : ''}${stats.avgOrderTrend.change}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tỷ lệ chuyển đổi"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={<CheckIcon />}
            color={ADMIN_COLORS.secondary}
          />
        </Grid>
      </Grid>

      {/* New KPIs Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Khách hàng mới
              </Typography>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {formatNumber(stats.newCustomers)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trong kỳ này
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tỷ lệ hủy đơn
              </Typography>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                color={stats.cancelRate > 10 ? 'error.main' : 'success.main'}
              >
                {stats.cancelRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.cancelledOrders} đơn bị hủy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Đơn hoàn thành
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {formatNumber(stats.completedOrders)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}% tổng đơn
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Đơn chờ xử lý
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {formatNumber(stats.pendingOrders)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cần xử lý ngay
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Doanh thu theo tháng
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ADMIN_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ADMIN_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={ADMIN_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Orders by Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Đơn hàng theo trạng thái
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Daily Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Xu hướng đơn hàng
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={dailyOrdersTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Doanh thu' : 'Đơn hàng',
                  ]}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  name="Đơn hàng"
                  fill={ADMIN_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke={ADMIN_COLORS.success}
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Phân bố sản phẩm theo danh mục
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={categoryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Số sản phẩm" fill={ADMIN_COLORS.secondary} radius={[0, 4, 4, 0]}>
                  {categoryDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Products & Quick Stats */}
      <Grid container spacing={3}>
        {/* Top Selling Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Sản phẩm bán chạy
            </Typography>
            <List>
              {topProducts.map((product, index) => (
                <Box key={product.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={product.image}
                        variant="rounded"
                        sx={{ bgcolor: ADMIN_COLORS.primary }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {product.name}
                        </Typography>
                      }
                      secondary={`${formatNumber(product.quantity)} đã bán`}
                    />
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatCurrency(product.revenue)}
                    </Typography>
                  </ListItem>
                  {index < topProducts.length - 1 && <Divider />}
                </Box>
              ))}
              {topProducts.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Chưa có dữ liệu bán hàng
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Thống kê nhanh
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Đơn hoàn thành
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {stats.completedOrders}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Đơn chờ xử lý
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {stats.pendingOrders}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}
                    color="warning"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng sản phẩm
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {stats.totalProducts}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Khách hoạt động
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {stats.activeUsers}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </AdminPageLayout>
  );
};

export default Analytics;
