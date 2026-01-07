import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally
window.Pusher = Pusher;

console.log('🚀 Initializing Pusher WebSocket...');
console.log('📡 Pusher Key:', import.meta.env.VITE_PUSHER_APP_KEY);
console.log('🌍 Pusher Cluster:', import.meta.env.VITE_PUSHER_APP_CLUSTER);

// ❌ Tắt Pusher logging để giảm nhiễu console
Pusher.logToConsole = false;

// Create Echo instance
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'your_app_key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    forceTLS: true,
    encrypted: true,
    disableStats: true,
    // ✅ Auth endpoint cho private channels
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
        },
    },
});

console.log('✅ Echo instance created');
console.log('Echo connector state:', echo.connector?.pusher?.connection?.state);

// Listen to connection events
if (echo.connector?.pusher) {
    echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected!');
    });
    
    echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected!');
    });
    
    echo.connector.pusher.connection.bind('error', (err) => {
        console.error('❌ Pusher error:', err);
    });
}

export default echo;
