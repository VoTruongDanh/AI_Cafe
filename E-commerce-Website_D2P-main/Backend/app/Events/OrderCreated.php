<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load('items.product', 'user', 'promotion', 'paymentMethod');
    }

    public function broadcastOn()
    {
        return [
            new Channel('admin.orders'), // Admin channel
            new Channel('user.' . $this->order->user_id), // User private channel
        ];
    }

    public function broadcastAs()
    {
        return 'order.created';
    }

    public function broadcastWith()
    {
        return [
            'order' => $this->order,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
