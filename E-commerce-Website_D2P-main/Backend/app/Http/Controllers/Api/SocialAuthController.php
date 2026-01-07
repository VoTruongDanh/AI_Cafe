<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\WelcomeEmail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = User::where('email', $googleUser->getEmail())->first();
            
            $isNewUser = false;
            
            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'password' => bcrypt(str()->random(16)), // Random password
                    'role' => 'customer',
                ]);
                
                $isNewUser = true;
            } else {
                // Update existing user
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            }
            
            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Send welcome email for new users
            if ($isNewUser) {
                Mail::to($user->email)->queue(new WelcomeEmail($user));
            }
            
            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->away("{$frontendUrl}/auth/callback?token={$token}&user=" . urlencode(json_encode($user)));
            
        } catch (\Exception $e) {
            \Log::error('Google OAuth error: ' . $e->getMessage());
            
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->away("{$frontendUrl}/login?error=oauth_failed");
        }
    }

    /**
     * Redirect to Facebook OAuth
     */
    public function redirectToFacebook()
    {
        return Socialite::driver('facebook')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle Facebook OAuth callback
     */
    public function handleFacebookCallback()
    {
        try {
            $facebookUser = Socialite::driver('facebook')->stateless()->user();
            
            $user = User::where('email', $facebookUser->getEmail())->first();
            
            $isNewUser = false;
            
            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $facebookUser->getName(),
                    'email' => $facebookUser->getEmail(),
                    'facebook_id' => $facebookUser->getId(),
                    'avatar' => $facebookUser->getAvatar(),
                    'email_verified_at' => now(),
                    'password' => bcrypt(str()->random(16)),
                    'role' => 'customer',
                ]);
                
                $isNewUser = true;
            } else {
                // Update existing user
                $user->update([
                    'facebook_id' => $facebookUser->getId(),
                    'avatar' => $facebookUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            }
            
            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Send welcome email for new users
            if ($isNewUser) {
                Mail::to($user->email)->queue(new WelcomeEmail($user));
            }
            
            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->away("{$frontendUrl}/auth/callback?token={$token}&user=" . urlencode(json_encode($user)));
            
        } catch (\Exception $e) {
            \Log::error('Facebook OAuth error: ' . $e->getMessage());
            
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->away("{$frontendUrl}/login?error=oauth_failed");
        }
    }

    /**
     * API endpoint for token-based social auth (for mobile apps)
     */
    public function socialLogin(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'provider' => 'required|in:google,facebook',
            'access_token' => 'required|string',
        ]);

        try {
            $provider = $request->provider;
            $socialUser = Socialite::driver($provider)->userFromToken($request->access_token);
            
            $user = User::updateOrCreate(
                ['email' => $socialUser->getEmail()],
                [
                    'name' => $socialUser->getName(),
                    $provider . '_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'email_verified_at' => now(),
                    'password' => bcrypt(str()->random(16)),
                    'role' => 'customer',
                ]
            );
            
            $token = $user->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'user' => $user,
                'token' => $token,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Authentication failed',
                'message' => $e->getMessage(),
            ], 401);
        }
    }
}
