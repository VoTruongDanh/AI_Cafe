<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * AI Temperature Classifier sử dụng Google Gemini API để phân tích ngữ nghĩa
 * Fallback về rule-based nếu AI không khả dụng
 */
class AITemperatureClassifier
{
    private TemperatureClassifier $ruleBasedClassifier;
    private ?string $geminiApiKey;
    private bool $useAI;
    private string $geminiModel;

    public function __construct(TemperatureClassifier $ruleBasedClassifier)
    {
        $this->ruleBasedClassifier = $ruleBasedClassifier;
        $this->geminiApiKey = config('services.gemini.api_key');
        $this->geminiModel = config('services.gemini.model', 'gemini-pro');
        $this->useAI = !empty($this->geminiApiKey) && config('services.gemini.enabled', true);
    }

    /**
     * Phân loại nhiệt độ sử dụng AI (LLM) hoặc rule-based
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
                return [
                    'temperature' => $temp,
                    'confidence' => 1.0,
                    'source' => 'ATTRIBUTE',
                    'reason' => 'Nhiệt độ được chỉ định trong attributes'
                ];
            }
        }

        // Thử rule-based trước (nhanh hơn)
        $ruleResult = $this->ruleBasedClassifier->classify($name, $categoryName, $attributes);
        
        // Chỉ dùng AI nếu rule-based không chắc chắn (confidence < 0.8) để tránh timeout
        if ($this->useAI && !empty($name) && $ruleResult['confidence'] < 0.8 && $ruleResult['source'] !== 'ATTRIBUTE') {
            $aiResult = $this->classifyWithAI($name, $categoryName, $attributes);
            if ($aiResult && $aiResult['confidence'] > $ruleResult['confidence']) {
                Log::info('AI classification result (used)', [
                    'product' => $name,
                    'result' => $aiResult
                ]);
                return $aiResult;
            }
        }
        
        return $ruleResult;
    }

    /**
     * Phân loại sử dụng Google Gemini API
     */
    private function classifyWithAI(?string $name, ?string $categoryName = null, $attributes = null): ?array
    {
        try {
            // Tạo cache key
            $cacheKey = 'ai_temp_classify_' . md5($name . '|' . $categoryName);
            
            // Kiểm tra cache (cache 24h)
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }

            // Tạo prompt cho AI
            $prompt = $this->buildPrompt($name, $categoryName, $attributes);

            // Gọi Google Gemini API - chỉ thử model đầu tiên để tránh timeout
            $modelName = 'gemini-2.0-flash-exp';
            $apiVersion = 'v1beta';
            $url = "https://generativelanguage.googleapis.com/{$apiVersion}/models/{$modelName}:generateContent?key={$this->geminiApiKey}";
            
            Log::info('Calling Gemini API', [
                'url' => str_replace($this->geminiApiKey, '***', $url),
                'product' => $name
            ]);
            
            $response = Http::timeout(5) // Giảm timeout xuống 5 giây
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($url, [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'text' => $prompt
                                ]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => 150,
                    ]
                ]);

            if ($response->successful()) {
                Log::info('Gemini API success', [
                    'product' => $name,
                    'model' => $modelName
                ]);
                
                $data = $response->json();
                $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if (!$content) {
                    Log::warning('Gemini API returned empty content', [
                        'response' => $data
                    ]);
                    return null;
                }

                Log::info('Gemini API response content', [
                    'content' => substr($content, 0, 200)
                ]);

                $result = $this->parseAIResponse($content);
                
                if ($result) {
                    // Cache kết quả
                    Cache::put($cacheKey, $result, now()->addHours(24));
                    return $result;
                }
            } else {
                Log::warning('Gemini API error', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 200),
                    'model' => $modelName
                ]);
            }
            
            return null;

        } catch (\Exception $e) {
            Log::error('AI classification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Tạo prompt cho AI
     */
    private function buildPrompt(?string $name, ?string $categoryName = null, $attributes = null): string
    {
        $text = "Phân tích sản phẩm sau và xác định nhiệt độ phù hợp:\n\n";
        $text .= "Tên sản phẩm: {$name}\n";
        
        if ($categoryName) {
            $text .= "Danh mục: {$categoryName}\n";
        }

        if ($attributes && is_array($attributes)) {
            $text .= "Thuộc tính: " . json_encode($attributes, JSON_UNESCAPED_UNICODE) . "\n";
        }

        $text .= "\nHãy phân tích và trả về JSON với format:\n";
        $text .= '{"temperature": "HOT" hoặc "COLD" hoặc "UNKNOWN", "confidence": 0.0-1.0, "reason": "lý do bằng tiếng Việt"}\n\n';
        $text .= "Lưu ý:\n";
        $text .= "- HOT: Đồ uống/món ăn nóng (cà phê nóng, trà nóng, súp, lẩu, phở...)\n";
        $text .= "- COLD: Đồ uống/món ăn lạnh (cà phê đá, trà đá, sinh tố, nước ép, kem...)\n";
        $text .= "- UNKNOWN: Không xác định được\n";
        $text .= "- Confidence: Độ tin cậy (0.0-1.0)\n";
        $text .= "- Reason: Giải thích ngắn gọn bằng tiếng Việt\n\n";
        $text .= "Chỉ trả về JSON, không có text khác.";

        return $text;
    }

    /**
     * Parse response từ AI
     */
    private function parseAIResponse(string $content): ?array
    {
        // Loại bỏ markdown code blocks nếu có
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*/', '', $content);
        $content = trim($content);

        // Parse JSON
        $data = json_decode($content, true);

        if (!$data || !isset($data['temperature'])) {
            return null;
        }

        $temperature = strtoupper($data['temperature']);
        if (!in_array($temperature, ['HOT', 'COLD', 'UNKNOWN'])) {
            return null;
        }

        return [
            'temperature' => $temperature,
            'confidence' => min(1.0, max(0.0, (float)($data['confidence'] ?? 0.8))),
            'source' => 'AI',
            'reason' => $data['reason'] ?? 'Phân tích bằng AI'
        ];
    }

    /**
     * Phân loại hàng loạt sản phẩm (batch processing)
     * Sử dụng AI cho các sản phẩm không có keyword rõ ràng
     */
    public function classifyBatch(array $products): array
    {
        $results = [];

        foreach ($products as $product) {
            $name = $product['name'] ?? null;
            $categoryName = $product['categoryName'] ?? $product['category']['name'] ?? null;
            $attributes = $product['attributes'] ?? null;

            // Thử rule-based trước (nhanh hơn)
            $ruleResult = $this->ruleBasedClassifier->classify($name, $categoryName, $attributes);

            // Nếu rule-based không chắc chắn (confidence < 0.8) và có AI, thử AI
            if ($ruleResult['confidence'] < 0.8 && $this->useAI && !empty($name)) {
                $aiResult = $this->classifyWithAI($name, $categoryName, $attributes);
                if ($aiResult && $aiResult['confidence'] > $ruleResult['confidence']) {
                    $results[] = array_merge($product, $aiResult);
                    continue;
                }
            }

            $results[] = array_merge($product, $ruleResult);
        }

        return $results;
    }
}
