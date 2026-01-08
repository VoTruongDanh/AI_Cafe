import { useEffect, useRef } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Promotions
 * @param {Function} onPromotionCreated - Callback khi có khuyến mãi mới
 * @param {Function} onPromotionUpdated - Callback khi khuyến mãi được cập nhật
 */
export const usePromotionsWebSocket = ({
    onPromotionCreated,
    onPromotionUpdated,
}) => {
    // Sử dụng ref để lưu callbacks mới nhất mà không trigger re-subscribe
    const callbacksRef = useRef({
        onPromotionCreated,
        onPromotionUpdated,
    });

    // Cập nhật callbacks ref mỗi khi có thay đổi
    useEffect(() => {
        callbacksRef.current = {
            onPromotionCreated,
            onPromotionUpdated,
        };
    }, [onPromotionCreated, onPromotionUpdated]);

    useEffect(() => {
        console.log('🔌 Subscribing to promotions channel...');
        const channel = echo.channel('promotions');

        // Promotion created
        channel.listen('.promotion.created', (data) => {
            console.log('✅ Promotion created:', data);
            if (callbacksRef.current.onPromotionCreated) {
                callbacksRef.current.onPromotionCreated(data.promotion);
            }
        });

        // Promotion updated
        channel.listen('.promotion.updated', (data) => {
            console.log('✅ Promotion updated:', data);
            console.log('🔄 Calling onPromotionUpdated callback...');
            if (callbacksRef.current.onPromotionUpdated) {
                callbacksRef.current.onPromotionUpdated(data.promotion);
                console.log('✅ Callback executed');
            } else {
                console.warn('⚠️ No onPromotionUpdated callback found!');
            }
        });

        return () => {
            console.log('🔌 Unsubscribing from promotions channel...');
            channel.stopListening('.promotion.created');
            channel.stopListening('.promotion.updated');
            echo.leaveChannel('promotions');
        };
    }, []); // ✅ Chỉ subscribe một lần khi mount
};
