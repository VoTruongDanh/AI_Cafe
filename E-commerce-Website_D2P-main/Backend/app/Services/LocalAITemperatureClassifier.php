<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Local AI Temperature Classifier
 * Gọi AI service local (Python FastAPI) để phân loại nhiệt độ
 * Hoàn toàn tách biệt khỏi database
 */
class LocalAITemperatureClassifier
{
    private TemperatureClassifier $ruleBasedClassifier;
    private string $aiServiceUrl;
    private bool $useAI;

    public function __construct(TemperatureClassifier $ruleBasedClassifier)
    {
        $this->ruleBasedClassifier = $ruleBasedClassifier;
        $this->aiServiceUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
        $this->useAI = config('services.local_ai.enabled', true);
    }

    /**
     * Phân loại nhiệt độ: Rule-based trước, AI local sau
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

        // Kiểm tra trong attributes trước (ưu tiên cao nhất)
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

        // Rule-based classification trước (nhanh)
        $ruleResult = $this->ruleBasedClassifier->classify($name, $categoryName, $attributes);

        // Nếu rule-based có kết quả chắc chắn (confidence >= 0.8)
        if ($ruleResult['confidence'] >= 0.8 && in_array($ruleResult['temperature'], ['HOT', 'COLD'])) {
            // Gửi mẫu có nhãn để train
            $this->collectSample(
                $name,
                $categoryName,
                $ruleResult['temperature'],
                $ruleResult['source'],
                $ruleResult['confidence']
            );
            return $ruleResult;
        }

        // Nếu không chắc chắn, thử dùng AI local
        if ($this->useAI && !empty($name)) {
            $aiResult = $this->predictWithAI($name, $categoryName);
            
            // Nếu AI có kết quả và confidence >= 0.60 (ngưỡng trong api.py)
            if ($aiResult && $aiResult['temperature'] !== 'UNKNOWN' && $aiResult['confidence'] >= 0.60) {
                // Chỉ dùng AI nếu confidence cao hơn rule-based hoặc rule-based là UNKNOWN
                if ($aiResult['confidence'] > $ruleResult['confidence'] || $ruleResult['temperature'] === 'UNKNOWN') {
                    return $aiResult;
                }
            }
            
            // Nếu AI không có model hoặc không chắc, gửi mẫu để train sau
            if (!$aiResult || $aiResult['source'] === 'NO_MODEL' || ($aiResult && $aiResult['temperature'] === 'UNKNOWN')) {
                $this->collectSample($name, $categoryName, null, 'UNKNOWN', $ruleResult['confidence']);
            }
        }

        return $ruleResult;
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
     * Phân loại hàng loạt (batch)
     */
    public function classifyBatch(array $products): array
    {
        $results = [];
        $unknownItems = [];

        // Phân loại từng sản phẩm
        foreach ($products as $product) {
            $name = $product['name'] ?? null;
            $categoryName = $product['categoryName'] ?? $product['category']['name'] ?? null;
            $attributes = $product['attributes'] ?? null;

            $result = $this->classify($name, $categoryName, $attributes);
            
            // Nếu không chắc chắn, thêm vào danh sách để gọi AI batch
            if ($result['confidence'] < 0.8 && $result['temperature'] === 'UNKNOWN') {
                $unknownItems[] = [
                    'id' => $product['id'] ?? null,
                    'name' => $name,
                    'categoryName' => $categoryName
                ];
            }

            $results[] = array_merge($product, $result);
        }

        // Nếu có sản phẩm không chắc, gọi AI batch
        if (!empty($unknownItems) && $this->useAI) {
            $aiResults = $this->predictBatchWithAI($unknownItems);
            if ($aiResults) {
                // Cập nhật kết quả từ AI
                foreach ($results as &$result) {
                    foreach ($aiResults as $aiResult) {
                        if (($result['id'] ?? null) === ($aiResult['id'] ?? null)) {
                            if ($aiResult['confidence'] > $result['confidence']) {
                                $result['temperature'] = $aiResult['temperature'];
                                $result['confidence'] = $aiResult['confidence'];
                                $result['source'] = $aiResult['source'];
                                $result['reason'] = $aiResult['reason'] ?? $result['reason'];
                            }
                            break;
                        }
                    }
                }
            }
        }

        return $results;
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
