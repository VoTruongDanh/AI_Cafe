<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CloudinaryService - Service để upload/delete ảnh từ Cloudinary
 *
 * HƯỚNG DẪN:
 * 1. Đăng ký tài khoản miễn phí tại: https://cloudinary.com/users/register_free
 * 2. Lấy Cloud Name, API Key, API Secret từ Dashboard
 * 3. Điền vào file .env hoặc config/cloudinary.php
 */
class CloudinaryService
{
    private string $cloudName;
    private string $apiKey;
    private string $apiSecret;
    private string $uploadUrl;
    private string $deleteUrl;
    private bool $isConfigured = false;

    public function __construct()
    {
        $this->cloudName = config('cloudinary.cloud_name', '');
        $this->apiKey = config('cloudinary.api_key', '');
        $this->apiSecret = config('cloudinary.api_secret', '');

        $this->uploadUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";
        $this->deleteUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";

        $this->isConfigured = !empty($this->cloudName)
            && !empty($this->apiKey)
            && !empty($this->apiSecret)
            && $this->cloudName !== 'YOUR_CLOUD_NAME';
    }

    /**
     * Kiểm tra đã cấu hình Cloudinary chưa
     */
    public function isConfigured(): bool
    {
        return $this->isConfigured;
    }

    /**
     * Upload ảnh lên Cloudinary
     *
     * @param UploadedFile $file File ảnh từ request
     * @param string $folder Thư mục lưu trên Cloudinary
     * @param string|null $publicId Tên file (không cần extension)
     * @return array|null ['url' => string, 'public_id' => string] hoặc null nếu lỗi
     */
    public function uploadImage(UploadedFile $file, string $folder = 'products', string $publicId = null): ?array
    {
        if (!$this->isConfigured) {
            Log::warning('Cloudinary chưa được cấu hình! Vui lòng kiểm tra config/cloudinary.php');
            return null;
        }

        try {
            // Tạo public_id nếu không có
            if (empty($publicId)) {
                $publicId = 'product_' . time() . '_' . uniqid();
            }

            // Lấy folder từ config
            $folderPath = config("cloudinary.folders.{$folder}", "ecommerce/{$folder}");

            // Tạo timestamp và signature
            $timestamp = time();
            $params = [
                'folder' => $folderPath,
                'public_id' => $publicId,
                'timestamp' => $timestamp,
                'overwrite' => 'true',
                'transformation' => 'q_auto,f_auto', // Tự động tối ưu
            ];

            // Sắp xếp params và tạo signature
            ksort($params);
            $signatureString = '';
            foreach ($params as $key => $value) {
                $signatureString .= "{$key}={$value}&";
            }
            $signatureString = rtrim($signatureString, '&') . $this->apiSecret;
            $signature = sha1($signatureString);

            // Gửi request upload
            $response = Http::timeout(60)
                ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post($this->uploadUrl, [
                    'api_key' => $this->apiKey,
                    'timestamp' => $timestamp,
                    'signature' => $signature,
                    'folder' => $folderPath,
                    'public_id' => $publicId,
                    'overwrite' => 'true',
                    'transformation' => 'q_auto,f_auto',
                ]);

            if ($response->successful()) {
                $result = $response->json();

                Log::info('Cloudinary upload success', [
                    'url' => $result['secure_url'] ?? $result['url'],
                    'public_id' => $result['public_id'],
                ]);

                return [
                    'url' => $result['secure_url'] ?? $result['url'],
                    'public_id' => $result['public_id'],
                    'width' => $result['width'] ?? null,
                    'height' => $result['height'] ?? null,
                    'format' => $result['format'] ?? null,
                    'bytes' => $result['bytes'] ?? null,
                ];
            }

            Log::error('Cloudinary upload failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;

        } catch (\Exception $e) {
            Log::error('Cloudinary upload exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Upload ảnh từ đường dẫn file local
     *
     * @param string $filePath Đường dẫn file local
     * @param string $folder Thư mục lưu trên Cloudinary
     * @param string|null $publicId Tên file
     * @return array|null
     */
    public function uploadImageFromPath(string $filePath, string $folder = 'products', string $publicId = null): ?array
    {
        if (!$this->isConfigured) {
            Log::warning('Cloudinary chưa được cấu hình!');
            return null;
        }

        if (!file_exists($filePath)) {
            Log::error("File không tồn tại: {$filePath}");
            return null;
        }

        try {
            if (empty($publicId)) {
                $publicId = 'product_' . time() . '_' . uniqid();
            }

            $folderPath = config("cloudinary.folders.{$folder}", "ecommerce/{$folder}");
            $timestamp = time();

            $params = [
                'folder' => $folderPath,
                'public_id' => $publicId,
                'timestamp' => $timestamp,
                'overwrite' => 'true',
            ];

            ksort($params);
            $signatureString = '';
            foreach ($params as $key => $value) {
                $signatureString .= "{$key}={$value}&";
            }
            $signatureString = rtrim($signatureString, '&') . $this->apiSecret;
            $signature = sha1($signatureString);

            $fileName = basename($filePath);

            $response = Http::timeout(60)
                ->attach('file', file_get_contents($filePath), $fileName)
                ->post($this->uploadUrl, [
                    'api_key' => $this->apiKey,
                    'timestamp' => $timestamp,
                    'signature' => $signature,
                    'folder' => $folderPath,
                    'public_id' => $publicId,
                    'overwrite' => 'true',
                ]);

            if ($response->successful()) {
                $result = $response->json();
                return [
                    'url' => $result['secure_url'] ?? $result['url'],
                    'public_id' => $result['public_id'],
                ];
            }

            Log::error('Cloudinary upload from path failed', ['body' => $response->body()]);
            return null;

        } catch (\Exception $e) {
            Log::error('Cloudinary upload exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Xóa ảnh trên Cloudinary
     *
     * @param string $publicIdOrUrl Public ID hoặc URL của ảnh
     * @return bool
     */
    public function deleteImage(string $publicIdOrUrl): bool
    {
        if (!$this->isConfigured || empty($publicIdOrUrl)) {
            return false;
        }

        try {
            // Nếu là URL, extract public_id
            $publicId = $this->extractPublicId($publicIdOrUrl);
            if (empty($publicId)) {
                Log::warning("Không thể extract public_id từ: {$publicIdOrUrl}");
                return false;
            }

            $timestamp = time();
            $params = [
                'public_id' => $publicId,
                'timestamp' => $timestamp,
            ];

            ksort($params);
            $signatureString = '';
            foreach ($params as $key => $value) {
                $signatureString .= "{$key}={$value}&";
            }
            $signatureString = rtrim($signatureString, '&') . $this->apiSecret;
            $signature = sha1($signatureString);

            $response = Http::post($this->deleteUrl, [
                'api_key' => $this->apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'public_id' => $publicId,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $success = ($result['result'] ?? '') === 'ok';

                Log::info($success ? 'Cloudinary delete success' : 'Cloudinary delete failed', [
                    'public_id' => $publicId,
                    'result' => $result,
                ]);

                return $success;
            }

            Log::error('Cloudinary delete request failed', ['body' => $response->body()]);
            return false;

        } catch (\Exception $e) {
            Log::error('Cloudinary delete exception', ['message' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Extract public_id từ Cloudinary URL
     * URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
     *
     * @param string $url
     * @return string|null
     */
    public function extractPublicId(string $url): ?string
    {
        // Nếu không phải URL cloudinary, giả định đã là public_id
        if (!str_contains($url, 'cloudinary.com')) {
            return $url;
        }

        try {
            // Tìm phần sau /upload/
            $uploadIndex = strpos($url, '/upload/');
            if ($uploadIndex === false) {
                return null;
            }

            $afterUpload = substr($url, $uploadIndex + 8); // Skip "/upload/"

            // Bỏ version (v1234567890/)
            if (str_starts_with($afterUpload, 'v')) {
                $slashIndex = strpos($afterUpload, '/');
                if ($slashIndex !== false) {
                    $afterUpload = substr($afterUpload, $slashIndex + 1);
                }
            }

            // Bỏ transformation params (nếu có)
            // Format: w_300,h_300,c_fill/folder/file.jpg
            if (preg_match('/^[a-z]_\d+/', $afterUpload)) {
                $slashIndex = strpos($afterUpload, '/');
                if ($slashIndex !== false) {
                    $afterUpload = substr($afterUpload, $slashIndex + 1);
                }
            }

            // Bỏ extension
            $dotIndex = strrpos($afterUpload, '.');
            if ($dotIndex !== false) {
                $afterUpload = substr($afterUpload, 0, $dotIndex);
            }

            return $afterUpload;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Lấy URL ảnh với transformation (resize, crop, etc.)
     *
     * @param string $imageUrl URL gốc
     * @param int $width Chiều rộng
     * @param int $height Chiều cao
     * @param string $crop Kiểu crop (fill, fit, limit, etc.)
     * @return string URL đã transform
     */
    public function getTransformedUrl(string $imageUrl, int $width, int $height, string $crop = 'fill'): string
    {
        if (empty($imageUrl) || !str_contains($imageUrl, 'cloudinary')) {
            return $imageUrl;
        }

        // Thêm transformation vào URL
        // Format: /upload/w_{width},h_{height},c_{crop}/
        $transformation = "w_{$width},h_{$height},c_{$crop},q_auto,f_auto";
        return str_replace('/upload/', "/upload/{$transformation}/", $imageUrl);
    }

    /**
     * Lấy URL thumbnail
     */
    public function getThumbnailUrl(string $imageUrl, int $size = 300): string
    {
        return $this->getTransformedUrl($imageUrl, $size, $size, 'fill');
    }

    /**
     * Upload nhiều ảnh cùng lúc
     *
     * @param array $files Array of UploadedFile
     * @param string $folder
     * @return array Array of upload results
     */
    public function uploadMultipleImages(array $files, string $folder = 'products'): array
    {
        $results = [];

        foreach ($files as $index => $file) {
            if ($file instanceof UploadedFile) {
                $publicId = 'product_' . time() . '_' . $index . '_' . uniqid();
                $result = $this->uploadImage($file, $folder, $publicId);

                if ($result) {
                    $results[] = $result;
                }
            }
        }

        return $results;
    }

    /**
     * Kiểm tra URL có phải từ Cloudinary không
     */
    public function isCloudinaryUrl(string $url): bool
    {
        return str_contains($url, 'cloudinary.com') || str_contains($url, 'res.cloudinary');
    }
}
