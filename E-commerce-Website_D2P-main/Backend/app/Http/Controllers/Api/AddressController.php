<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AddressController extends \App\Http\Controllers\Controller
{
    /**
     * Lấy danh sách tỉnh/thành phố từ AddressKit API
     */
    public function getProvinces()
    {
        $response = Http::get('https://production.cas.so/address-kit/latest/provinces');

        if ($response->successful()) {
            $data = $response->json();
            // AddressKit trả về { provinces: [...] }, lấy mảng provinces
            $provinces = $data['provinces'] ?? [];
            return response()->json($provinces);
        }

        return response()->json([]);
    }

    /**
     * Lấy danh sách xã/phường theo tỉnh từ AddressKit API
     */
    public function getCommunes($provinceId)
    {
        $response = Http::get("https://production.cas.so/address-kit/latest/provinces/{$provinceId}/communes");

        if ($response->successful()) {
            $data = $response->json();
            // AddressKit trả về { communes: [...] }, lấy mảng communes
            $communes = $data['communes'] ?? [];
            return response()->json($communes);
        }

        return response()->json([]);
    }
}
