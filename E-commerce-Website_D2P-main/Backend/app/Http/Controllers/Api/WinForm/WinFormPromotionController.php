<?php

namespace App\Http\Controllers\Api\WinForm;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="WinForm - Promotions",
 *     description="API khuyến mãi cho ứng dụng POS (bán hàng tại cửa hàng)"
 * )
 */
class WinFormPromotionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/winform/promotions",
     *     tags={"WinForm - Promotions"},
     *     summary="Danh sách khuyến mãi cho POS",
     *     description="Lấy danh sách khuyến mãi đang hoạt động, áp dụng cho kênh offline/POS",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string"), description="Tìm theo tên hoặc mã"),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách khuyến mãi",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Promotion")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền")
     * )
     */
    public function index(Request $request)
    {
        // Lấy khuyến mãi của Winform/POS (lọc theo channels)
        $query = Promotion::query()
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhere('channels', '[]')
                    ->orWhere('channels', 'null')
                    ->orWhereJsonContains('channels', 'pos')
                    ->orWhereJsonContains('channels', 'offline')
                    ->orWhereJsonContains('channels', 'winform')
                    ->orWhereJsonContains('channels', 'all');
            });

        // Tìm kiếm
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%");
            });
        }

        $promotions = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => $promotions,
            'message' => 'Danh sách khuyến mãi POS'
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/winform/promotions/validate",
     *     tags={"WinForm - Promotions"},
     *     summary="Kiểm tra mã khuyến mãi",
     *     description="Kiểm tra mã khuyến mãi có hợp lệ cho đơn hàng POS không",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"code", "order_total"},
     *             @OA\Property(property="code", type="string", example="POS10", description="Mã khuyến mãi"),
     *             @OA\Property(property="order_total", type="number", example=5000000, description="Tổng tiền đơn hàng")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Mã hợp lệ",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="valid", type="boolean", example=true),
     *             @OA\Property(property="discount", type="number", example=500000),
     *             @OA\Property(property="promotion", ref="#/components/schemas/Promotion"),
     *             @OA\Property(property="message", type="string", example="Áp dụng thành công! Giảm 500,000đ")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Mã không hợp lệ"),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_total' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $orderTotal = $request->input('order_total');

        // Tìm khuyến mãi
        $promotion = Promotion::where('code', $code)
            ->where('is_active', true)
            ->first();

        if (!$promotion) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Mã khuyến mãi không tồn tại.'
            ], 400);
        }

        // Kiểm tra thời gian
        $now = now();
        if ($promotion->starts_at && $promotion->starts_at->gt($now)) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Mã khuyến mãi chưa bắt đầu.'
            ], 400);
        }

        if ($promotion->ends_at && $promotion->ends_at->lt($now)) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Mã khuyến mãi đã hết hạn.'
            ], 400);
        }

        // Kiểm tra kênh áp dụng
        if ($promotion->channels && !empty($promotion->channels)) {
            $allowedChannels = ['pos', 'offline', 'winform', 'all'];
            $hasValidChannel = false;
            foreach ($promotion->channels as $channel) {
                if (in_array(strtolower($channel), $allowedChannels)) {
                    $hasValidChannel = true;
                    break;
                }
            }
            if (!$hasValidChannel) {
                return response()->json([
                    'success' => false,
                    'valid' => false,
                    'message' => 'Mã này không áp dụng cho bán hàng tại cửa hàng.'
                ], 400);
            }
        }

        // Kiểm tra lượt sử dụng
        if ($promotion->usage_limit && $promotion->used_count >= $promotion->usage_limit) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Mã khuyến mãi đã hết lượt sử dụng.'
            ], 400);
        }

        // Kiểm tra giá trị đơn tối thiểu
        if ($promotion->min_order_value && $orderTotal < $promotion->min_order_value) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Đơn hàng tối thiểu ' . number_format($promotion->min_order_value) . 'đ để sử dụng mã này.'
            ], 400);
        }

        // Tính số tiền giảm
        $discount = 0;
        if ($promotion->promotion_type === 'percentage') {
            $discount = ($orderTotal * $promotion->value) / 100;
            if ($promotion->max_discount_value) {
                $discount = min($discount, $promotion->max_discount_value);
            }
        } else {
            // fixed amount
            $discount = $promotion->value;
        }

        // Không giảm quá tổng đơn
        $discount = min($discount, $orderTotal);

        return response()->json([
            'success' => true,
            'valid' => true,
            'discount' => $discount,
            'final_total' => $orderTotal - $discount,
            'promotion' => $promotion,
            'message' => 'Áp dụng thành công! Giảm ' . number_format($discount) . 'đ'
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/winform/promotions/quick-list",
     *     tags={"WinForm - Promotions"},
     *     summary="Danh sách nhanh mã giảm giá",
     *     description="Lấy danh sách mã giảm giá phổ biến để hiển thị nhanh trên POS",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách mã",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="code", type="string"),
     *                     @OA\Property(property="name", type="string"),
     *                     @OA\Property(property="description", type="string"),
     *                     @OA\Property(property="discount_text", type="string", example="Giảm 10%")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function quickList()
    {
        $promotions = Promotion::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'pos')
                    ->orWhereJsonContains('channels', 'offline')
                    ->orWhereJsonContains('channels', 'winform')
                    ->orWhereJsonContains('channels', 'all');
            })
            ->where(function ($q) {
                $q->whereNull('usage_limit')
                    ->orWhereRaw('used_count < usage_limit');
            })
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'code', 'name', 'description', 'promotion_type', 'value', 'max_discount_value', 'min_order_value']);

        // Format discount text
        $data = $promotions->map(function ($promo) {
            $discountText = $promo->promotion_type === 'percentage'
                ? "Giảm {$promo->value}%"
                : "Giảm " . number_format($promo->value) . "đ";

            if ($promo->max_discount_value) {
                $discountText .= " (tối đa " . number_format($promo->max_discount_value) . "đ)";
            }

            $conditionText = '';
            if ($promo->min_order_value) {
                $conditionText = "Đơn tối thiểu " . number_format($promo->min_order_value) . "đ";
            }

            return [
                'id' => $promo->id,
                'code' => $promo->code,
                'name' => $promo->name,
                'description' => $promo->description,
                'discount_text' => $discountText,
                'condition_text' => $conditionText,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Danh sách mã giảm giá nhanh'
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/winform/promotions",
     *     tags={"WinForm - Promotions"},
     *     summary="Tạo khuyến mãi mới",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "code", "promotion_type", "value"},
     *             @OA\Property(property="name", type="string", example="Giảm 10% tại cửa hàng"),
     *             @OA\Property(property="code", type="string", example="POS10NEW"),
     *             @OA\Property(property="description", type="string", example="Mô tả khuyến mãi"),
     *             @OA\Property(property="promotion_type", type="string", enum={"percentage", "fixed"}, example="percentage"),
     *             @OA\Property(property="value", type="number", example=10),
     *             @OA\Property(property="max_discount_value", type="number", example=500000),
     *             @OA\Property(property="min_order_value", type="number", example=1000000),
     *             @OA\Property(property="usage_limit", type="integer", example=100),
     *             @OA\Property(property="is_active", type="boolean", example=true),
     *             @OA\Property(property="starts_at", type="string", format="date-time"),
     *             @OA\Property(property="ends_at", type="string", format="date-time")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Tạo thành công"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:promotions,code',
            'description' => 'nullable|string',
            'promotion_type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        // Mặc định áp dụng cho POS
        $data['channels'] = ['pos', 'offline'];
        $data['code'] = strtoupper($data['code']);

        $promotion = Promotion::create($data);

        return response()->json([
            'success' => true,
            'data' => $promotion,
            'message' => 'Tạo khuyến mãi thành công!'
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/api/winform/promotions/{id}",
     *     tags={"WinForm - Promotions"},
     *     summary="Chi tiết khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết khuyến mãi"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show($id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khuyến mãi.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $promotion
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/winform/promotions/{id}",
     *     tags={"WinForm - Promotions"},
     *     summary="Cập nhật khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string"),
     *             @OA\Property(property="code", type="string"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="promotion_type", type="string", enum={"percentage", "fixed"}),
     *             @OA\Property(property="value", type="number"),
     *             @OA\Property(property="max_discount_value", type="number"),
     *             @OA\Property(property="min_order_value", type="number"),
     *             @OA\Property(property="usage_limit", type="integer"),
     *             @OA\Property(property="is_active", type="boolean"),
     *             @OA\Property(property="starts_at", type="string", format="date-time"),
     *             @OA\Property(property="ends_at", type="string", format="date-time")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function update(Request $request, $id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khuyến mãi.'
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:promotions,code,' . $id,
            'description' => 'nullable|string',
            'promotion_type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $promotion->update($data);

        return response()->json([
            'success' => true,
            'data' => $promotion->fresh(),
            'message' => 'Cập nhật khuyến mãi thành công!'
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/winform/promotions/{id}",
     *     tags={"WinForm - Promotions"},
     *     summary="Xóa khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Xóa thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy($id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khuyến mãi.'
            ], 404);
        }

        $promotion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa khuyến mãi thành công!'
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/winform/promotions/all",
     *     tags={"WinForm - Promotions"},
     *     summary="Tất cả khuyến mãi (kể cả hết hạn)",
     *     description="Lấy tất cả khuyến mãi để quản lý, bao gồm cả đã hết hạn hoặc không hoạt động",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="is_active", in="query", @OA\Schema(type="boolean")),
     *     @OA\Response(response=200, description="Danh sách khuyến mãi")
     * )
     */
    public function all(Request $request)
    {
        $query = Promotion::query();

        // Tìm kiếm
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%");
            });
        }

        // Lọc theo trạng thái
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $promotions = $query->orderByDesc('created_at')->get();

        // Thêm thông tin trạng thái
        $data = $promotions->map(function ($promo) {
            $status = 'active';
            $statusText = 'Đang hoạt động';

            if (!$promo->is_active) {
                $status = 'inactive';
                $statusText = 'Đã tắt';
            } elseif ($promo->ends_at && $promo->ends_at->lt(now())) {
                $status = 'expired';
                $statusText = 'Đã hết hạn';
            } elseif ($promo->starts_at && $promo->starts_at->gt(now())) {
                $status = 'scheduled';
                $statusText = 'Chưa bắt đầu';
            } elseif ($promo->usage_limit && $promo->used_count >= $promo->usage_limit) {
                $status = 'exhausted';
                $statusText = 'Đã hết lượt';
            }

            return array_merge($promo->toArray(), [
                'status' => $status,
                'status_text' => $statusText,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Danh sách tất cả khuyến mãi'
        ]);
    }
}
