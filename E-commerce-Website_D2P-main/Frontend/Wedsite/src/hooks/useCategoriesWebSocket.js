import { useEffect } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Categories
 * @param {Function} onCategoryCreated - Callback khi có danh mục mới
 * @param {Function} onCategoryUpdated - Callback khi danh mục được cập nhật
 */
export const useCategoriesWebSocket = ({
    onCategoryCreated,
    onCategoryUpdated,
}) => {
    useEffect(() => {
        const channel = echo.channel('categories');

        if (onCategoryCreated) {
            channel.listen('.category.created', (data) => {
                console.log('Category created:', data);
                onCategoryCreated(data.category);
            });
        }

        if (onCategoryUpdated) {
            channel.listen('.category.updated', (data) => {
                console.log('Category updated:', data);
                onCategoryUpdated(data.category);
            });
        }

        return () => {
            channel.stopListening('.category.created');
            channel.stopListening('.category.updated');
            echo.leaveChannel('categories');
        };
    }, [onCategoryCreated, onCategoryUpdated]);
};
