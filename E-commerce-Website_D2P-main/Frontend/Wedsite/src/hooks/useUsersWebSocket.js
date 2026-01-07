import { useEffect } from 'react';
import echo from '../utils/echo';

/**
 * Hook để lắng nghe realtime updates cho Users (Admin)
 * @param {Function} onUserCreated - Callback khi có user mới
 * @param {Function} onUserUpdated - Callback khi user được cập nhật
 */
export const useUsersWebSocket = ({
    onUserCreated,
    onUserUpdated,
}) => {
    useEffect(() => {
        const channel = echo.channel('admin.users');

        if (onUserCreated) {
            channel.listen('.user.created', (data) => {
                console.log('User created:', data);
                onUserCreated(data.user);
            });
        }

        if (onUserUpdated) {
            channel.listen('.user.updated', (data) => {
                console.log('User updated:', data);
                onUserUpdated(data.user);
            });
        }

        return () => {
            channel.stopListening('.user.created');
            channel.stopListening('.user.updated');
            echo.leaveChannel('admin.users');
        };
    }, [onUserCreated, onUserUpdated]);
};
