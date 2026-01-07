<?php

namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="ElectroShop API",
 *     version="2.0.0",
 *     description="API cho hệ thống bán hàng điện tử ElectroShop"
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="apiKey",
 *     in="header",
 *     name="Authorization",
 *     description="Bearer {token}"
 * )
 */
class OpenApiSpec
{
    // Swagger annotations
}
