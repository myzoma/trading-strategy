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
