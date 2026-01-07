<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $product;

    public function __construct(Product $product)
    {
        $this->product = $product->load('category', 'images', 'promotions');
    }

    public function broadcastOn()
    {
        return new Channel('products');
    }

    public function broadcastAs()
    {
        return 'product.updated';
    }

    public function broadcastWith()
    {
        return [
            'product' => $this->product,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
