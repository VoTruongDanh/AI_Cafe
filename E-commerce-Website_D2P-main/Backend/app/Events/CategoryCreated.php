<?php

namespace App\Events;

use App\Models\Category;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CategoryCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $category;

    public function __construct(Category $category)
    {
        $this->category = $category->load('parent', 'children');
    }

    public function broadcastOn()
    {
        return new Channel('categories');
    }

    public function broadcastAs()
    {
        return 'category.created';
    }

    public function broadcastWith()
    {
        return [
            'category' => $this->category,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
