<?php

namespace App\Services;

class TemperatureClassifier
{
    // Keywords cho đồ uống/món ăn lạnh (không dấu để match tốt)
    private array $coldKeywords = [
        'da', 'iced', 'ice', 'lanh', 'frozen', 'smoothie', 'sinh to', 
        'kem', 'tra sua', 'nuoc ep', 'juice', 'cold', 'freeze',
        'ca phe da', 'tra da', 'nuoc ngot', 'soft drink', 'soda'
    ];

    // Keywords cho đồ uống/món ăn nóng
    private array $hotKeywords = [
        'nong', 'hot', 'am', 'warm', 'steaming', 'boiling',
        'ca phe nong', 'tra nong', 'soup', 'lau', 'sup',
        'pho', 'bun', 'mi', 'noodle soup'
    ];

    /**
     * Phân loại nhiệt độ của sản phẩm dựa trên tên và danh mục
     *
     * @param string|null $name Tên sản phẩm
     * @param string|null $categoryName Tên danh mục
     * @param array|string|null $attributes Thuộc tính sản phẩm (có thể chứa temperature)
     * @return array Kết quả phân loại với temperature, confidence, source, reason
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

        // Chuẩn hóa text để so sánh
        $text = $this->normalize(($name ?? '') . ' | ' . ($categoryName ?? ''));

        // Kiểm tra keywords lạnh
        if ($this->containsAny($text, $this->coldKeywords)) {
            return [
                'temperature' => 'COLD',
                'confidence' => 0.95,
                'source' => 'RULE',
                'reason' => 'Tìm thấy keyword lạnh trong tên/danh mục'
            ];
        }

        // Kiểm tra keywords nóng
        if ($this->containsAny($text, $this->hotKeywords)) {
            return [
                'temperature' => 'HOT',
                'confidence' => 0.90,
                'source' => 'RULE',
                'reason' => 'Tìm thấy keyword nóng trong tên/danh mục'
            ];
        }

        // Suy luận từ danh mục
        $categoryLower = mb_strtolower($categoryName ?? '', 'UTF-8');
        if (str_contains($categoryLower, 'ca phe') || str_contains($categoryLower, 'coffee')) {
            // Mặc định cà phê là nóng, trừ khi có "đá"
            if (str_contains($text, 'da') || str_contains($text, 'ice')) {
                return [
                    'temperature' => 'COLD',
                    'confidence' => 0.85,
                    'source' => 'RULE',
                    'reason' => 'Cà phê có đá'
                ];
            }
            return [
                'temperature' => 'HOT',
                'confidence' => 0.75,
                'source' => 'RULE',
                'reason' => 'Cà phê mặc định là nóng'
            ];
        }

        // Suy luận từ món ăn nóng
        if (str_contains($text, 'lau') || str_contains($text, 'sup') || 
            str_contains($text, 'pho') || str_contains($text, 'bun')) {
            return [
                'temperature' => 'HOT',
                'confidence' => 0.70,
                'source' => 'RULE',
                'reason' => 'Món ăn nóng (lẩu, súp, phở, bún)'
            ];
        }

        // Mặc định: không xác định
        return [
            'temperature' => 'UNKNOWN',
            'confidence' => 0.50,
            'source' => 'UNKNOWN',
            'reason' => 'Không đủ dấu hiệu để phân loại nhiệt độ'
        ];
    }

    /**
     * Lọc sản phẩm theo nhiệt độ mong muốn
     *
     * @param array $products Danh sách sản phẩm đã phân loại
     * @param string $desiredTemperature Nhiệt độ mong muốn (HOT, COLD, ROOM, UNKNOWN)
     * @param float $minConfidence Độ tin cậy tối thiểu (0.0 - 1.0)
     * @return array Sản phẩm phù hợp
     */
    public function filterByTemperature(array $products, string $desiredTemperature, float $minConfidence = 0.6): array
    {
        return array_filter($products, function ($product) use ($desiredTemperature, $minConfidence) {
            $temp = $product['temperature'] ?? 'UNKNOWN';
            $confidence = $product['confidence'] ?? 0;
            
            return $temp === $desiredTemperature && $confidence >= $minConfidence;
        });
    }

    /**
     * Kiểm tra text có chứa bất kỳ keyword nào không
     */
    private function containsAny(string $text, array $keywords): bool
    {
        foreach ($keywords as $kw) {
            $kw = trim($kw);
            if ($kw === '') continue;

            // Phrase có khoảng trắng => tìm exact match
            if (str_contains($kw, ' ')) {
                if (str_contains($text, $kw)) return true;
                continue;
            }

            // Match theo word boundary để giảm false positive
            if (preg_match('/(^|\W)' . preg_quote($kw, '/') . '(\W|$)/ui', $text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Chuẩn hóa text: bỏ dấu, lowercase, normalize spaces
     */
    private function normalize(string $s): string
    {
        $s = mb_strtolower($s, 'UTF-8');

        // Bỏ dấu tiếng Việt
        $s = $this->removeVietnameseAccents($s);

        // Gộp khoảng trắng
        $s = preg_replace('/\s+/u', ' ', $s);
        return trim($s ?? '');
    }

    /**
     * Bỏ dấu tiếng Việt
     */
    private function removeVietnameseAccents(string $s): string
    {
        // Map các ký tự có dấu sang không dấu
        $accents = [
            'à' => 'a', 'á' => 'a', 'ạ' => 'a', 'ả' => 'a', 'ã' => 'a',
            'â' => 'a', 'ầ' => 'a', 'ấ' => 'a', 'ậ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a',
            'ă' => 'a', 'ằ' => 'a', 'ắ' => 'a', 'ặ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a',
            'è' => 'e', 'é' => 'e', 'ẹ' => 'e', 'ẻ' => 'e', 'ẽ' => 'e',
            'ê' => 'e', 'ề' => 'e', 'ế' => 'e', 'ệ' => 'e', 'ể' => 'e', 'ễ' => 'e',
            'ì' => 'i', 'í' => 'i', 'ị' => 'i', 'ỉ' => 'i', 'ĩ' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ọ' => 'o', 'ỏ' => 'o', 'õ' => 'o',
            'ô' => 'o', 'ồ' => 'o', 'ố' => 'o', 'ộ' => 'o', 'ổ' => 'o', 'ỗ' => 'o',
            'ơ' => 'o', 'ờ' => 'o', 'ớ' => 'o', 'ợ' => 'o', 'ở' => 'o', 'ỡ' => 'o',
            'ù' => 'u', 'ú' => 'u', 'ụ' => 'u', 'ủ' => 'u', 'ũ' => 'u',
            'ư' => 'u', 'ừ' => 'u', 'ứ' => 'u', 'ự' => 'u', 'ử' => 'u', 'ữ' => 'u',
            'ỳ' => 'y', 'ý' => 'y', 'ỵ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y',
            'đ' => 'd', 'Đ' => 'd',
        ];

        return strtr($s, $accents);
    }
}
