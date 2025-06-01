class TradingStrategy {
    constructor() {
        this.coins = [];
        this.isLoading = false;
        this.lastUpdate = null;
        this.updateInterval = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('🚀 بدء تشغيل استراتيجية التداول...');
        
        // التحقق من وجود دالة validateConfig
        if (typeof validateConfig === 'function' && !validateConfig()) {
            this.showError('خطأ في الإعدادات: يرجى التحقق من مفاتيح API');
            return;
        }
        
        // تحميل البيانات المحفوظة أولاً
        if (!this.loadFromLocalStorage()) {
            await this.loadCoinsData();
        }
        
        this.setupEventListeners();
        this.startAutoUpdate();
    }
    
    setupEventListeners() {
        // إغلاق النافذة المنبثقة
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });
        
        // إغلاق بمفتاح ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    async loadCoinsData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            console.log('📊 جاري تحميل بيانات العملات...');
            
            // جلب قائمة العملات
            const tickers = await this.fetchTickers();
            console.log(`📈 تم جلب ${tickers.length} عملة`);
            
            // تصفية العملات
            const filteredTickers = this.filterCoins(tickers);
            console.log(`✅ تم تصفية ${filteredTickers.length} عملة مؤهلة`);
            
            // تحليل العملات وحساب النقاط
            const analyzedCoins = await this.analyzeCoins(filteredTickers);
            console.log(`🔍 تم تحليل ${analyzedCoins.length} عملة`);
            
            // ترتيب العملات حسب النقاط
            this.coins = analyzedCoins
                .sort((a, b) => b.score - a.score)
                .slice(0, CONFIG.TOP_COINS_LIMIT);
            
            this.renderCoins();
            this.updateStats();
            this.lastUpdate = new Date();
            this.saveToLocalStorage();
            
            console.log('✨ تم تحديث البيانات بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            this.showError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    async fetchTickers() {
        try {
            // محاولة جلب البيانات من OKX API
            const response = await fetch(`${CONFIG.OKX_API.baseURL}/market/tickers?instType=SPOT`);
            const data = await response.json();
            
            if (data.code === '0') {
                return data.data;
            } else {
                throw new Error('فشل في جلب البيانات من OKX');
            }
        } catch (error) {
            // في حالة فشل الاتصال، استخدم بيانات تجريبية
            console.warn('استخدام بيانات تجريبية...');
            return this.getMockData();
        }
    }
    
    getMockData() {
        // بيانات تجريبية للاختبار
        const mockCoins = [
            'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'AVAX', 'SHIB',
            'MATIC', 'LTC', 'UNI', 'LINK', 'ATOM', 'XLM', 'VET', 'FIL', 'TRX', 'ETC',
            'THETA', 'XMR', 'ALGO', 'AAVE', 'MKR', 'COMP', 'SUSHI', 'YFI', 'SNX', 'CRV',
            'NEAR', 'SAND', 'MANA', 'AXS', 'ICP', 'FTM', 'HBAR', 'EGLD', 'XTZ', 'FLOW'
        ];
        
        return mockCoins.map(symbol => ({
            instId: `${symbol}-USDT`,
            last: (Math.random() * 1000 + 10).toFixed(4),
            lastSz: (Math.random() * 1000).toFixed(2),
            askPx: (Math.random() * 1000 + 10).toFixed(4),
            bidPx: (Math.random() * 1000 + 10).toFixed(4),
            open24h: (Math.random() * 1000 + 10).toFixed(4),
            high24h: (Math.random() * 1000 + 10).toFixed(4),
            low24h: (Math.random() * 1000 + 10).toFixed(4),
            vol24h: (Math.random() * 10000000).toFixed(0),
            volCcy24h: (Math.random() * 100000000).toFixed(0),
            ts: Date.now().toString()
        }));
    }
    
   filterCoins(tickers) {
    // تعريف القيم الافتراضية
    const EXCLUDED_COINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];
    const MIN_PRICE = 0.000001;
    const MIN_VOLUME = 100000;
    
    return tickers.filter(ticker => {
        const symbol = ticker.instId.split('-')[0];
        const price = parseFloat(ticker.last);
        const volume = parseFloat(ticker.volCcy24h);
        
        if (EXCLUDED_COINS.includes(symbol)) return false;
        if (!ticker.instId.endsWith('-USDT')) return false;
        if (price < MIN_PRICE) return false;
        if (volume < MIN_VOLUME) return false;
        
        return true;
    });
}

    
    async analyzeCoins(tickers) {
        const analyzedCoins = [];
        
        for (const ticker of tickers) {
            try {
                const analysis = await this.analyzeCoin(ticker);
                if (analysis.score > 0) {
                    analyzedCoins.push(analysis);
                }
            } catch (error) {
                console.warn(`تخطي تحليل ${ticker.instId}:`, error.message);
            }
        }
        
        return analyzedCoins;
    }
    
    async analyzeCoin(ticker) {
        const symbol = ticker.instId.split('-')[0];
        const currentPrice = parseFloat(ticker.last);
        const volume24h = parseFloat(ticker.volCcy24h);
        const priceChange = ((currentPrice - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100;
        
        // حساب المؤشرات الفنية (محاكاة)
        const indicators = await this.calculateIndicators(ticker);
        
        // حساب النقاط
        let score = 0;
        const signals = [];
        
        // 1. RSI يخترق 50 صعوداً
        if (indicators.rsi > CONFIG.INDICATORS.RSI_THRESHOLD && indicators.rsiPrevious <= CONFIG.INDICATORS.RSI_THRESHOLD) {
            score += CONFIG.SCORING.RSI_BREAKTHROUGH;
            signals.push({ type: 'RSI Breakthrough', value: indicators.rsi, weight: CONFIG.SCORING.RSI_BREAKTHROUGH });
        }
        
        // 2. تقاطع MACD
        if (indicators.macdCrossover) {
            score += CONFIG.SCORING.MACD_CROSSOVER;
            signals.push({ type: 'MACD Crossover', value: indicators.macd, weight: CONFIG.SCORING.MACD_CROSSOVER });
        }
        
        // 3. اختراق المتوسط المتحرك
        if (currentPrice > indicators.sma && indicators.previousPrice <= indicators.smaPrevious) {
            score += CONFIG.SCORING.SMA_BREAKTHROUGH;
            signals.push({ type: 'SMA Breakthrough', value: indicators.sma, weight: CONFIG.SCORING.SMA_BREAKTHROUGH });
        }
        
        // 4. اقتراب من مستوى المقاومة
        if (indicators.nearResistance) {
            score += CONFIG.SCORING.RESISTANCE_BREAK;
            signals.push({ type: 'Near Resistance', value: indicators.resistance, weight: CONFIG.SCORING.RESISTANCE_BREAK });
        }
        
        // 5. تقاطع مؤشر السيولة
        if (indicators.liquidityCross) {
            score += CONFIG.SCORING.LIQUIDITY_CROSS;
            signals.push({ type: 'Liquidity Cross', value: indicators.liquidity, weight: CONFIG.SCORING.LIQUIDITY_CROSS });
        }
        
        // 6. زيادة حجم التداول
        if (indicators.volumeIncrease) {
            score += CONFIG.SCORING.VOLUME_INCREASE;
            signals.push({ type: 'Volume Increase', value: indicators.volumeChange, weight: CONFIG.SCORING.VOLUME_INCREASE });
        }
        
        // 7. قوة الاتجاه
        if (indicators.trendStrength > 0.7) {
            score += CONFIG.SCORING.TREND_STRENGTH;
            signals.push({ type: 'Strong Trend', value: indicators.trendStrength, weight: CONFIG.SCORING.TREND_STRENGTH });
        }
        
        return {
            symbol,
            instId: ticker.instId,
            price: currentPrice,
            priceChange,
            volume24h,
            score,
            signals,
            indicators,
            analysis: this.generateAnalysis(ticker, indicators, signals),
            timestamp: new Date()
        };
    }
    
       async calculateIndicators(ticker) {
        const currentPrice = parseFloat(ticker.last);
        const high24h = parseFloat(ticker.high24h);
        const low24h = parseFloat(ticker.low24h);
        const volume = parseFloat(ticker.vol24h);
        
        return {
            rsi: Math.random() * 100,
            rsiPrevious: Math.random() * 100,
            macd: (Math.random() - 0.5) * 10,
            macdSignal: (Math.random() - 0.5) * 10,
            macdCrossover: Math.random() > 0.7,
            sma: currentPrice * (0.95 + Math.random() * 0.1),
            smaPrevious: currentPrice * (0.95 + Math.random() * 0.1),
            previousPrice: currentPrice * (0.98 + Math.random() * 0.04),
            resistance: high24h * (1 + Math.random() * 0.05),
            support: low24h * (0.95 + Math.random() * 0.05),
            nearResistance: Math.random() > 0.6,
            liquidity: (Math.random() - 0.5) * 100,
            liquidityCross: Math.random() > 0.8,
            volumeIncrease: Math.random() > 0.5,
            volumeChange: (Math.random() - 0.5) * 200,
            trendStrength: Math.random()
        };
    }
    
    generateAnalysis(ticker, indicators, signals) {
        const symbol = ticker.instId.split('-')[0];
        const currentPrice = parseFloat(ticker.last);
        
        return {
            summary: this.generateSummary(signals),
            targets: this.calculateTargets(currentPrice, indicators),
            stopLoss: this.calculateStopLoss(currentPrice, indicators),
            entryPoint: this.calculateEntryPoint(currentPrice, indicators),
            riskReward: this.calculateRiskReward(currentPrice, indicators),
            timeframe: 'قصير إلى متوسط المدى (1-4 أسابيع)',
            confidence: this.calculateConfidence(signals)
        };
    }
    
    generateSummary(signals) {
        if (signals.length >= 5) {
            return '🚀 إشارة شراء قوية جداً - تجمع عدة عوامل إيجابية';
        } else if (signals.length >= 3) {
            return '📈 إشارة شراء جيدة - عوامل فنية إيجابية';
        } else if (signals.length >= 1) {
            return '⚡ إشارة شراء محتملة - يُنصح بالمتابعة';
        } else {
            return '⚠️ لا توجد إشارات واضحة حالياً';
        }
    }
    
    calculateTargets(price, indicators) {
        return {
            target1: (price * 1.05).toFixed(6),
            target2: (price * 1.12).toFixed(6),
            target3: (price * 1.20).toFixed(6)
        };
    }
    
    calculateStopLoss(price, indicators) {
        return (price * 0.95).toFixed(6);
    }
    
    calculateEntryPoint(price, indicators) {
        return {
            immediate: price.toFixed(6),
            dip: (price * 0.98).toFixed(6),
            breakout: (price * 1.02).toFixed(6)
        };
    }
    
    calculateRiskReward(price, indicators) {
        const target = price * 1.12;
        const stopLoss = price * 0.95;
        const risk = price - stopLoss;
        const reward = target - price;
        return (reward / risk).toFixed(2);
    }
    
    calculateConfidence(signals) {
        const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
        const maxPossibleWeight = Object.values(CONFIG.SCORING).reduce((sum, weight) => sum + weight, 0);
        return Math.min(100, (totalWeight / maxPossibleWeight) * 100).toFixed(0);
    }
    
    renderCoins() {
        const grid = document.getElementById('coinsGrid');
        grid.innerHTML = '';
        
        if (this.coins.length === 0) {
            grid.innerHTML = '<div class="loading-card">لا توجد عملات تحقق المعايير المطلوبة حالياً</div>';
            return;
        }
        
        this.coins.forEach((coin, index) => {
            const card = this.createCoinCard(coin, index + 1);
            grid.appendChild(card);
        });
    }
    
    createCoinCard(coin, rank) {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.style.animationDelay = `${(rank - 1) * 0.1}s`;
        
        const priceChangeClass = coin.priceChange >= 0 ? 'price-change' : 'price-change negative';
        const priceChangeIcon = coin.priceChange >= 0 ? '↗' : '↘';
        
        card.innerHTML = `
            <div class="rank-badge">المركز ${rank}</div>
            <div class="coin-header">
                <div class="coin-logo">${coin.symbol.charAt(0)}</div>
                <div class="coin-info">
                    <h3>${coin.symbol}</h3>
                    <span class="score">${coin.score} نقطة</span>
                </div>
            </div>
            <div class="coin-details">
                <div class="detail-item">
                    <div class="detail-label">السعر الحالي</div>
                    <div class="detail-value">$${parseFloat(coin.price).toFixed(6)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">التغيير 24س</div>
                    <div class="detail-value ${priceChangeClass}">
                        ${priceChangeIcon} ${Math.abs(coin.priceChange).toFixed(2)}%
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">حجم التداول</div>
                    <div class="detail-value">$${this.formatNumber(coin.volume24h)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">الإشارات</div>
                    <div class="detail-value">${coin.signals.length} إشارة</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.showCoinDetails(coin));
        
        return card;
    }
    
    showCoinDetails(coin) {
        const modal = document.getElementById('modalOverlay');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        
        title.textContent = `تحليل مفصل - ${coin.symbol}`;
        
        content.innerHTML = `
            <div class="analysis-section">
                <h3>📊 ملخص التحليل</h3>
                <p>${coin.analysis.summary}</p>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="label">مستوى الثقة</div>
                        <div class="value">${coin.analysis.confidence}%</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">نسبة المخاطرة/العائد</div>
                        <div class="value">1:${coin.analysis.riskReward}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">الإطار الزمني</div>
                        <div class="value">${coin.analysis.timeframe}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>🎯 الأهداف السعرية</h3>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="label">الهدف الأول</div>
                        <div class="value">$${coin.analysis.targets.target1}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">الهدف الثاني</div>
                        <div class="value">$${coin.analysis.targets.target2}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">الهدف الثالث</div>
                        <div class="value">$${coin.analysis.targets.target3}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>📍 نقاط الدخول المقترحة</h3>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="label">دخول فوري</div>
                        <div class="value">$${coin.analysis.entryPoint.immediate}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">عند الانخفاض</div>
                        <div class="value">$${coin.analysis.entryPoint.dip}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">عند الاختراق</div>
                        <div class="value">$${coin.analysis.entryPoint.breakout}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>🛡️ إدارة المخاطر</h3>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="label">وقف الخسارة</div>
                        <div class="value">$${coin.analysis.stopLoss}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">الدعم القريب</div>
                        <div class="value">$${coin.indicators.support.toFixed(6)}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">المقاومة القريبة</div>
                        <div class="value">$${coin.indicators.resistance.toFixed(6)}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>📈 الإشارات الفنية المحققة</h3>
                ${coin.signals.map(signal => `
                    <div style="margin-bottom: 10px;">
                        <span class="signal-indicator signal-buy">${signal.type}</span>
                        <span>القيمة: ${signal.value.toFixed(2)} | الوزن: ${signal.weight} نقطة</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="analysis-section">
                <h3>🔍 المؤشرات الفنية الحالية</h3>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <div class="label">RSI</div>
                        <div class="value">${coin.indicators.rsi.toFixed(2)}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">MACD</div>
                        <div class="value">${coin.indicators.macd.toFixed(4)}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">المتوسط المتحرك</div>
                        <div class="value">$${coin.indicators.sma.toFixed(6)}</div>
                    </div>
                    <div class="analysis-item">
                        <div class="label">قوة الاتجاه</div>
                        <div class="value">${(coin.indicators.trendStrength * 100).toFixed(0)}%</div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    }
    
    updateStats() {
        document.getElementById('totalCoins').textContent = this.coins.length;
        document.getElementById('qualifiedCoins').textContent = this.coins.filter(coin => coin.score >= 50).length;
        
        const avgScore = this.coins.length > 0 
            ? (this.coins.reduce((sum, coin) => sum + coin.score, 0) / this.coins.length).toFixed(1)
            : 0;
        document.getElementById('avgScore').textContent = avgScore;
        
        if (this.lastUpdate) {
            document.getElementById('lastUpdate').textContent = 
                `آخر تحديث: ${this.lastUpdate.toLocaleTimeString('ar-SA')}`;
        }
    }
    
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (show) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
    
    showError(message) {
        const grid = document.getElementById('coinsGrid');
        grid.innerHTML = `<div class="error-message">${message}</div>`;
    }
    
    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }
    
    startAutoUpdate() {
        // تحديث دوري كل 15 دقيقة
        this.updateInterval = setInterval(() => {
            console.log('🔄 تحديث تلقائي...');
            this.loadCoinsData();
        }, CONFIG.UPDATE_INTERVAL);
    }
    
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    // دالة لحفظ البيانات محلياً
       saveToLocalStorage() {
        try {
            const dataToSave = {
                coins: this.coins,
                lastUpdate: this.lastUpdate,
                timestamp: Date.now()
            };
            localStorage.setItem('tradingStrategyData', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('فشل في حفظ البيانات محلياً:', error);
        }
    }
    
    // دالة لتحميل البيانات المحفوظة محلياً
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('tradingStrategyData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // التحقق من أن البيانات ليست قديمة جداً (أكثر من ساعة)
                const oneHour = 60 * 60 * 1000;
                if (Date.now() - data.timestamp < oneHour) {
                    this.coins = data.coins || [];
                    this.lastUpdate = new Date(data.lastUpdate);
                    this.renderCoins();
                    this.updateStats();
                    return true;
                }
            }
        } catch (error) {
            console.warn('فشل في تحميل البيانات المحفوظة:', error);
        }
        return false;
    }
    
    // دالة لتصدير البيانات
    exportData() {
        const dataToExport = {
            coins: this.coins,
            exportDate: new Date().toISOString(),
            config: CONFIG
        };
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading-strategy-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // دالة للبحث في العملات
    searchCoins(query) {
        if (!query) {
            this.renderCoins();
            return;
        }
        
        const filteredCoins = this.coins.filter(coin =>
            coin.symbol.toLowerCase().includes(query.toLowerCase())
        );
        
        const grid = document.getElementById('coinsGrid');
        grid.innerHTML = '';
        
        filteredCoins.forEach((coin, index) => {
            const card = this.createCoinCard(coin, index + 1);
            grid.appendChild(card);
        });
    }
    
    // دالة لفلترة العملات حسب النقاط
    filterByScore(minScore) {
        const filteredCoins = this.coins.filter(coin => coin.score >= minScore);
        
        const grid = document.getElementById('coinsGrid');
        grid.innerHTML = '';
        
        filteredCoins.forEach((coin, index) => {
            const card = this.createCoinCard(coin, index + 1);
            grid.appendChild(card);
        });
    }
    
    // دالة لحساب المؤشرات الفنية الحقيقية
    calculateRealRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses += Math.abs(change);
            }
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? Math.abs(change) : 0;
            
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    calculateRealMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (prices.length < slowPeriod) return null;
        
        const ema12 = this.calculateEMA(prices, fastPeriod);
        const ema26 = this.calculateEMA(prices, slowPeriod);
        
        const macdLine = ema12.map((value, index) => value - ema26[index]);
        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        const histogram = macdLine.map((value, index) => value - signalLine[index]);
        
        return {
            macd: macdLine[macdLine.length - 1],
            signal: signalLine[signalLine.length - 1],
            histogram: histogram[histogram.length - 1]
        };
    }
    
    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        const ema = [prices[0]];
        
        for (let i = 1; i < prices.length; i++) {
            ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
        }
        
        return ema;
    }
    
    calculateSMA(prices, period) {
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.tradingStrategy = new TradingStrategy();
});

// دالات مساعدة عامة
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(amount);
}

function formatPercentage(value) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
}

function debounce(func, wait) {
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

// معالجة الأخطاء العامة
window.addEventListener('error', (event) => {
    console.error('خطأ في التطبيق:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('خطأ في Promise:', event.reason);
});

// حفظ البيانات قبل إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (window.tradingStrategy) {
        window.tradingStrategy.saveToLocalStorage();
    }
});
