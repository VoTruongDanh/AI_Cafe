<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\InventoryImportController;
use App\Http\Controllers\Api\MoMoPaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\VNPayController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReturnRequestController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\WarrantyController;
use App\Http\Controllers\Api\WinForm\WinFormPromotionController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\StockAlertController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\RecentlyViewedController;
use App\Http\Controllers\Api\ProductTemperatureController;
use App\Http\Controllers\Api\WeatherController;
use App\Http\Controllers\Api\FaceRecognitionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    
    // Social Login Routes
    Route::get('google', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
    Route::get('facebook', [SocialAuthController::class, 'redirectToFacebook']);
    Route::get('facebook/callback', [SocialAuthController::class, 'handleFacebookCallback']);
    Route::post('social-login', [SocialAuthController::class, 'socialLogin']);
});

// Password Reset Routes (Public)
Route::prefix('password')->group(function () {
    Route::post('forgot', [ForgotPasswordController::class, 'sendResetLinkEmail']);
    Route::get('verify-token', [ForgotPasswordController::class, 'verifyToken']);
    Route::post('reset', [ForgotPasswordController::class, 'reset']);
});

// Upload image (authenticated users)
Route::post('upload-image', [ProductController::class, 'uploadImage'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);

    // --- [QUAN TRỌNG] ---
    // Đưa route ORDERS ra đây để Admin/Employee cũng gọi được hàm store()
    // Logic store() trong Controller đã tự phân luồng WinForm/Web
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']); // Hàm tạo đơn
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::put('orders/{order}', [OrderController::class, 'update']);
    Route::delete('orders/{order}', [OrderController::class, 'destroy']);
    // --------------------

    // Customer only routes
    // Stock Alerts Routes (Authenticated users)
    Route::prefix('stock-alerts')->group(function () {
        Route::post('subscribe', [StockAlertController::class, 'subscribe']);
        Route::delete('unsubscribe/{productId}', [StockAlertController::class, 'unsubscribe']);
        Route::get('my-alerts', [StockAlertController::class, 'myAlerts']);
        Route::get('check/{productId}', [StockAlertController::class, 'checkSubscription']);
    });

    // Wishlist Routes (Authenticated users)
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/', [WishlistController::class, 'store']);
        Route::delete('/{productId}', [WishlistController::class, 'destroy']);
        Route::post('/clear', [WishlistController::class, 'clear']);
        Route::get('/check/{productId}', [WishlistController::class, 'check']);
        Route::get('/count', [WishlistController::class, 'count']);
        Route::post('/sync', [WishlistController::class, 'sync']);
    });

    // Recently Viewed Routes (Authenticated users)
    Route::prefix('recently-viewed')->group(function () {
        Route::get('/', [RecentlyViewedController::class, 'index']);
        Route::post('/', [RecentlyViewedController::class, 'store']);
        Route::delete('/{productId}', [RecentlyViewedController::class, 'destroy']);
        Route::delete('/clear', [RecentlyViewedController::class, 'clear']);
        Route::post('/sync', [RecentlyViewedController::class, 'sync']);
    });

    Route::middleware('role.customer')->group(function () {
        Route::get('cart', [CartController::class, 'show']);
        Route::post('cart/items', [CartController::class, 'addItem']);
        Route::patch('cart/items/{cartItem}', [CartController::class, 'updateItem']);
        Route::delete('cart/items/{cartItem}', [CartController::class, 'removeItem']);
        Route::post('cart/apply-promotion', [CartController::class, 'applyPromotion']);
        Route::post('cart/remove-promotion', [CartController::class, 'removePromotion']);
        Route::post('cart/validate-stock', [CartController::class, 'validateStock']);
        Route::post('cart/clear', [CartController::class, 'clear']);

        // Đã xóa dòng apiResource('orders') ở đây vì đã đưa lên trên

        // Các route order action riêng của khách hàng thì giữ lại
        Route::put('orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::get('orders/{id}/payment/qr-code', [OrderController::class, 'getQRCode']);
        Route::get('orders/{id}/payment/momo-qr-code', [OrderController::class, 'getMoMoQRCode']);
        Route::post('orders/{id}/confirm-transfer', [OrderController::class, 'confirmTransfer']);

        // MoMo Payment Routes (thanh toán tự động với webhook)
        Route::post('orders/{id}/momo/create', [MoMoPaymentController::class, 'createPayment']);
        Route::get('orders/{id}/momo/status', [MoMoPaymentController::class, 'checkStatus']);

        // VNPay Payment Routes (thanh toán tự động với webhook)
        Route::post('payments/vnpay/create/{orderId}', [VNPayController::class, 'createPayment']);
        Route::get('payments/vnpay/status/{txnRef}', [VNPayController::class, 'checkStatus']);

        Route::get('orders/{orderId}/payment/status', [PaymentController::class, 'checkPaymentStatus']);
        Route::apiResource('return-requests', ReturnRequestController::class)->only(['index', 'store', 'update']);
        Route::apiResource('reviews', ReviewController::class)->except(['index']);
        Route::apiResource('warranties', WarrantyController::class)->only(['index', 'store', 'show', 'update']);
        Route::put('warranties/{warranty}/items/{item}', [WarrantyController::class, 'updateItem']);
        Route::get('orders/{order}/warranties', [WarrantyController::class, 'getByOrder']);
    });

    Route::apiResource('categories', CategoryController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('products', ProductController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('suppliers', SupplierController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('promotions', PromotionController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('payment-methods', PaymentMethodController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('inventory-imports', InventoryImportController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});

// Public routes (đã xóa cache middleware)
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);

// Weather API (Public)
Route::prefix('weather')->group(function () {
    Route::get('temperature', [WeatherController::class, 'getTemperature']);
});

// Product Temperature Classification API (Public) - Phải đặt TRƯỚC apiResource products
Route::prefix('products')->group(function () {
    // Kiểm tra trạng thái AI
    Route::get('ai-status', [ProductTemperatureController::class, 'checkAIStatus']);
    // Phân loại nhiệt độ từ payload
    Route::post('classify-temperature', [ProductTemperatureController::class, 'classifyFromPayload']);
    // Phân loại nhiệt độ từ database
    Route::get('classify-temperature', [ProductTemperatureController::class, 'classifyFromDatabase']);
    // Gợi ý món ăn theo nhiệt độ
    Route::get('suggest-by-temperature', [ProductTemperatureController::class, 'suggestByTemperature']);
});

// Products routes - Phải đặt SAU các route cụ thể
Route::apiResource('products', ProductController::class)->only(['index', 'show']);
Route::get('products-all', [ProductController::class, 'all']); // Lấy tất cả sản phẩm không lọc

Route::apiResource('suppliers', SupplierController::class)->only(['index', 'show']);
Route::apiResource('promotions', PromotionController::class)->only(['index', 'show']);
Route::post('promotions/validate', [PromotionController::class, 'validateCode']);
Route::apiResource('payment-methods', PaymentMethodController::class)->only(['index', 'show']);

// Address API (proxy to AddressKit to avoid CORS)
Route::get('address/provinces', [App\Http\Controllers\Api\AddressController::class, 'getProvinces']);
Route::get('address/provinces/{provinceId}/communes', [App\Http\Controllers\Api\AddressController::class, 'getCommunes']);

// Contact Form (Public)
Route::post('contact', [ContactController::class, 'store']);

// Public routes for Product Reviews & Questions (Website)
Route::get('products/{product}/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'index']);
Route::get('products/{product}/questions', [\App\Http\Controllers\Api\ProductQuestionController::class, 'index']);

// Admin routes
Route::prefix('admin')->middleware(['auth:sanctum', 'role.admin'])->group(function () {
    // Dashboard
    Route::get('dashboard/statistics', [AdminDashboardController::class, 'getStatistics']);
    Route::get('dashboard/today-statistics', [AdminDashboardController::class, 'getTodayStatistics']);
    Route::get('dashboard/recent-orders', [AdminDashboardController::class, 'getRecentOrders']);
    Route::get('dashboard/top-products', [AdminDashboardController::class, 'getTopProducts']);
    Route::get('dashboard/sales-chart', [AdminDashboardController::class, 'getSalesChart']);
    // ✅ OPTIMIZATION: Gộp tất cả API calls thành 1
    Route::get('dashboard/all-data', [AdminDashboardController::class, 'getAllData']);

    // Products (Admin)
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);
    Route::get('products/{product}/can-delete', [ProductController::class, 'canDelete']);
    Route::post('products', [ProductController::class, 'store']);
    Route::post('products/generate-sku', [ProductController::class, 'generateSku']);
    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);

    // Orders (Admin)
    // Lưu ý: Route POST /orders đã có ở trên dùng chung
    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('orders/{id}/verify-payment', [OrderController::class, 'verifyPayment']);
    Route::post('orders/{id}/reject-payment', [OrderController::class, 'rejectPayment']);
    Route::post('orders/{id}/process-refund', [OrderController::class, 'processRefund']);
    Route::post('orders/{id}/confirm-cancel', [OrderController::class, 'confirmCancel']);
    Route::post('orders/{id}/reject-cancel', [OrderController::class, 'rejectCancel']);
    
    // MoMo Payment Routes cho Admin/Staff (Winform)
    Route::post('orders/{id}/momo/create', [MoMoPaymentController::class, 'createPayment']);
    Route::get('orders/{id}/momo/status', [MoMoPaymentController::class, 'checkStatus']);
    
    // VNPay Payment Routes cho Admin/Staff (Winform)
    Route::post('payments/vnpay/create/{orderId}', [VNPayController::class, 'createPayment']);
    Route::get('payments/vnpay/status/{txnRef}', [VNPayController::class, 'checkStatus']);

    // Users (Admin)
    Route::apiResource('users', AdminUserController::class);
    Route::get('users/{user}/can-delete', [AdminUserController::class, 'canDelete']);
    Route::post('users/{user}/deactivate', [AdminUserController::class, 'deactivate']);
    Route::post('users/{user}/activate', [AdminUserController::class, 'activate']);
    Route::put('users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::post('users/{user}/upload-avatar', [AdminUserController::class, 'uploadAvatarBase64']);

    // Categories (Admin)
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);
    Route::get('categories/{category}/can-delete', [CategoryController::class, 'canDelete']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

    // Promotions (Admin)
    Route::get('promotions', [PromotionController::class, 'index']);
    Route::get('promotions/{promotion}', [PromotionController::class, 'show']);
    Route::get('promotions/{promotion}/can-delete', [PromotionController::class, 'canDelete']);
    Route::post('promotions', [PromotionController::class, 'store']);
    Route::put('promotions/{promotion}', [PromotionController::class, 'update']);
    Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy']);

    // Payments (Admin)
    Route::post('payments/{transactionId}/confirm', [PaymentController::class, 'confirmPayment']);

    // Warranties (Admin)
    Route::apiResource('warranties', WarrantyController::class);
    Route::get('orders/{order}/warranties', [WarrantyController::class, 'getByOrder']);

    // Suppliers (Admin)
    Route::get('suppliers', [SupplierController::class, 'index']);
    Route::get('suppliers/{supplier}', [SupplierController::class, 'show']);
    Route::post('suppliers', [SupplierController::class, 'store']);
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy']);

    // Inventory Imports (Admin)
    Route::get('inventory-imports', [InventoryImportController::class, 'index']);
    Route::post('inventory-imports', [InventoryImportController::class, 'store']);
    Route::get('inventory-imports/{inventoryImport}', [InventoryImportController::class, 'show']);
    Route::put('inventory-imports/{inventoryImport}', [InventoryImportController::class, 'update']);
    Route::put('inventory-imports/{inventoryImport}/status', [InventoryImportController::class, 'updateStatus']);
    Route::delete('inventory-imports/{inventoryImport}', [InventoryImportController::class, 'destroy']);

    // Contact Management (Admin)
    Route::get('contacts', [ContactController::class, 'index']);
    Route::get('contacts/{id}', [ContactController::class, 'show']);
    Route::put('contacts/{id}/status', [ContactController::class, 'updateStatus']);
    Route::delete('contacts/{id}', [ContactController::class, 'destroy']);

    // Face Recognition (Admin)
    Route::prefix('face')->group(function () {
        Route::get('status', [FaceRecognitionController::class, 'checkStatus']);
        Route::get('customers', [FaceRecognitionController::class, 'getCustomersWithAvatar']);
        Route::post('recognize', [FaceRecognitionController::class, 'recognize']);
    });
});

// Authenticated routes for reviews and questions
Route::middleware('auth:sanctum')->group(function () {
    Route::post('products/{product}/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'store']);
    Route::put('reviews/{review}', [\App\Http\Controllers\Api\ProductReviewController::class, 'update']);
    Route::delete('reviews/{review}', [\App\Http\Controllers\Api\ProductReviewController::class, 'destroy']);
    Route::post('reviews/{review}/helpful', [\App\Http\Controllers\Api\ProductReviewController::class, 'markHelpful']);

    Route::post('products/{product}/questions', [\App\Http\Controllers\Api\ProductQuestionController::class, 'store']);
    Route::post('questions/{question}/answer', [\App\Http\Controllers\Api\ProductQuestionController::class, 'answer']);
    Route::delete('questions/{question}', [\App\Http\Controllers\Api\ProductQuestionController::class, 'destroy']);
    Route::post('questions/{question}/helpful', [\App\Http\Controllers\Api\ProductQuestionController::class, 'markHelpful']);
});

// Webhook routes (public - no auth required)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);

// MoMo Payment Webhook & Return URL (Public - không cần auth)
Route::post('payments/momo/webhook', [MoMoPaymentController::class, 'webhook']);
Route::get('payments/momo/return', [MoMoPaymentController::class, 'return']);

// VNPay Payment Webhook & Return URL (Public - không cần auth)
Route::get('payments/vnpay/return', [VNPayController::class, 'handleReturn']);
Route::get('payments/vnpay/verify', [VNPayController::class, 'verifyReturn']); // API xác thực từ frontend
Route::post('payments/vnpay/webhook', [VNPayController::class, 'handleWebhook']);
Route::get('payments/vnpay/webhook', [VNPayController::class, 'handleWebhook']); // VNPay có thể gọi GET
Route::get('payments/vnpay/info', [VNPayController::class, 'getInfo']);

// WinForm API (POS - Bán hàng tại cửa hàng)
// GET routes - public để load dữ liệu
Route::prefix('winform')->group(function () {
    Route::get('promotions', [WinFormPromotionController::class, 'index']);           // Danh sách đang hoạt động
    Route::get('promotions/all', [WinFormPromotionController::class, 'all']);         // Tất cả (để quản lý)
    Route::get('promotions/quick-list', [WinFormPromotionController::class, 'quickList']); // Danh sách nhanh
    Route::get('promotions/{id}', [WinFormPromotionController::class, 'show']);       // Chi tiết
});

// WinForm API - Protected routes (cần auth)
Route::prefix('winform')->middleware(['auth:sanctum', 'role.admin'])->group(function () {
    Route::post('promotions/validate', [WinFormPromotionController::class, 'validateCode']); // Kiểm tra mã
    Route::post('promotions', [WinFormPromotionController::class, 'store']);          // Tạo mới
    Route::put('promotions/{id}', [WinFormPromotionController::class, 'update']);     // Cập nhật
    Route::delete('promotions/{id}', [WinFormPromotionController::class, 'destroy']); // Xóa
});

// Reports API - Báo cáo doanh thu
Route::prefix('reports')->middleware(['auth:sanctum', 'role.admin'])->group(function () {
    Route::get('ban-hang', [ReportController::class, 'banHang']);
    Route::post('tong-quan', [ReportController::class, 'tongQuan']);
    Route::post('doanh-thu', [ReportController::class, 'doanhThu']);
    Route::post('san-pham', [ReportController::class, 'sanPham']);
    Route::post('ton-kho', [ReportController::class, 'tonKho']);
    Route::post('khach-hang', [ReportController::class, 'khachHang']);
    Route::post('nha-cung-cap', [ReportController::class, 'nhaCungCap']);
    Route::post('nhan-vien', [ReportController::class, 'nhanVien']);
    Route::post('bao-hanh', [ReportController::class, 'baoHanh']);
    Route::get('bao-hanh-stats', [ReportController::class, 'baoHanhStats']);
    Route::get('khach-hang-stats', [ReportController::class, 'khachHangStats']);
    Route::get('khuyen-mai-stats', [ReportController::class, 'khuyenMaiStats']);
    Route::get('nha-cung-cap-stats', [ReportController::class, 'nhaCungCapStats']);
    Route::get('nhan-vien-stats', [ReportController::class, 'nhanVienStats']);
    Route::get('nhap-hang-stats', [ReportController::class, 'nhapHangStats']);
});
