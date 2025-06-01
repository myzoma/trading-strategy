// ملف الإعدادات والتكوين

const CONFIG = {
    // إعدادات API
    API: {
        BASE_URL: 'https://api.coingecko.com/api/v3',
        ENDPOINTS: {
            COINS_LIST: '/coins/markets',
            COIN_DETAILS: '/coins/{id}',
            PRICE_HISTORY: '/coins/{id}/market_chart'
        },
        RATE_LIMIT: 50, // طلبات في الدقيقة
        TIMEOUT: 10000, // 10 ثوان
        RETRY_ATTEMPTS: 3
    },
    
    // إعدادات التداول
    TRADING: {
        MIN_VOLUME_24H: 1000000, // الحد الأدنى للحجم اليومي
        MIN_MARKET_CAP: 10000000, // الحد الأدنى للقيمة السوقية
        MAX_COINS_TO_ANALYZE: 200, // أقصى عدد عملات للتحليل
        SCORE_THRESHOLD: 60, // الحد الأدنى للنقاط
        UPDATE_INTERVAL: 300000, // 5 دقائق
        
        // أوزان المؤشرات
        WEIGHTS: {
            VOLUME_CHANGE: 0.25,
            PRICE_CHANGE: 0.20,
            MARKET_CAP_RANK: 0.15,
            TECHNICAL_INDICATORS: 0.40
        },
        
        // إعدادات المؤشرات الفنية
        TECHNICAL: {
            RSI_PERIOD: 14,
            RSI_OVERSOLD: 30,
            RSI_OVERBOUGHT: 70,
            
            MACD_FAST: 12,
            MACD_SLOW: 26,
            MACD_SIGNAL: 9,
            
            BB_PERIOD: 20,
            BB_MULTIPLIER: 2,
            
            SMA_SHORT: 10,
            SMA_LONG: 50
        }
    },
    
    // إعدادات الواجهة
    UI: {
        THEME: 'auto', // auto, light, dark
        LANGUAGE: 'ar',
        CURRENCY: 'USD',
        DECIMAL_PLACES: 6,
        
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        
        PAGINATION: {
            ITEMS_PER_PAGE: 20,
            MAX_PAGES: 10
        },
        
        CHART: {
            DEFAULT_TIMEFRAME: '24h',
            AVAILABLE_TIMEFRAMES: ['1h', '24h', '7d', '30d'],
            COLORS: {
                POSITIVE: '#27ae60',
                NEGATIVE: '#e74c3c',
                NEUTRAL: '#95a5a6'
            }
        }
    },
    
    // إعدادات التخزين
    STORAGE: {
        PREFIX: 'trading_app_',
        CACHE_DURATION: 300000, // 5 دقائق
        MAX_CACHE_SIZE: 100,
        
        KEYS: {
            USER_SETTINGS: 'user_settings',
            WATCHLIST: 'watchlist',
            ALERTS: 'price_alerts',
            THEME: 'theme_preference',
            LAST_UPDATE: 'last_data_update'
        }
    },
    
    // إعدادات الإشعارات
    NOTIFICATIONS: {
        ENABLED: true,
        SOUND: true,
        DESKTOP: true,
        
        TYPES: {
            PRICE_ALERT: 'price_alert',
            SIGNAL_ALERT: 'signal_alert',
            DATA_UPDATE: 'data_update',
            ERROR: 'error',
            SUCCESS: 'success'
        },
        
        AUTO_HIDE_DELAY: 5000,
        MAX_NOTIFICATIONS: 10
    },
    
    // إعدادات الأمان
    SECURITY: {
        ENABLE_CSP: true,
        SANITIZE_INPUT: true,
        RATE_LIMITING: true,
        
        ALLOWED_DOMAINS: [
            'api.coingecko.com',
            'cdn.jsdelivr.net'
        ]
    },
    
    // إعدادات الأداء
    PERFORMANCE: {
        LAZY_LOADING: true,
        IMAGE_OPTIMIZATION: true,
        COMPRESSION: true,
        
        BATCH_SIZE: 50,
        CONCURRENT_REQUESTS: 5,
        
        MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB
        CLEANUP_INTERVAL: 600000 // 10 دقائق
    },
    
    // إعدادات التصدير
    EXPORT: {
        FORMATS: ['json', 'csv', 'xlsx'],
        MAX_RECORDS: 1000,
        INCLUDE_METADATA: true,
        
        CSV_DELIMITER: ',',
        CSV_ENCODING: 'utf-8'
    },
    
    // رسائل النظام
    MESSAGES: {
        LOADING: 'جاري تحميل البيانات...',
        NO_DATA: 'لا توجد بيانات متاحة',
        ERROR_NETWORK: 'خطأ في الاتصال بالشبكة',
        ERROR_API: 'خطأ في الحصول على البيانات',
        SUCCESS_UPDATE: 'تم تحديث البيانات بنجاح',
        SUCCESS_EXPORT: 'تم تصدير البيانات بنجاح'
    },
    
    // إعدادات التطوير
    DEVELOPMENT: {
        DEBUG: false,
        MOCK_DATA: false,
        CONSOLE_LOGS: false,
        PERFORMANCE_MONITORING: false
    }
};

// دالة للحصول على قيمة من الإعدادات
function getConfig(path, defaultValue = null) {
    const keys = path.split('.');
    let value = CONFIG;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }
    
    return value;
}

// دالة لتحديث الإعدادات
function updateConfig(path, newValue) {
    const keys = path.split('.');
    let current = CONFIG;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = newValue;
}

// تحميل الإعدادات المحفوظة
function loadUserSettings() {
    const saved = Utils.loadFromStorage(CONFIG.STORAGE.KEYS.USER_SETTINGS);
    if (saved) {
        // دمج الإعدادات المحفوظة مع الافتراضية
        Object.keys(saved).forEach(key => {
            if (key in CONFIG.UI) {
                CONFIG.UI[key] = saved[key];
            }
        });
    }
}

// حفظ إعدادات المستخدم
function saveUserSettings() {
    const userSettings = {
        THEME: CONFIG.UI.THEME,
        LANGUAGE: CONFIG.UI.LANGUAGE,
        CURRENCY: CONFIG.UI.CURRENCY,
        DECIMAL_PLACES: CONFIG.UI.DECIMAL_PLACES
    };
    
    Utils.saveToStorage(CONFIG.STORAGE.KEYS.USER_SETTINGS, userSettings);
}

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        getConfig,
        updateConfig,
        loadUserSettings,
        saveUserSettings
    };
} else {
    window.CONFIG = CONFIG;
    window.getConfig = getConfig;
    window.updateConfig = updateConfig;
    window.loadUserSettings = loadUserSettings;
    window.saveUserSettings = saveUserSettings;
}

// تحميل الإعدادات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();
});
