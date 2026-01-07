<?php

namespace App\Events;

use App\Models\InventoryImport;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryImportCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $inventoryImport;

    public function __construct(InventoryImport $inventoryImport)
    {
        $this->inventoryImport = $inventoryImport->load('items.product', 'supplier', 'creator');
    }

    public function broadcastOn()
    {
        return new Channel('admin.inventory');
    }

    public function broadcastAs()
    {
        return 'inventory.created';
    }

    public function broadcastWith()
    {
        return [
            'inventory_import' => $this->inventoryImport,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
