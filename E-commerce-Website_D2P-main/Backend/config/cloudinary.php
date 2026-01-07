<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    |
    | Cấu hình Cloudinary để upload ảnh lên cloud.
    | Đăng ký tài khoản miễn phí tại: https://cloudinary.com/users/register_free
    | Lấy thông tin từ Dashboard và điền vào file .env
    |
    */

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME', 'dpygsrfgu'),
    'api_key' => env('CLOUDINARY_API_KEY', '975846963871467'),
    'api_secret' => env('CLOUDINARY_API_SECRET', 'PXZWVYKKGVSi9drIpwNFSEYPav4'),
    'secure' => true,

    /*
    |--------------------------------------------------------------------------
    | Upload Folders
    |--------------------------------------------------------------------------
    |
    | Các thư mục lưu ảnh trên Cloudinary
    |
    */

    'folders' => [
        'products' => 'ecommerce/products',
        'categories' => 'ecommerce/categories',
        'users' => 'ecommerce/users',
        'banners' => 'ecommerce/banners',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Transformations
    |--------------------------------------------------------------------------
    |
    | Các transformation mặc định khi upload ảnh
    |
    */

    'transformations' => [
        'thumbnail' => [
            'width' => 300,
            'height' => 300,
            'crop' => 'fill',
            'quality' => 'auto',
            'fetch_format' => 'auto',
        ],
        'gallery' => [
            'width' => 800,
            'height' => 800,
            'crop' => 'limit',
            'quality' => 'auto',
            'fetch_format' => 'auto',
        ],
        'banner' => [
            'width' => 1920,
            'height' => 600,
            'crop' => 'fill',
            'quality' => 'auto',
            'fetch_format' => 'auto',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Upload URL (for SDK)
    |--------------------------------------------------------------------------
    */

    'cloud_url' => env('CLOUDINARY_URL'),
];
