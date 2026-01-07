<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Local AI Temperature Classifier
 * Gọi AI service local (Python FastAPI) để phân loại nhiệt độ
 * AI service đã tích hợp rule-based, không cần rule-based ở Backend nữa
 * Hoàn toàn tách biệt khỏi database
 */
class LocalAITemperatureClassifier
{
    private string $aiServiceUrl;
    private bool $useAI;

    public function __construct()
    {
        $this->aiServiceUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
        $this->useAI = config('services.local_ai.enabled', true);
    }

    /**
     * Phân loại nhiệt độ: Gọi AI service (đã tích hợp rule-based + model)
     *
     * @param string|null $name Tên sản phẩm
     * @param string|null $categoryName Tên danh mục
     * @param array|string|null $attributes Thuộc tính sản phẩm
     * @return array Kết quả phân loại
     */
    public function classify(?string $name, ?string $categoryName = null, $attributes = null): array
    {
        // Convert attributes to array if it's a string
        if (is_string($attributes)) {
            $attributes = json_decode($attributes, true) ?: null;
        }

        // Kiểm tra trong attributes trước (ưu tiên cao nhất - từ database)
        if ($attributes && is_array($attributes) && isset($attributes['temperature'])) {
            $temp = strtoupper($attributes['temperature']);
            if (in_array($temp, ['HOT', 'COLD', 'ROOM'])) {
                // Gửi mẫu có nhãn chắc chắn để train
                $this->collectSample($name, $categoryName, $temp, 'ATTRIBUTE', 1.0);
                return [
                    'temperature' => $temp,
                    'confidence' => 1.0,
                    'source' => 'ATTRIBUTE',
                    'reason' => 'Nhiệt độ được chỉ định trong attributes'
                ];
            }
        }

        // Gọi AI service (đã tích hợp rule-based + model)
        if ($this->useAI && !empty($name)) {
            $aiResult = $this->predictWithAI($name, $categoryName);
            
            if ($aiResult) {
                // Nếu AI trả về kết quả tốt, gửi mẫu để train (nếu có nhãn)
                if ($aiResult['temperature'] !== 'UNKNOWN' && $aiResult['confidence'] >= 0.8) {
                    $this->collectSample(
                        $name,
                        $categoryName,
                        $aiResult['temperature'],
                        $aiResult['source'],
                        $aiResult['confidence']
                    );
                }
                return $aiResult;
            }
        }

        // Fallback: nếu AI service không khả dụng
        return [
            'temperature' => 'UNKNOWN',
            'confidence' => 0.0,
            'source' => 'AI_SERVICE_UNAVAILABLE',
            'reason' => 'AI service không khả dụng'
        ];
    }

    /**
     * Thu thập mẫu để train (gửi đến AI service /collect)
     */
    private function collectSample(
        ?string $name,
        ?string $categoryName,
        ?string $label,
        string $source,
        float $confidence
    ): void {
        if (!$this->useAI || empty($name)) {
            return;
        }

        try {
            Http::timeout(2)
                ->post($this->aiServiceUrl . '/collect', [
                    'name' => $name,
                    'categoryName' => $categoryName,
                    'label' => $label,
                    'source' => $source,
                    'confidence' => $confidence
                ]);
        } catch (\Exception $e) {
            // Log nhưng không throw để không ảnh hưởng flow chính
            Log::debug('Failed to collect sample to AI service', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Dự đoán bằng AI local service
     */
    private function predictWithAI(?string $name, ?string $categoryName): ?array
    {
        if (!$this->useAI || empty($name)) {
            return null;
        }

        try {
            $response = Http::timeout(3)
                ->post($this->aiServiceUrl . '/predict', [
                    'items' => [
                        [
                            'id' => null,
                            'name' => $name,
                            'categoryName' => $categoryName
                        ]
                    ]
                ]);

            if ($response->successful()) {
                $results = $response->json();
                if (!empty($results) && isset($results[0])) {
                    $result = $results[0];
                    return [
                        'temperature' => $result['temperature'] ?? 'UNKNOWN',
                        'confidence' => (float)($result['confidence'] ?? 0.0),
                        'source' => $result['source'] ?? 'MODEL',
                        'reason' => $result['reason'] ?? 'Dự đoán từ AI local model'
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::debug('AI local service error', [
                'error' => $e->getMessage()
            ]);
        }

        return null;
    }

    /**
     * Phân loại hàng loạt (batch) - gọi AI service batch
     */
    public function classifyBatch(array $products): array
    {
        if (!$this->useAI) {
            // Nếu AI không bật, trả về UNKNOWN cho tất cả
            return array_map(function ($product) {
                return array_merge($product, [
                    'temperature' => 'UNKNOWN',
                    'confidence' => 0.0,
                    'source' => 'AI_DISABLED',
                    'reason' => 'AI service không được bật'
                ]);
            }, $products);
        }

        // Chuẩn bị items để gọi AI batch
        $items = [];
        $productMap = []; // Map để ghép kết quả lại

        foreach ($products as $index => $product) {
            $name = $product['name'] ?? null;
            $categoryName = $product['categoryName'] ?? $product['category']['name'] ?? null;
            $attributes = $product['attributes'] ?? null;

            // Kiểm tra attributes trước (ưu tiên cao nhất)
            if ($attributes && is_array($attributes) && isset($attributes['temperature'])) {
                $temp = strtoupper($attributes['temperature']);
                if (in_array($temp, ['HOT', 'COLD', 'ROOM'])) {
                    $results[$index] = array_merge($product, [
                        'temperature' => $temp,
                        'confidence' => 1.0,
                        'source' => 'ATTRIBUTE',
                        'reason' => 'Nhiệt độ được chỉ định trong attributes'
                    ]);
                    continue;
                }
            }

            // Thêm vào danh sách gọi AI
            $items[] = [
                'id' => $product['id'] ?? null,
                'name' => $name,
                'categoryName' => $categoryName
            ];
            $productMap[count($items) - 1] = $index;
        }

        // Gọi AI batch
        $aiResults = $this->predictBatchWithAI($items);
        $results = [];

        // Ghép kết quả
        foreach ($products as $index => $product) {
            // Nếu đã có kết quả từ attributes, bỏ qua
            if (isset($results[$index])) {
                continue;
            }

            // Tìm kết quả từ AI
            $aiIndex = array_search($index, $productMap);
            if ($aiIndex !== false && isset($aiResults[$aiIndex])) {
                $aiResult = $aiResults[$aiIndex];
                $results[$index] = array_merge($product, $aiResult);
            } else {
                // Fallback
                $results[$index] = array_merge($product, [
                    'temperature' => 'UNKNOWN',
                    'confidence' => 0.0,
                    'source' => 'AI_SERVICE_ERROR',
                    'reason' => 'Không nhận được kết quả từ AI service'
                ]);
            }
        }

        return array_values($results);
    }

    /**
     * Dự đoán batch bằng AI local
     */
    private function predictBatchWithAI(array $items): ?array
    {
        try {
            $response = Http::timeout(5)
                ->post($this->aiServiceUrl . '/predict', [
                    'items' => $items
                ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::debug('AI local batch prediction error', [
                'error' => $e->getMessage()
            ]);
        }

        return null;
    }
}
