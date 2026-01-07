<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration cho API stability và monitoring
    |
    */

    /*
     * Enable API request logging
     */
    'log_api_requests' => env('LOG_API_REQUESTS', true),

    /*
     * Rate limiting configuration
     */
    'rate_limit' => [
        'default' => env('API_RATE_LIMIT_DEFAULT', 60), // requests per minute
        'login' => env('API_RATE_LIMIT_LOGIN', 10),
        'admin' => env('API_RATE_LIMIT_ADMIN', 120),
        'winform' => env('API_RATE_LIMIT_WINFORM', 200),
    ],

    /*
     * Response caching
     */
    'cache' => [
        'enabled' => env('API_CACHE_ENABLED', true),
        'ttl' => env('API_CACHE_TTL', 3600), // seconds
        'tags' => [
            'products' => 'products',
            'categories' => 'categories',
            'promotions' => 'promotions',
        ],
    ],

    /*
     * Pagination
     */
    'pagination' => [
        'per_page' => env('API_PAGINATION_PER_PAGE', 20),
        'max_per_page' => env('API_PAGINATION_MAX_PER_PAGE', 100),
    ],

    /*
     * Source tracking
     */
    'sources' => [
        'web' => 'web',
        'winform' => 'winform',
        'mobile' => 'mobile',
    ],

    /*
     * Security
     */
    'security' => [
        'token_expiry_days' => env('API_TOKEN_EXPIRY_DAYS', 30),
        'max_login_attempts' => env('API_MAX_LOGIN_ATTEMPTS', 5),
        'lockout_time' => env('API_LOCKOUT_TIME', 300), // seconds
    ],

    /*
     * Features flags
     */
    'features' => [
        'sync_enabled' => env('API_SYNC_ENABLED', true),
        'notifications_enabled' => env('API_NOTIFICATIONS_ENABLED', true),
        'webhooks_enabled' => env('API_WEBHOOKS_ENABLED', false),
    ],

    /*
     * Monitoring
     */
    'monitoring' => [
        'slow_query_threshold' => env('API_SLOW_QUERY_THRESHOLD', 1000), // milliseconds
        'alert_email' => env('API_ALERT_EMAIL', null),
    ],
];
