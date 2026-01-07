<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // For API requests, return null to trigger JSON unauthenticated response
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }
        
        // For web requests, you can add a login route if needed
        return null;
    }
}
