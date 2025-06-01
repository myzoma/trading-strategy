// إعدادات API و المنصة
const CONFIG = {
    // مفتاح API الخاص بمنصة OKX
    OKX_API: {
        baseURL: 'https://www.okx.com/api/v5',
        // ضع مفاتيح API الخاصة بك هنا
        apiKey: 'b20c667d-ae40-48a6-93f4-a11a64185068',
        secretKey: 'BD7C76F71D1A4E01B4C7E1A23B620365',
        passphrase: '212160Nm$#'
    },
    
    // إعدادات التحديث
    UPDATE_INTERVAL: 15 * 60 * 1000, // 15 دقيقة بالميلي ثانية
    
    // إعدادات المؤشرات الفنية
    INDICATORS: {
        RSI_PERIOD: 14,
        RSI_THRESHOLD: 50,
        SMA_PERIOD: 20,
        MACD_FAST: 12,
        MACD_SLOW: 26,
        MACD_SIGNAL: 9,
        VOLUME_PERIOD: 4 // آخر 4 ساعات
    },
    
    // معايير التقييم والنقاط
    SCORING: {
        RSI_BREAKTHROUGH: 20
// إعدادات API و المنصة
const CONFIG = {
    // مفتاح API الخاص بمنصة OKX
    OKX_API: {
        baseURL: 'https://www.okx.com/api/v5',
        // ضع مفاتيح API الخاصة بك هنا
        apiKey: 'YOUR_API_KEY_HERE',
        secretKey: 'YOUR_SECRET_KEY_HERE',
        passphrase: 'YOUR_PASSPHRASE_HERE'
    },
    
    // إعدادات التحديث
    UPDATE_INTERVAL: 15 * 60 * 1000, // 15 دقيقة بالميلي ثانية
    
    // إعدادات المؤشرات الفنية
    INDICATORS: {
        RSI_PERIOD: 14,
        RSI_THRESHOLD: 50,
        SMA_PERIOD: 20,
        MACD_FAST: 12,
        MACD_SLOW: 26,
        MACD_SIGNAL: 9,
        VOLUME_PERIOD: 4 // آخر 4 ساعات
    },
    
    // معايير التقييم والنقاط
    SCORING: {
        RSI_BREAKTHROUGH: 20,      // RSI يخترق 50 صعوداً
        MACD_CROSSOVER: 15,        // تقاطع MACD
        SMA_BREAKTHROUGH: 15,      // اختراق المتوسط المتحرك
        RESISTANCE_BREAK: 20,      // اختراق المقاومة
        LIQUIDITY_CROSS: 10,       // تقاطع مؤشر السيولة
        VOLUME_INCREASE: 10,       // زيادة حجم التداول
        TREND_STRENGTH: 10         // قوة الاتجاه
    },
    
    // العملات المستبعدة
    EXCLUDED_COINS: [
        'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'USDD',
        'FDUSD', 'PYUSD', 'LUSD', 'FRAX', 'GUSD', 'SUSD'
    ],
    
    // الحد الأدنى لحجم التداول (بالدولار)
    MIN_VOLUME: 1000000,
    
    // الحد الأدنى للسعر لتجنب العملات الصفرية
    MIN_PRICE: 0.0001,
    
    // عدد أفضل العملات للعرض
    TOP_COINS_LIMIT: 100,
    
    // إعدادات الشبكة
    GRID_COLUMNS: 4,
    
    // إعدادات المقاومة والدعم
    SUPPORT_RESISTANCE: {
        LOOKBACK_PERIODS: 50,
        MIN_TOUCHES: 2,
        PROXIMITY_THRESHOLD: 0.02 // 2%
    }
};

// دالة للتحقق من صحة الإعدادات
function validateConfig() {
    if (!CONFIG.OKX_API.apiKey || CONFIG.OKX_API.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ يرجى إدخال مفتاح API الصحيح في ملف config.js');
        return false;
    }
    return true;
}

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
