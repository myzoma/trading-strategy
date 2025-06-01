// Notification system
const notifications = {
    show: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    },
    
    success: (message) => notifications.show(message, 'success'),
    error: (message) => notifications.show(message, 'error'),
    warning: (message) => notifications.show(message, 'warning')
};
