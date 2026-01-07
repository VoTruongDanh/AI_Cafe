<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAlert;
use App\Models\Product;
use Illuminate\Http\Request;

class StockAlertController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $product = Product::findOrFail($request->product_id);

        if ($product->stock_quantity > 0) {
            return response()->json([
                'message' => 'Sản phẩm hiện đang có hàng',
            ], 400);
        }

        $alert = StockAlert::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'product_id' => $request->product_id,
            ],
            [
                'email' => auth()->user()->email,
                'notified' => false,
            ]
        );

        return response()->json([
            'message' => 'Đã đăng ký nhận thông báo khi có hàng',
            'alert' => $alert,
        ]);
    }

    public function unsubscribe(Request $request, $productId)
    {
        StockAlert::where('user_id', auth()->id())
            ->where('product_id', $productId)
            ->delete();

        return response()->json([
            'message' => 'Đã hủy đăng ký thông báo',
        ]);
    }

    public function myAlerts()
    {
        $alerts = StockAlert::where('user_id', auth()->id())
            ->with('product')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($alerts);
    }

    public function checkSubscription($productId)
    {
        $alert = StockAlert::where('user_id', auth()->id())
            ->where('product_id', $productId)
            ->first();

        return response()->json([
            'subscribed' => $alert !== null,
            'alert' => $alert,
        ]);
    }
}
