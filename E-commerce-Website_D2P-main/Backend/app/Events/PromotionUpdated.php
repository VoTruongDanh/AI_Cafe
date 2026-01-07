<?php

namespace App\Events;

use App\Models\Promotion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PromotionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $promotion;

    public function __construct(Promotion $promotion)
    {
        $this->promotion = $promotion->load('products');
    }

    public function broadcastOn()
    {
        return new Channel('promotions');
    }

    public function broadcastAs()
    {
        return 'promotion.updated';
    }

    public function broadcastWith()
    {
        return [
            'promotion' => $this->promotion,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
