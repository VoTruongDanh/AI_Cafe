<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\TemperatureClassifier;
use App\Services\LocalAITemperatureClassifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductTemperatureController extends Controller
{
    private $classifier;
    private $ruleBasedClassifier;
    private $localAIClassifier;

    public function __construct(
        TemperatureClassifier $ruleBasedClassifier
    ) {
        $this->ruleBasedClassifier = $ruleBasedClassifier;
        
        // Chỉ dùng Local AI nếu enabled (không dùng Gemini API nữa)
        if (config('services.local_ai.enabled')) {
            $this->localAIClassifier = new LocalAITemperatureClassifier($ruleBasedClassifier);
        }
        
        // Mặc định dùng rule-based
        $this->classifier = $ruleBasedClassifier;
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

                // Ưu tiên rule-based trước
                $classification = $this->ruleBasedClassifier->classify($name, $categoryName, $attributes);
                
                // Nếu rule-based không chắc chắn (confidence < 0.8 hoặc UNKNOWN), thử Local AI
                if ($this->localAIClassifier && 
                    ($classification['confidence'] < 0.8 || $classification['temperature'] === 'UNKNOWN')) {
                    $aiResult = $this->localAIClassifier->classify($name, $categoryName, $attributes);
                    // Chỉ dùng AI nếu confidence cao hơn
                    if ($aiResult && $aiResult['confidence'] > $classification['confidence']) {
                        $classification = $aiResult;
                    }
                }

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

            $result = [];
            foreach ($products as $product) {
                // Convert attributes to array if it's a string
                $attributes = $product->attributes;
                if (is_string($attributes)) {
                    $attributes = json_decode($attributes, true) ?: null;
                }
                
                // Ưu tiên rule-based trước
                $classification = $this->ruleBasedClassifier->classify(
                    $product->name,
                    $product->category->name ?? null,
                    $attributes
                );
                
                // Nếu rule-based không chắc chắn (confidence < 0.8 hoặc UNKNOWN), thử Local AI
                if ($this->localAIClassifier && 
                    ($classification['confidence'] < 0.8 || $classification['temperature'] === 'UNKNOWN')) {
                    $aiResult = $this->localAIClassifier->classify(
                        $product->name,
                        $product->category->name ?? null,
                        $attributes
                    );
                    // Chỉ dùng AI nếu confidence cao hơn
                    if ($aiResult && $aiResult['confidence'] > $classification['confidence']) {
                        $classification = $aiResult;
                    }
                }

                $result[] = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'categoryName' => $product->category->name ?? null,
                    'thumbnail' => $product->thumbnail,
                    'price' => $product->price,
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
                
                // Ưu tiên rule-based trước
                $classification = $this->ruleBasedClassifier->classify(
                    $product->name,
                    $product->category->name ?? null,
                    $attributes
                );
                
                // Nếu rule-based không chắc chắn (confidence < 0.8 hoặc UNKNOWN), thử Local AI
                if ($this->localAIClassifier && 
                    ($classification['confidence'] < 0.8 || $classification['temperature'] === 'UNKNOWN')) {
                    $aiResult = $this->localAIClassifier->classify(
                        $product->name,
                        $product->category->name ?? null,
                        $attributes
                    );
                    // Chỉ dùng AI nếu confidence cao hơn
                    if ($aiResult && $aiResult['confidence'] > $classification['confidence']) {
                        $classification = $aiResult;
                    }
                }

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
        
        $classifierType = 'TemperatureClassifier (Rule-Based)';
        if ($isLocalAIEnabled) {
            $classifierType = 'Rule-Based + LocalAITemperatureClassifier (ML Model)';
        }

        // Test với một sản phẩm mẫu
        $testProduct = [
            'name' => 'Cà phê đặc biệt của quán',
            'categoryName' => 'Cà phê'
        ];

        // Test rule-based
        $ruleResult = $this->ruleBasedClassifier->classify(
            $testProduct['name'],
            $testProduct['categoryName']
        );
        
        // Test Local AI nếu enabled
        $aiResult = null;
        if ($this->localAIClassifier) {
            $aiResult = $this->localAIClassifier->classify(
                $testProduct['name'],
                $testProduct['categoryName']
            );
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
                    '1. Rule-Based (TemperatureClassifier)',
                    '2. Local AI (LocalAITemperatureClassifier) - chỉ khi rule-based không chắc chắn',
                ],
            ],
            'test_result' => [
                'product' => $testProduct,
                'rule_based' => $ruleResult,
                'local_ai' => $aiResult,
                'final_classification' => $aiResult && $aiResult['confidence'] > $ruleResult['confidence'] 
                    ? $aiResult 
                    : $ruleResult,
            ],
            'instructions' => [
                'check_source' => 'Kiểm tra field "source": "RULE" = rule-based, "LOCAL_AI" = Local AI, "ATTRIBUTE" = từ attributes',
                'test_endpoint' => 'GET /api/products/classify-temperature?limit=5',
                'suggest_endpoint' => 'GET /api/products/suggest-by-temperature?temperature=COLD&limit=5',
            ]
        ]);
    }
}
