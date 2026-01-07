import { useEffect } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Orders (Admin)
 * @param {Function} onOrderCreated - Callback khi có đơn hàng mới
 * @param {Function} onOrderStatusUpdated - Callback khi trạng thái đơn hàng thay đổi
 */
export const useOrdersWebSocket = ({
    onOrderCreated,
    onOrderStatusUpdated,
}) => {
    useEffect(() => {
        const channel = echo.channel('admin.orders');

        if (onOrderCreated) {
            channel.listen('.order.created', (data) => {
                console.log('Order created:', data);
                onOrderCreated(data.order);
            });
        }

        if (onOrderStatusUpdated) {
            channel.listen('.order.status.updated', (data) => {
                console.log('Order status updated:', data);
                onOrderStatusUpdated(data.order);
            });
        }

        return () => {
            channel.stopListening('.order.created');
            channel.stopListening('.order.status.updated');
            echo.leaveChannel('admin.orders');
        };
    }, [onOrderCreated, onOrderStatusUpdated]);
};

/**
 * Hook để lắng nghe realtime updates cho Orders của user cụ thể
 * @param {number} userId - ID của user
 * @param {Function} onOrderStatusUpdated - Callback khi trạng thái đơn hàng thay đổi
 */
export const useUserOrdersWebSocket = (userId, onOrderStatusUpdated) => {
    useEffect(() => {
        if (!userId) return;

        const channel = echo.private(`user.${userId}`);

        if (onOrderStatusUpdated) {
            channel.listen('.order.status.updated', (data) => {
                console.log('User order status updated:', data);
                onOrderStatusUpdated(data.order);
            });
        }

        return () => {
            channel.stopListening('.order.status.updated');
            echo.leave(`user.${userId}`);
        };
    }, [userId, onOrderStatusUpdated]);
};
