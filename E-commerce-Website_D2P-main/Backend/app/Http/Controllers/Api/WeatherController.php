<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherController extends Controller
{
    /**
     * Lấy nhiệt độ theo vị trí (latitude, longitude)
     * GET /api/weather/temperature?lat=10.8231&lon=106.6297
     */
    public function getTemperature(Request $request)
    {
        try {
            $lat = $request->query('lat');
            $lon = $request->query('lon');

            if (!$lat || !$lon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu thông tin vị trí (lat, lon)'
                ], 400);
            }

            // Sử dụng OpenWeatherMap API (miễn phí)
            $apiKey = config('services.openweather.api_key', env('OPENWEATHER_API_KEY'));
            
            if (!$apiKey) {
                // Fallback: Trả về nhiệt độ mặc định dựa trên vị trí Việt Nam
                // Hoặc có thể dùng API khác miễn phí
                return response()->json([
                    'success' => true,
                    'temperature' => 32, // Nhiệt độ mặc định cho Việt Nam
                    'source' => 'DEFAULT',
                    'message' => 'Sử dụng nhiệt độ mặc định (chưa cấu hình API key)'
                ]);
            }

            // Gọi OpenWeatherMap API
            $url = "https://api.openweathermap.org/data/2.5/weather";
            $response = Http::timeout(5)->get($url, [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $apiKey,
                'units' => 'metric', // Nhiệt độ theo Celsius
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $temperature = $data['main']['temp'] ?? null;

                if ($temperature !== null) {
                    return response()->json([
                        'success' => true,
                        'temperature' => round($temperature, 1),
                        'city' => $data['name'] ?? null,
                        'country' => $data['sys']['country'] ?? null,
                        'description' => $data['weather'][0]['description'] ?? null,
                        'source' => 'OPENWEATHER',
                    ]);
                }
            }

            // Fallback nếu API lỗi
            Log::warning('OpenWeatherMap API error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json([
                'success' => true,
                'temperature' => 32,
                'source' => 'FALLBACK',
                'message' => 'Không thể lấy nhiệt độ từ API, sử dụng giá trị mặc định'
            ]);

        } catch (\Exception $e) {
            Log::error('Weather API error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => true,
                'temperature' => 32,
                'source' => 'ERROR_FALLBACK',
                'message' => 'Lỗi khi lấy nhiệt độ, sử dụng giá trị mặc định'
            ]);
        }
    }
}
