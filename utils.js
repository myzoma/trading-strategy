// ملف المساعدات والدوال المشتركة

class Utils {
    // تنسيق الأرقام
    static formatNumber(num, decimals = 2) {
        if (num === null || num === undefined) return '0';
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1e12) {
            return (num / 1e12).toFixed(decimals) + 'T';
        } else if (absNum >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'B';
        } else if (absNum >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        } else if (absNum >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        }
        
        return num.toFixed(decimals);
    }
    
    // تنسيق العملة
    static formatCurrency(amount, currency = 'USD', locale = 'ar-SA') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(amount);
    }
    
    // تنسيق النسبة المئوية
    static formatPercentage(value, decimals = 2) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
    }
    
    // تنسيق التاريخ والوقت
    static formatDateTime(date, locale = 'ar-SA') {
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
    
    // تأخير التنفيذ (debounce)
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // تحديد لون السعر حسب التغيير
    static getPriceColor(change) {
        if (change > 0) return '#27ae60';
        if (change < 0) return '#e74c3c';
        return '#666';
    }
    
    // حساب النسبة المئوية للتغيير
    static calculatePercentageChange(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }
    
    // التحقق من صحة البيانات
    static validateCoinData(coin) {
        const required = ['symbol', 'price', 'volume24h'];
        return required.every(field => coin[field] !== undefined && coin[field] !== null);
    }
    
    // تنظيف البيانات
    static sanitizeData(data) {
        if (typeof data === 'string') {
            return data.trim().replace(/[<>]/g, '');
        }
        return data;
    }
    
    // حفظ في التخزين المحلي مع معالجة الأخطاء
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('فشل في حفظ البيانات:', error);
            return false;
        }
    }
    
    // تحميل من التخزين المحلي مع معالجة الأخطاء
    static loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('فشل في تحميل البيانات:', error);
            return null;
        }
    }
    
    // إنشاء معرف فريد
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
     // نسخ النص إلى الحافظة
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('فشل في النسخ:', error);
            return false;
        }
    }
    
    // التحقق من دعم المتصفح للميزات
    static checkBrowserSupport() {
        return {
            localStorage: typeof Storage !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            clipboard: navigator.clipboard !== undefined,
            notifications: 'Notification' in window
        };
    }
    
    // إنشاء إشعار
    static async showNotification(title, options = {}) {
        if (!('Notification' in window)) {
            console.warn('المتصفح لا يدعم الإشعارات');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            new Notification(title, options);
            return true;
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, options);
                return true;
            }
        }
        return false;
    }
    
    // حساب المتوسط
    static calculateAverage(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, num) => acc + num, 0);
        return sum / numbers.length;
    }
    
    // حساب الانحراف المعياري
    static calculateStandardDeviation(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const avg = this.calculateAverage(numbers);
        const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
        const avgSquaredDiff = this.calculateAverage(squaredDiffs);
        return Math.sqrt(avgSquaredDiff);
    }
    
    // تحويل الوقت النسبي
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `منذ ${days} يوم`;
        if (hours > 0) return `منذ ${hours} ساعة`;
        if (minutes > 0) return `منذ ${minutes} دقيقة`;
        return `منذ ${seconds} ثانية`;
    }
    
    // تحويل الألوان
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // إنشاء تدرج لوني
    static createGradient(color1, color2, steps = 10) {
        const gradient = [];
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const r = Math.round(color1.r + ratio * (color2.r - color1.r));
            const g = Math.round(color1.g + ratio * (color2.g - color1.g));
            const b = Math.round(color1.b + ratio * (color2.b - color1.b));
            gradient.push(`rgb(${r}, ${g}, ${b})`);
        }
        return gradient;
    }
    
    // تحديد مستوى المخاطرة
    static getRiskLevel(score) {
        if (score >= 80) return { level: 'منخفض', color: '#27ae60', icon: '🟢' };
        if (score >= 60) return { level: 'متوسط', color: '#f39c12', icon: '🟡' };
        if (score >= 40) return { level: 'عالي', color: '#e67e22', icon: '🟠' };
        return { level: 'عالي جداً', color: '#e74c3c', icon: '🔴' };
    }
    
    // تحديد قوة الإشارة
    static getSignalStrength(signalCount, maxSignals = 7) {
        const percentage = (signalCount / maxSignals) * 100;
        if (percentage >= 80) return { strength: 'قوية جداً', color: '#27ae60', icon: '🚀' };
        if (percentage >= 60) return { strength: 'قوية', color: '#2ecc71', icon: '📈' };
        if (percentage >= 40) return { strength: 'متوسطة', color: '#f39c12', icon: '⚡' };
        if (percentage >= 20) return { strength: 'ضعيفة', color: '#e67e22', icon: '⚠️' };
        return { strength: 'ضعيفة جداً', color: '#e74c3c', icon: '❌' };
    }
    
    // تصدير البيانات بصيغ مختلفة
    static exportToCSV(data, filename = 'trading-data') {
        if (!Array.isArray(data) || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }
    
    static exportToJSON(data, filename = 'trading-data') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }
    
    // تحميل ملف
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // معالجة الأخطاء
    static handleError(error, context = '') {
        console.error(`خطأ في ${context}:`, error);
        
        // إرسال تقرير الخطأ (اختياري)
        if (window.errorReporting) {
            window.errorReporting.report(error, context);
        }
        
        return {
            success: false,
            error: error.message || 'حدث خطأ غير متوقع',
            context
        };
    }
    
    // التحقق من الاتصال بالإنترنت
    static checkConnection() {
        return navigator.onLine;
    }
    
    // مراقبة حالة الاتصال
    static monitorConnection(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }
    
    // ضغط البيانات
    static compressData(data) {
        try {
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.warn('فشل في ضغط البيانات:', error);
            return data;
        }
    }
    
    // إلغاء ضغط البيانات
    static decompressData(compressedData) {
        try {
            return JSON.parse(atob(compressedData));
        } catch (error) {
            console.warn('فشل في إلغاء ضغط البيانات:', error);
            return compressedData;
        }
    }
}

// فئة لإدارة الأحداث
class EventManager {
    constructor() {
        this.events = {};
    }
    
    // إضافة مستمع للحدث
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    // إزالة مستمع الحدث
    off(event, callback) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }
    
    // إطلاق حدث
    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('خطأ في معالج الحدث:', error);
            }
        });
    }
    
    // إضافة مستمع لمرة واحدة
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
}

// فئة لإدارة ذاكرة التخزين المؤقت
class CacheManager {
    constructor(maxSize = 100, ttl = 300000) { // 5 دقائق افتراضياً
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    
    // إضافة عنصر إلى الذاكرة المؤقتة
    set(key, value) {
        // إزالة العناصر المنتهية الصلاحية
        this.cleanup();
        
        // إزالة العناصر القديمة إذا تجاوزنا الحد الأقصى
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    // الحصول على عنصر من الذاكرة المؤقتة
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        // التحقق من انتهاء الصلاحية
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    // التحقق من وجود عنصر
    has(key) {
        return this.get(key) !== null;
    }
    
    // إزالة عنصر
    delete(key) {
        return this.cache.delete(key);
    }
    
    // مسح الذاكرة المؤقتة
    clear() {
        this.cache.clear();
    }
    
    // تنظيف العناصر المنتهية الصلاحية
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
    
    // الحصول على حجم الذاكرة المؤقتة
    size() {
        this.cleanup();
        return this.cache.size;
    }
}

// فئة لإدارة الطلبات مع إعادة المحاولة
class RequestManager {
    constructor(maxRetries = 3, retryDelay = 1000) {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.cache = new CacheManager();
    }
    
    // تنفيذ طلب مع إعادة المحاولة
    async request(url, options = {}, useCache = true) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // التحقق من الذاكرة المؤقتة
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    timeout: 10000,
                    ...options
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // حفظ في الذاكرة المؤقتة
                if (useCache) {
                    this.cache.set(cacheKey, data);
                }
                
                return data;
                
            } catch (error) {
                lastError = error;
                console.warn(`محاولة ${attempt + 1} فشلت:`, error.message);
                
                // انتظار قبل إعادة المحاولة
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }
        
        throw lastError;
    }
    
    // تأخير التنفيذ
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// تصدير الفئات والدوال
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        EventManager,
        CacheManager,
        RequestManager
    };
} else {
    window.Utils = Utils;
    window.EventManager = EventManager;
    window.CacheManager = CacheManager;
    window.RequestManager = RequestManager;
}
   
  
