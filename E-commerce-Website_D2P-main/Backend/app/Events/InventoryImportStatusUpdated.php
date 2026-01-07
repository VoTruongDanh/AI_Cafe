<?php

namespace App\Events;

use App\Models\InventoryImport;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryImportStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $inventoryImport;
    public $oldStatus;
    public $newStatus;

    public function __construct(InventoryImport $inventoryImport, $oldStatus, $newStatus)
    {
        $this->inventoryImport = $inventoryImport->load('items.product', 'supplier');
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    public function broadcastOn()
    {
        return [
            new Channel('admin.inventory'),
            new Channel('products'), // Để cập nhật stock realtime
        ];
    }

    public function broadcastAs()
    {
        return 'inventory.status.updated';
    }

    public function broadcastWith()
    {
        return [
            'inventory_import' => $this->inventoryImport->toArray(),
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
