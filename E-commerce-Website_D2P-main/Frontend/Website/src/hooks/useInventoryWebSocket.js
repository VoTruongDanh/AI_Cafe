import { useEffect, useRef } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Inventory (Admin)
 * @param {Function} onInventoryImportCreated - Callback khi có phiếu nhập mới
 * @param {Function} onInventoryImportStatusUpdated - Callback khi trạng thái phiếu nhập thay đổi
 */
export const useInventoryWebSocket = ({
    onInventoryImportCreated,
    onInventoryImportStatusUpdated,
}) => {
    // Sử dụng ref để lưu callbacks mới nhất mà không trigger re-subscribe
    const callbacksRef = useRef({
        onInventoryImportCreated,
        onInventoryImportStatusUpdated,
    });

    // Cập nhật callbacks ref mỗi khi có thay đổi
    useEffect(() => {
        callbacksRef.current = {
            onInventoryImportCreated,
            onInventoryImportStatusUpdated,
        };
    }, [onInventoryImportCreated, onInventoryImportStatusUpdated]);

    useEffect(() => {
        console.log('🔌 Subscribing to admin.inventory channel...');
        const channel = echo.channel('admin.inventory');

        // Inventory created
        channel.listen('.inventory.created', (data) => {
            console.log('✅ Inventory import created:', data);
            if (callbacksRef.current.onInventoryImportCreated) {
                callbacksRef.current.onInventoryImportCreated(data.inventory_import);
            }
        });

        // Inventory status updated
        channel.listen('.inventory.status.updated', (data) => {
            console.log('✅ Inventory import status updated:', data);
            if (callbacksRef.current.onInventoryImportStatusUpdated) {
                callbacksRef.current.onInventoryImportStatusUpdated(data.inventory_import);
            }
        });

        return () => {
            console.log('🔌 Unsubscribing from admin.inventory channel...');
            channel.stopListening('.inventory.created');
            channel.stopListening('.inventory.status.updated');
            echo.leaveChannel('admin.inventory');
        };
    }, []); // ✅ Chỉ subscribe một lần khi mount
};
