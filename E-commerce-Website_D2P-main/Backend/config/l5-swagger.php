<?php

$baseConfig = require base_path('vendor/darkaonline/l5-swagger/config/l5-swagger.php');

return array_replace_recursive($baseConfig, [
    'documentations' => [
        'default' => [
            'api' => [
                'title' => env('APP_NAME', 'Laravel') . ' API',
                'description' => 'Tài liệu Swagger UI cho hệ thống bán hàng.',
            ],
            'paths' => [
                'docs' => storage_path('api-docs'),
                'docs_json' => 'api-docs.json',
                'docs_yaml' => 'api-docs.yaml',
                'annotations' => base_path('app'),
            ],
            'securityDefinitions' => [
                'sanctum' => [
                    'type' => 'apiKey',
                    'description' => 'Nhập token theo định dạng: Bearer {token}',
                    'name' => 'Authorization',
                    'in' => 'header',
                ],
            ],
            'security' => [
                ['sanctum' => []],
            ],
        ],
    ],
    'defaults' => [
        'paths' => [
            'docs_json' => 'api-docs.json',
            'docs_yaml' => 'api-docs.yaml',
        ],
    ],
    'constants' => [
        'L5_SWAGGER_CONST_HOST' => env('L5_SWAGGER_CONST_HOST', env('APP_URL', 'http://localhost') . '/api'),
    ],
]);
