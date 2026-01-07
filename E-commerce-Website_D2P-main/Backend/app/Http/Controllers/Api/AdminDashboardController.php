<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Annotations as OA;

class AdminDashboardController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/admin/dashboard/statistics",
     *     tags={"Admin - Dashboard"},
     *     summary="Thống kê dashboard (Admin)",
     *     description="Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Thống kê"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getStatistics(Request $request)
    {
        $this->ensureAdmin($request);

        // Tính doanh thu từ đơn đã giao (delivered) hoặc hoàn thành (completed)
        $revenueOrders = Order::whereIn('status', ['delivered', 'completed'])->get();
        $totalRevenue = $revenueOrders->sum('grand_total');
        $deliveredOrders = $revenueOrders->count();

        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();

        $stats = [
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'completedOrders' => $deliveredOrders, // Đơn đã giao/hoàn thành
            'pendingOrders' => $pendingOrders,
            'avgOrderValue' => $deliveredOrders > 0 ? round($totalRevenue / $deliveredOrders, 0) : 0,
            'totalUsers' => User::where('role', 'customer')->count(),
            'totalProducts' => Product::count(),
        ];

        return response()->json($stats);
    }    /**
     * @OA\Get(
     *     path="/admin/dashboard/recent-orders",
     *     tags={"Admin - Dashboard"},
     *     summary="Đơn hàng gần đây (Admin)",
     *     description="Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Danh sách đơn hàng"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getRecentOrders(Request $request)
    {
        $this->ensureAdmin($request);

        $orders = Order::with(['items', 'user'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json($orders);
    }

    /**
     * @OA\Get(
     *     path="/admin/dashboard/top-products",
     *     tags={"Admin - Dashboard"},
     *     summary="Sản phẩm bán chạy (Admin)",
     *     description="Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Danh sách sản phẩm"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getTopProducts(Request $request)
    {
        $this->ensureAdmin($request);

        $products = Product::orderByDesc('sold_count')
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    /**
     * @OA\Get(
     *     path="/admin/dashboard/sales-chart",
     *     tags={"Admin - Dashboard"},
     *     summary="Biểu đồ doanh thu (Admin)",
     *     description="Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="period", in="query", description="Kỳ (7days, 30days, year)", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Dữ liệu biểu đồ"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getSalesChart(Request $request)
    {
        $this->ensureAdmin($request);

        $period = $request->input('period', '7days');
        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            'year' => 365,
            default => 7,
        };

        $startDate = now()->subDays($days);

        $salesData = Order::where('created_at', '>=', $startDate)
            ->where('status', '!=', 'cancelled')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($salesData);
    }

    /**
     * @OA\Get(
     *     path="/admin/dashboard/today-statistics",
     *     tags={"Admin - Dashboard"},
     *     summary="Thống kê hôm nay (Admin)",
     *     description="Thống kê đơn hàng và doanh thu hôm nay so với hôm qua. Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Thống kê hôm nay"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getTodayStatistics(Request $request)
    {
        $this->ensureAdmin($request);

        // Hôm nay
        $today = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        
        // Hôm qua
        $yesterday = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        // Đơn hàng hôm nay
        $todayOrders = Order::whereBetween('created_at', [$today, $todayEnd])->get();
        $todayOrdersCount = $todayOrders->count();
        $todayRevenue = $todayOrders->whereIn('status', ['delivered', 'completed'])
            ->sum('grand_total');
        $todayPendingOrders = $todayOrders->where('status', 'pending')->count();
        $todayCompletedOrders = $todayOrders->whereIn('status', ['delivered', 'completed'])->count();

        // Đơn hàng hôm qua
        $yesterdayOrders = Order::whereBetween('created_at', [$yesterday, $yesterdayEnd])->get();
        $yesterdayOrdersCount = $yesterdayOrders->count();
        $yesterdayRevenue = $yesterdayOrders->whereIn('status', ['delivered', 'completed'])
            ->sum('grand_total');

        // Tính % thay đổi
        $ordersChange = $yesterdayOrdersCount > 0 
            ? round((($todayOrdersCount - $yesterdayOrdersCount) / $yesterdayOrdersCount) * 100, 1)
            : ($todayOrdersCount > 0 ? 100 : 0);
        
        $revenueChange = $yesterdayRevenue > 0
            ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
            : ($todayRevenue > 0 ? 100 : 0);

        return response()->json([
            'today' => [
                'orders_count' => $todayOrdersCount,
                'revenue' => $todayRevenue,
                'pending_orders' => $todayPendingOrders,
                'completed_orders' => $todayCompletedOrders,
                'avg_order_value' => $todayCompletedOrders > 0 
                    ? round($todayRevenue / $todayCompletedOrders, 0) 
                    : 0,
            ],
            'yesterday' => [
                'orders_count' => $yesterdayOrdersCount,
                'revenue' => $yesterdayRevenue,
            ],
            'changes' => [
                'orders_change' => $ordersChange,
                'orders_trend' => $ordersChange >= 0 ? 'up' : 'down',
                'revenue_change' => $revenueChange,
                'revenue_trend' => $revenueChange >= 0 ? 'up' : 'down',
            ],
        ]);
    }

    /**
     * ✅ OPTIMIZATION: Gộp tất cả API calls thành 1 endpoint
     * 
     * @OA\Get(
     *     path="/admin/dashboard/all-data",
     *     tags={"Admin - Dashboard"},
     *     summary="Lấy tất cả dữ liệu dashboard (Optimized)",
     *     description="Gộp tất cả API calls thành 1 để giảm load time. Chỉ web admin (role: 'admin') mới có quyền truy cập",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="period", in="query", description="Kỳ biểu đồ (7days, 30days, year)", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Tất cả dữ liệu dashboard"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Chỉ web admin mới có quyền")
     * )
     */
    public function getAllData(Request $request)
    {
        $this->ensureAdmin($request);

        // 1. Statistics
        $revenueOrders = Order::whereIn('status', ['delivered', 'completed'])->get();
        $totalRevenue = $revenueOrders->sum('grand_total');
        $deliveredOrders = $revenueOrders->count();
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();

        $statistics = [
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'completedOrders' => $deliveredOrders,
            'pendingOrders' => $pendingOrders,
            'avgOrderValue' => $deliveredOrders > 0 ? round($totalRevenue / $deliveredOrders, 0) : 0,
            'totalUsers' => User::where('role', 'customer')->count(),
            'totalProducts' => Product::count(),
        ];

        // 2. Today Statistics
        $today = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $yesterday = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        $todayOrders = Order::whereBetween('created_at', [$today, $todayEnd])->get();
        $yesterdayOrders = Order::whereBetween('created_at', [$yesterday, $yesterdayEnd])->get();

        $todayStats = [
            'today' => [
                'orders_count' => $todayOrders->count(),
                'revenue' => $todayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total'),
                'pending_orders' => $todayOrders->where('status', 'pending')->count(),
                'completed_orders' => $todayOrders->whereIn('status', ['delivered', 'completed'])->count(),
                'avg_order_value' => $todayOrders->whereIn('status', ['delivered', 'completed'])->count() > 0
                    ? round($todayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') / $todayOrders->whereIn('status', ['delivered', 'completed'])->count(), 0)
                    : 0,
            ],
            'yesterday' => [
                'orders_count' => $yesterdayOrders->count(),
                'revenue' => $yesterdayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total'),
            ],
            'changes' => [
                'orders_change' => $yesterdayOrders->count() > 0
                    ? round((($todayOrders->count() - $yesterdayOrders->count()) / $yesterdayOrders->count()) * 100, 1)
                    : ($todayOrders->count() > 0 ? 100 : 0),
                'orders_trend' => $todayOrders->count() >= $yesterdayOrders->count() ? 'up' : 'down',
                'revenue_change' => $yesterdayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') > 0
                    ? round((($todayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') - $yesterdayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total')) / $yesterdayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total')) * 100, 1)
                    : ($todayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') > 0 ? 100 : 0),
                'revenue_trend' => $todayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') >= $yesterdayOrders->whereIn('status', ['delivered', 'completed'])->sum('grand_total') ? 'up' : 'down',
            ],
        ];

        // 3. Recent Orders (chỉ lấy 10 đơn, không cần 1000)
        $recentOrders = Order::with(['items' => function($query) {
                $query->limit(3); // Chỉ lấy 3 items đầu tiên
            }, 'user:id,name,email'])
            ->select('id', 'code', 'user_id', 'customer_name', 'status', 'grand_total', 'created_at')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // 4. Sales Chart
        $period = $request->input('period', '7days');
        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            'year' => 365,
            default => 7,
        };
        $startDate = now()->subDays($days);

        $salesChart = Order::where('created_at', '>=', $startDate)
            ->where('status', '!=', 'cancelled')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 5. Order Status Counts (không cần query 1000 orders)
        $orderCounts = [
            'pending' => Order::where('status', 'pending')->count(),
            'processing' => Order::where('status', 'processing')->count(),
            'shipping' => Order::where('status', 'shipping')->count(),
            'completed' => Order::whereIn('status', ['delivered', 'completed'])->count(),
        ];

        // 6. Low Stock Products (chỉ lấy 5 sản phẩm)
        $lowStockProducts = Product::select('id', 'name', 'sku', 'quantity', 'reorder_point', 'thumbnail')
            ->whereRaw('quantity <= COALESCE(reorder_point, 10)')
            ->orderBy('quantity')
            ->limit(5)
            ->get();

        // ✅ Trả về tất cả data trong 1 response
        return response()->json([
            'statistics' => $statistics,
            'todayStats' => $todayStats,
            'recentOrders' => $recentOrders,
            'salesChart' => $salesChart,
            'orderCounts' => $orderCounts,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}

