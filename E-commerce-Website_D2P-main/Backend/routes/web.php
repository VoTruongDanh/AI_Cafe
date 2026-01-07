<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-email', function () {
    try {
        Mail::raw('This is a test email from ElectroShop', function ($message) {
            $message->to('phamduy14032004@gmail.com')
                    ->subject('Test Email - ElectroShop');
        });
        
        return response()->json([
            'success' => true,
            'message' => 'Email sent successfully! Check your inbox.'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});
