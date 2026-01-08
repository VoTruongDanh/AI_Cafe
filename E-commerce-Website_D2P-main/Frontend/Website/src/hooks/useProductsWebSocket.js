import { useEffect, useRef } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Products
 * @param {Function} onProductCreated - Callback khi có sản phẩm mới
 * @param {Function} onProductUpdated - Callback khi sản phẩm được cập nhật
 * @param {Function} onProductDeleted - Callback khi sản phẩm bị xóa
 * @param {Function} onInventoryUpdated - Callback khi có phiếu nhập kho hoàn thành (cập nhật số lượng)
 */
export const useProductsWebSocket = ({
    onProductCreated,
    onProductUpdated,
    onProductDeleted,
    onInventoryUpdated,
}) => {
    // Sử dụng ref để lưu callbacks mới nhất mà không trigger re-subscribe
    const callbacksRef = useRef({
        onProductCreated,
        onProductUpdated,
        onProductDeleted,
        onInventoryUpdated,
    });

    // Cập nhật callbacks ref mỗi khi có thay đổi
    useEffect(() => {
        callbacksRef.current = {
            onProductCreated,
            onProductUpdated,
            onProductDeleted,
            onInventoryUpdated,
        };
    }, [onProductCreated, onProductUpdated, onProductDeleted, onInventoryUpdated]);

    useEffect(() => {
        console.log('🔌 Subscribing to products channel...');
        const channel = echo.channel('products');

        console.log('📡 Channel subscribed:', channel);

        // Product created
        channel.listen('.product.created', (data) => {
            console.log('✅ Product created event received:', data);
            if (callbacksRef.current.onProductCreated) {
                callbacksRef.current.onProductCreated(data.product);
            }
        });

        // Product updated
        channel.listen('.product.updated', (data) => {
            console.log('✅ Product updated event received:', data);
            if (callbacksRef.current.onProductUpdated) {
                callbacksRef.current.onProductUpdated(data.product);
            }
        });

        // Product deleted
        channel.listen('.product.deleted', (data) => {
            console.log('✅ Product deleted event received:', data);
            if (callbacksRef.current.onProductDeleted) {
                callbacksRef.current.onProductDeleted(data.productId);
            }
        });

        // Inventory status updated
        channel.listen('.inventory.status.updated', (data) => {
            console.log('📦 Inventory status updated event received:', data);
            // Chỉ xử lý khi chuyển sang trạng thái completed
            if (data.new_status === 'completed') {
                console.log('✅ Inventory completed, updating product quantities...');
                if (callbacksRef.current.onInventoryUpdated) {
                    callbacksRef.current.onInventoryUpdated(data.inventory_import);
                }
            }
        });

        return () => {
            console.log('🔌 Unsubscribing from products channel...');
            channel.stopListening('.product.created');
            channel.stopListening('.product.updated');
            channel.stopListening('.product.deleted');
            channel.stopListening('.inventory.status.updated');
            echo.leaveChannel('products');
        };
    }, []); // ✅ Chỉ subscribe một lần khi mount
};
