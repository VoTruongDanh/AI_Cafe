<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherController extends Controller
{
    /**
     * Lấy nhiệt độ theo vị trí (latitude, longitude) hoặc IP
     * GET /api/weather/temperature?lat=10.8231&lon=106.6297
     * GET /api/weather/temperature (sử dụng IP geolocation)
     */
    public function getTemperature(Request $request)
    {
        try {
            $lat = $request->query('lat');
            $lon = $request->query('lon');

            // Nếu không có lat/lon, sử dụng vị trí mặc định TP.HCM
            // (IP geolocation không chính xác khi chạy localhost)
            if (!$lat || !$lon) {
                $ip = $request->ip();
                
                // Kiểm tra xem có IP thật từ header không
                $realIp = $request->header('X-Forwarded-For') 
                    ? trim(explode(',', $request->header('X-Forwarded-For'))[0])
                    : $request->header('X-Real-IP');
                
                // Nếu là localhost hoặc không có real IP, dùng vị trí mặc định TP.HCM
                if ($ip === '127.0.0.1' || $ip === '::1' || !$realIp) {
                    // Vị trí mặc định: TP.HCM (Trung Mỹ Tây, Q.12)
                    $lat = 10.8626;
                    $lon = 106.6195;
                    $request->merge([
                        '_ip_city' => 'TP. Hồ Chí Minh',
                        '_ip_country' => 'Vietnam',
                        '_is_default_location' => true
                    ]);
                    
                    Log::info('Using default location (localhost)', [
                        'lat' => $lat,
                        'lon' => $lon,
                        'city' => 'TP. Hồ Chí Minh'
                    ]);
                } else {
                    // Có real IP, thử IP geolocation
                    try {
                        $ipGeoResponse = Http::timeout(3)->get("http://ip-api.com/json/{$realIp}", [
                            'fields' => 'status,lat,lon,city,country'
                        ]);
                        
                        if ($ipGeoResponse->successful() && $ipGeoResponse->json('status') === 'success') {
                            $lat = $ipGeoResponse->json('lat');
                            $lon = $ipGeoResponse->json('lon');
                            $ipCity = $ipGeoResponse->json('city');
                            $ipCountry = $ipGeoResponse->json('country');
                            
                            Log::info('IP geolocation success', [
                                'ip' => $realIp,
                                'lat' => $lat,
                                'lon' => $lon,
                                'city' => $ipCity
                            ]);
                            
                            $request->merge(['_ip_city' => $ipCity, '_ip_country' => $ipCountry]);
                        }
                    } catch (\Exception $ipErr) {
                        Log::warning('IP geolocation failed', ['error' => $ipErr->getMessage()]);
                    }
                }
            }

            // Nếu vẫn không có lat/lon, dùng vị trí mặc định
            if (!$lat || !$lon) {
                $lat = 10.8626;  // TP.HCM
                $lon = 106.6195;
                $request->merge([
                    '_ip_city' => 'TP. Hồ Chí Minh',
                    '_ip_country' => 'Vietnam',
                    '_is_default_location' => true
                ]);
            }

            // Lấy city name từ IP hoặc reverse geocoding
            $ipCity = $request->input('_ip_city');
            $ipCountry = $request->input('_ip_country');
            
            // Sử dụng Open-Meteo API (MIỄN PHÍ, KHÔNG CẦN API KEY)
            // https://open-meteo.com/
            $url = "https://api.open-meteo.com/v1/forecast";
            $response = Http::timeout(5)->get($url, [
                'latitude' => $lat,
                'longitude' => $lon,
                'current' => 'temperature_2m,weather_code,wind_speed_10m',
                'timezone' => 'auto',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $temperature = $data['current']['temperature_2m'] ?? null;

                if ($temperature !== null) {
                    // Lấy mô tả thời tiết từ weather code
                    $weatherCode = $data['current']['weather_code'] ?? 0;
                    $description = $this->getWeatherDescription($weatherCode);
                    
                    // Nếu chưa có city từ IP, thử lấy từ reverse geocoding
                    if (!$ipCity) {
                        try {
                            $geoResponse = Http::timeout(3)->get("https://nominatim.openstreetmap.org/reverse", [
                                'lat' => $lat,
                                'lon' => $lon,
                                'format' => 'json',
                                'zoom' => 10,
                            ]);
                            if ($geoResponse->successful()) {
                                $geoData = $geoResponse->json();
                                $ipCity = $geoData['address']['city'] 
                                    ?? $geoData['address']['town'] 
                                    ?? $geoData['address']['village']
                                    ?? $geoData['address']['county']
                                    ?? null;
                                $ipCountry = $geoData['address']['country'] ?? null;
                            }
                        } catch (\Exception $geoErr) {
                            Log::debug('Reverse geocoding failed', ['error' => $geoErr->getMessage()]);
                        }
                    }
                    
                    $isDefaultLocation = $request->input('_is_default_location', false);
                    
                    return response()->json([
                        'success' => true,
                        'temperature' => round($temperature, 1),
                        'city' => $ipCity,
                        'country' => $ipCountry,
                        'description' => $description,
                        'wind_speed' => $data['current']['wind_speed_10m'] ?? null,
                        'source' => $isDefaultLocation ? 'DEFAULT_LOCATION' : 'OPEN_METEO',
                        'is_default_location' => $isDefaultLocation,
                    ]);
                }
            }

            // Fallback nếu API lỗi
            Log::warning('Open-Meteo API error', [
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
    
    /**
     * Chuyển đổi weather code (WMO) sang mô tả tiếng Việt
     * https://open-meteo.com/en/docs
     */
    private function getWeatherDescription(int $code): string
    {
        $descriptions = [
            0 => 'Trời quang',
            1 => 'Ít mây',
            2 => 'Có mây',
            3 => 'Nhiều mây',
            45 => 'Sương mù',
            48 => 'Sương mù băng giá',
            51 => 'Mưa phùn nhẹ',
            53 => 'Mưa phùn',
            55 => 'Mưa phùn dày',
            56 => 'Mưa phùn lạnh nhẹ',
            57 => 'Mưa phùn lạnh dày',
            61 => 'Mưa nhỏ',
            63 => 'Mưa vừa',
            65 => 'Mưa to',
            66 => 'Mưa lạnh nhẹ',
            67 => 'Mưa lạnh to',
            71 => 'Tuyết nhẹ',
            73 => 'Tuyết vừa',
            75 => 'Tuyết dày',
            77 => 'Hạt tuyết',
            80 => 'Mưa rào nhẹ',
            81 => 'Mưa rào vừa',
            82 => 'Mưa rào to',
            85 => 'Tuyết rào nhẹ',
            86 => 'Tuyết rào to',
            95 => 'Giông bão',
            96 => 'Giông bão kèm mưa đá nhẹ',
            99 => 'Giông bão kèm mưa đá to',
        ];
        
        return $descriptions[$code] ?? 'Không xác định';
    }
}
