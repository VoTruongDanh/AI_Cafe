<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        // Không load password
        $this->user = $user->makeHidden(['password']);
    }

    public function broadcastOn()
    {
        return new Channel('admin.users');
    }

    public function broadcastAs()
    {
        return 'user.created';
    }

    public function broadcastWith()
    {
        return [
            'user' => $this->user,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
