<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\LocalAITemperatureClassifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductTemperatureController extends Controller
{
    private $localAIClassifier;

    public function __construct()
    {
        // AI Service đã tích hợp rule-based, không cần TemperatureClassifier nữa
        if (config('services.local_ai.enabled')) {
            $this->localAIClassifier = new LocalAITemperatureClassifier();
        }
    }

    /**
     * Phân loại nhiệt độ cho danh sách sản phẩm từ payload
     * POST /api/products/classify-temperature
     * 
     * Body: {
     *   "data": [
     *     {"id": 1, "name": "Cà phê đen đá", "category": {"name": "Cà phê"}},
     *     ...
     *   ]
     * }
     */
    public function classifyFromPayload(Request $request)
    {
        try {
            $payload = $request->all();
            $data = $payload['data'] ?? [];

            if (empty($data)) {
                return response()->json([
                    'message' => 'Dữ liệu sản phẩm không được để trống',
                    'data' => []
                ], 422);
            }

            $result = [];
            foreach ($data as $p) {
                $id = $p['id'] ?? null;
                $name = $p['name'] ?? null;
                $categoryName = $p['category']['name'] ?? $p['categoryName'] ?? null;
                $attributes = $p['attributes'] ?? null;

                // Gọi AI Service (đã tích hợp rule-based + model)
                $classification = $this->localAIClassifier 
                    ? $this->localAIClassifier->classify($name, $categoryName, $attributes)
                    : [
                        'temperature' => 'UNKNOWN',
                        'confidence' => 0.0,
                        'source' => 'AI_DISABLED',
                        'reason' => 'AI service không được bật'
                    ];

                $result[] = [
                    'id' => $id,
                    'name' => $name,
                    'categoryName' => $categoryName,
                    'temperature' => $classification['temperature'],
                    'confidence' => $classification['confidence'],
                    'source' => $classification['source'],
                    'reason' => $classification['reason'],
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'total' => count($result)
            ]);

        } catch (\Exception $e) {
            Log::error('Error classifying products temperature', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi phân loại nhiệt độ sản phẩm',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Lấy sản phẩm từ database và phân loại nhiệt độ
     * GET /api/products/classify-temperature
     * 
     * Query params:
     * - category_id: Lọc theo danh mục
     * - search: Tìm kiếm
     * - limit: Số lượng sản phẩm
     */
    public function classifyFromDatabase(Request $request)
    {
        try {
            $query = Product::with(['category:id,name,slug'])
                ->where('status', 'published')
                ->select('id', 'name', 'category_id', 'thumbnail', 'price', 'attributes');

            // Lọc theo danh mục
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Tìm kiếm
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('short_description', 'like', "%{$search}%");
                });
            }

            // Giới hạn số lượng
            $limit = $request->input('limit', 50);
            $products = $query->limit($limit)->get();

            // Chuẩn bị data cho BATCH classification (NHANH HƠN NHIỀU)
            $productsData = $products->map(function ($product) {
                $attributes = $product->attributes;
                if (is_string($attributes)) {
                    $attributes = json_decode($attributes, true) ?: null;
                }
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'categoryName' => $product->category->name ?? null,
                    'thumbnail' => $product->thumbnail,
                    'price' => $product->price,
                    'attributes' => $attributes
                ];
            })->toArray();

            // Gọi AI Service BATCH - 1 request thay vì N requests
            $result = $this->localAIClassifier 
                ? $this->localAIClassifier->classifyBatch($productsData)
                : array_map(function ($p) {
                    return array_merge($p, [
                        'temperature' => 'UNKNOWN',
                        'confidence' => 0.0,
                        'source' => 'AI_DISABLED',
                        'reason' => 'AI service không được bật'
                    ]);
                }, $productsData);

            return response()->json([
                'success' => true,
                'data' => $result,
                'total' => count($result)
            ]);

        } catch (\Exception $e) {
            Log::error('Error classifying products from database', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy và phân loại sản phẩm',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Gợi ý món ăn theo nhiệt độ mong muốn
     * GET /api/products/suggest-by-temperature?temperature=HOT&limit=10
     * 
     * Query params:
     * - temperature: HOT, COLD, ROOM, hoặc UNKNOWN
     * - limit: Số lượng sản phẩm (mặc định: 10)
     * - min_confidence: Độ tin cậy tối thiểu (0.0 - 1.0, mặc định: 0.6)
     * - category_id: Lọc theo danh mục
     */
    public function suggestByTemperature(Request $request)
    {
        try {
            $desiredTemperature = strtoupper($request->input('temperature', 'HOT'));
            $limit = $request->input('limit', 10);
            $minConfidence = (float) $request->input('min_confidence', 0.6);
            $categoryId = $request->input('category_id');

            // Validate temperature
            $validTemperatures = ['HOT', 'COLD', 'ROOM', 'UNKNOWN'];
            if (!in_array($desiredTemperature, $validTemperatures)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nhiệt độ không hợp lệ. Chọn: HOT, COLD, ROOM, hoặc UNKNOWN'
                ], 422);
            }

            // Lấy sản phẩm từ database
            $query = Product::with(['category:id,name,slug'])
                ->where('status', 'published')
                ->select('id', 'name', 'category_id', 'thumbnail', 'price', 'original_price', 'attributes', 'short_description');

            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }

            $products = $query->limit(100)->get(); // Lấy nhiều hơn để filter

            // Phân loại và lọc
            $classified = [];
            foreach ($products as $product) {
                // Convert attributes to array if it's a string
                $attributes = $product->attributes;
                if (is_string($attributes)) {
                    $attributes = json_decode($attributes, true) ?: null;
                }
                
                // Gọi AI Service (đã tích hợp rule-based + model)
                $classification = $this->localAIClassifier 
                    ? $this->localAIClassifier->classify(
                        $product->name,
                        $product->category->name ?? null,
                        $attributes
                    )
                    : [
                        'temperature' => 'UNKNOWN',
                        'confidence' => 0.0,
                        'source' => 'AI_DISABLED',
                        'reason' => 'AI service không được bật'
                    ];

                if ($classification['temperature'] === $desiredTemperature && 
                    $classification['confidence'] >= $minConfidence) {
                    $classified[] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'categoryName' => $product->category->name ?? null,
                        'thumbnail' => $product->thumbnail,
                        'price' => $product->price,
                        'original_price' => $product->original_price,
                        'short_description' => $product->short_description,
                        'temperature' => $classification['temperature'],
                        'confidence' => $classification['confidence'],
                        'source' => $classification['source'],
                        'reason' => $classification['reason'],
                    ];
                }
            }

            // Sắp xếp theo confidence giảm dần
            usort($classified, function ($a, $b) {
                return $b['confidence'] <=> $a['confidence'];
            });

            // Giới hạn số lượng
            $suggestions = array_slice($classified, 0, $limit);

            return response()->json([
                'success' => true,
                'data' => $suggestions,
                'total' => count($suggestions),
                'filter' => [
                    'temperature' => $desiredTemperature,
                    'min_confidence' => $minConfidence,
                    'category_id' => $categoryId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error suggesting products by temperature', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gợi ý sản phẩm',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Kiểm tra trạng thái AI và test phân loại
     * GET /api/products/ai-status
     */
    public function checkAIStatus(Request $request)
    {
        $isLocalAIEnabled = config('services.local_ai.enabled');
        $localAIUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
        
        $classifierType = 'AI Service (Rule-Based + ML Model)';
        if (!$isLocalAIEnabled) {
            $classifierType = 'AI Service Disabled';
        }

        // Test với một sản phẩm mẫu
        $testProduct = [
            'name' => 'Cà phê đặc biệt của quán',
            'categoryName' => 'Cà phê'
        ];
        
        // Test AI Service (đã tích hợp rule-based + model)
        $aiResult = null;
        if ($this->localAIClassifier) {
            $aiResult = $this->localAIClassifier->classify(
                $testProduct['name'],
                $testProduct['categoryName']
            );
        } else {
            $aiResult = [
                'temperature' => 'UNKNOWN',
                'confidence' => 0.0,
                'source' => 'AI_DISABLED',
                'reason' => 'AI service không được bật'
            ];
        }

        return response()->json([
            'success' => true,
            'ai_status' => [
                'local_ai' => [
                    'enabled' => $isLocalAIEnabled,
                    'url' => $localAIUrl,
                ],
                'active_classifier_type' => $classifierType,
                'priority_order' => [
                    '1. Rule-Based (tích hợp trong AI Service)',
                    '2. ML Model (tích hợp trong AI Service) - chỉ khi rule-based không chắc chắn',
                ],
                'note' => 'Rule-based đã được tích hợp vào AI Service (Python), không còn ở Backend nữa',
            ],
            'test_result' => [
                'product' => $testProduct,
                'ai_service_result' => $aiResult,
                'final_classification' => $aiResult,
            ],
            'instructions' => [
                'check_source' => 'Kiểm tra field "source": "RULE" = rule-based (từ AI Service), "MODEL" = ML Model (từ AI Service), "ATTRIBUTE" = từ attributes',
                'test_endpoint' => 'GET /api/products/classify-temperature?limit=5',
                'suggest_endpoint' => 'GET /api/products/suggest-by-temperature?temperature=COLD&limit=5',
            ]
        ]);
    }
}
