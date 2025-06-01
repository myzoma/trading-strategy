// نظام الإشعارات والتنبيهات

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.settings = {
            enabled: true,
            sound: true,
            desktop: true,
            priceAlerts: true,
            signalAlerts: true
        };
        
        this.loadSettings();
        this.requestPermission();
        this.createNotificationContainer();
    }
    
    // طلب إذن الإشعارات
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
    
    // إنشاء حاوية الإشعارات
    createNotificationContainer() {
        if (document.getElementById('notificationContainer')) return;
        
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // عرض إشعار
    show(title, message, type = 'info', options = {}) {
        if (!this.settings.enabled) return;
        
        const notification = {
            id: Utils.generateId(),
            title,
            message,
            type,
            timestamp: new Date(),
            ...options
        };
        
        this.notifications.push(notification);
        
        // عرض الإشعار في الصفحة
        this.showInPageNotification(notification);
        
        // عرض إشعار سطح المكتب
        if (this.settings.desktop) {
            this.showDesktopNotification(notification);
        }
        
        // تشغيل الصوت
        if (this.settings.sound) {
            this.playNotificationSound(type);
        }
        
        return notification.id;
    }
    
    // عرض إشعار في الصفحة
    showInPageNotification(notification) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.innerHTML = `
            <div class="notification-icon">${this.getTypeIcon(notification.type)}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${Utils.formatDateTime(notification.timestamp)}</div>
            </div>
            <button class="notification-close" onclick="notificationSystem.dismiss('${notification.id}')">×</button>
        `;
        
        element.setAttribute('data-id', notification.id);
        container.appendChild(element);
        
        // إضافة تأثير الظهور
        setTimeout(() => element.classList.add('show'), 100);
        
        // إزالة تلقائية بعد 5 ثوان
        if (notification.autoHide !== false) {
            setTimeout(() => this.dismiss(notification.id), 5000);
        }
    }
    
    // عرض إشعار سطح المكتب
    showDesktopNotification(notification) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        const desktopNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.persistent || false
        });
        
        desktopNotification.onclick = () => {
            window.focus();
            if (notification.onClick) {
                notification.onClick();
            }
            desktopNotification.close();
        };
        
        // إغلاق تلقائي بعد 5 ثوان
        setTimeout(() => desktopNotification.close(), 5000);
    }
    
    // تشغيل صوت الإشعار
    playNotificationSound(type) {
        try {
            const audio = new Audio();
            switch (type) {
                case 'success':
                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgg2jdXzzn0vBSF1xe/eizEIHWq+8+OWT';
                    break;
                case 'warning':
                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgg2jdXzzn0vBSF1xe/eizEIHWq+8+OWT';
                    break;
                case 'error':
                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgg2jdXzzn0vBSF1xe/eizEIHWq+8+OWT';
                    break;
                default:
                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgg2jdXzzn0vBSF1xe/eizEIHWq+8+OWT';
            }
            audio.volume = 0.3;
            audio.play().catch(() => {}); // تجاهل الأخطاء
        } catch (error) {
            console.warn('فشل في تشغيل صوت الإشعار:', error);
        }
    }
    
    // الحصول على أيقونة النوع
    getTypeIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️',
            signal: '📈',
            price: '💰'
        };
        return icons[type] || icons.info;
    }
    
    // إزالة إشعار
    dismiss(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('hide');
            setTimeout(() => element.remove(), 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    // مسح جميع الإشعارات
    clearAll() {
        const container = document.getElementById('notificationContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }
    
    // إشعار تغيير السعر
    priceAlert(coin, oldPrice, newPrice) {
        if (!this.settings.priceAlerts) return;
        
        const change = ((newPrice - oldPrice) / oldPrice) * 100;
        const type = change > 0 ? 'success' : 'warning';
        const direction = change > 0 ? 'ارتفع' : 'انخفض';
        
        this.show(
            `تغيير سعر ${coin.symbol}`,
            `${direction} السعر بنسبة ${Math.abs(change).toFixed(2)}% إلى ${Utils.formatCurrency(newPrice)}`,
            type,
            {
                persistent: Math.abs(change) > 5, // إشعار دائم للتغييرات الكبيرة
                onClick: () => this.showCoinDetails(coin)
            }
        );
    }
    
    // إشعار إشارة تداول
    signalAlert(coin, signals) {
        if (!this.settings.signalAlerts) return;
        
        const signalCount = signals.filter(s => s.active).length;
        const strength = Utils.getSignalStrength(signalCount);
        
        this.show(
            `إشارة تداول ${coin.symbol}`,
            `تم اكتشاف ${signalCount} إشارة إيجابية - القوة: ${strength.strength}`,
            'signal',
            {
                persistent: signalCount >= 5,
                onClick: () => this.showCoinDetails(coin)
            }
        );
    }
    
    // إشعار تحديث البيانات
    dataUpdateAlert(coinsCount, qualifiedCount) {
        this.show(
            'تم تحديث البيانات',
            `تم تحليل ${coinsCount} عملة، ${qualifiedCount} عملة مؤهلة للتداول`,
            'info'
        );
    }
    
    // إشعار خطأ
    errorAlert(message, details = '') {
        this.show(
            'حدث خطأ',
            `${message}${details ? ': ' + details : ''}`,
            'error',
            { persistent: true }
        );
    }
    
    // إشعار نجاح
    successAlert(message) {
        this.show(
            'تمت العملية بنجاح',
            message,
            'success'
        );
    }
    
    // عرض تفاصيل العملة
    showCoinDetails(coin) {
        if (window.tradingStrategy) {
            window.tradingStrategy.showCoinDetails(coin);
        }
    }
    
    // حفظ الإعدادات
    saveSettings() {
        Utils.saveToStorage('notificationSettings', this.settings);
    }
    
    // تحميل الإعدادات
    loadSettings() {
        const saved = Utils.loadFromStorage('notificationSettings');
        if (saved) {
            this.settings = { ...this.settings, ...saved };
        }
    }
    
    // تحديث الإعدادات
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }
    
    // الحصول على الإعدادات
    getSettings() {
        return { ...this.settings };
    }
    
    // الحصول على عدد الإشعارات النشطة
    getActiveCount() {
        return this.notifications.length;
    }
    
    // الحصول على آخر الإشعارات
    getRecent(limit = 10) {
        return this.notifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}

// إنشاء نظام الإشعارات العام
window.notificationSystem = new NotificationSystem();

// إضافة أنماط CSS للإشعارات
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    pointer-events: none;
}

.notification {
    background: white;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    margin-bottom: 10px;
    padding: 15px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: auto;
    border-left: 4px solid #007bff;
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification.hide {
    transform: translateX(100%);
    opacity: 0;
}

.notification-success {
    border-left-color: #28a745;
}

.notification-warning {
    border-left-color: #ffc107;
}

.notification-error {
    border-left-color: #dc3545;
}

.notification-signal {
    border-left-color: #17a2b8;
}

.notification-price {
    border-left-color: #6f42c1;
}

.notification-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-title {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    font-size: 14px;
}

.notification-message {
    color: #666;
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 4px;
}

.notification-time {
    color: #999;
    font-size: 11px;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background: #f0f0f0;
    color: #666;
}

@media (max-width: 480px) {
    .notification-container {
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .notification {
        padding: 12px;
    }
    
    .notification-title {
        font-size: 13px;
    }
    
    .notification-message {
        font-size: 12px;
    }
}
</style>
`;

// إضافة الأنماط إلى الصفحة
document.head.insertAdjacentHTML('beforeend', notificationStyles);

