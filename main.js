class TradingStrategy {
    constructor() {
        this.coins = [];
        this.isLoading = false;
        this.lastUpdate = null;
        this.updateInterval = null;
        
        // إعدادات افتراضية في حالة عدم وجود CONFIG
        this.config = this.getDefaultConfig();
        
        this.initializeApp();
    }
    
    getDefaultConfig() {
        return {
            TOP_COINS_LIMIT: 20,
            UPDATE_INTERVAL: 15 * 60 * 1000, // 15 دقيقة
            OKX_API: {
                baseURL: 'https://www.okx.com/api/v5'
            },
            INDICATORS: {
                RSI_THRESHOLD: 50
            },
            SCORING: {
                RSI_BREAKTHROUGH: 15,
                MACD_CROSSOVER: 20,
                SMA_BREAKTHROUGH: 10,
                RESISTANCE_BREAK: 25,
                LIQUIDITY_CROSS: 15,
                VOLUME_INCREASE: 10,
                TREND_STRENGTH: 20
            }
        };
    }
    
    async initializeApp() {
        console.log('🚀 بدء تشغيل استراتيجية التداول...');
        
        try {
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
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.showError('خطأ في تهيئة التطبيق');
        }
    }
    
    setupEventListeners() {
        try {
            // التحقق من وجود العناصر قبل إضافة المستمعات
            const closeModal = document.getElementById('closeModal');
            const modalOverlay = document.getElementById('modalOverlay');
            
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    this.closeModal();
                });
            }
            
            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target.id === 'modalOverlay') {
                        this.closeModal();
                    }
                });
            }
            
            // إغلاق بمفتاح ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            });
        } catch (error) {
            console.error('خطأ في إعداد مستمعات الأحداث:', error);
        }
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
                .slice(0, this.config.TOP_COINS_LIMIT);
            
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
            const response = await fetch(`${this.config.OKX_API.baseURL}/market/tickers?instType=SPOT`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.code === '0' && Array.isArray(data.data)) {
                return data.data;
            } else {
                throw new Error('فشل في جلب البيانات من OKX');
            }
        } catch (error) {
            // في حالة فشل الاتصال، استخدم بيانات تجريبية
            console.warn('استخدام بيانات تجريبية...', error.message);
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
        
        return mockCoins.map(symbol => {
            const basePrice = Math.random() * 1000 + 10;
            return {
                instId: `${symbol}-USDT`,
                last: basePrice.toFixed(4),
                lastSz: (Math.random() * 1000).toFixed(2),
                askPx: (basePrice * 1.001).toFixed(4),
                bidPx: (basePrice * 0.999).toFixed(4),
                open24h: (basePrice * (0.95 + Math.random() * 0.1)).toFixed(4),
                high24h: (basePrice * (1 + Math.random() * 0.1)).toFixed(4),
                low24h: (basePrice * (0.9 + Math.random() * 0.1)).toFixed(4),
                vol24h: (Math.random() * 10000000).toFixed(0),
                volCcy24h: (Math.random() * 100000000).toFixed(0),
                ts: Date.now().toString()
            };
        });
    }
    
    filterCoins(tickers) {
        // إعدادات ثابتة لتجنب الأخطاء
        const EXCLUDED_COINS = ['USDT', 'USDC', 'BUSD', 'DAI'];
        const MIN_PRICE = 0.000001;
        const MIN_VOLUME = 100000;
        
        if (!Array.isArray(tickers)) {
            console.error('tickers ليس مصفوفة');
            return [];
        }
        
        return tickers.filter(ticker => {
            try {
                if (!ticker || !ticker.instId) return false;
                
                const symbol = ticker.instId.split('-')[0];
                const price = parseFloat(ticker.last) || 0;
                const volume = parseFloat(ticker.volCcy24h) || 0;
                
                if (EXCLUDED_COINS.includes(symbol)) return false;
                if (!ticker.instId.endsWith('-USDT')) return false;
                if (price < MIN_PRICE) return false;
                if (volume < MIN_VOLUME) return false;
                
                return true;
            } catch (error) {
                console.log('خطأ في معالجة العملة:', error);
                return false;
            }
        });
    }
    
    async analyzeCoins(coins) {
        if (!Array.isArray(coins)) {
            console.error('coins ليس مصفوفة');
            return [];
        }
        
        const analyzedCoins = [];
        
        for (const coin of coins) {
            try {
                const analysis = await this.analyzeCoin(coin);
                if (analysis) {
                    analyzedCoins.push(analysis);
                }
            } catch (error) {
                console.log(`تخطي ${coin.instId}: ${error.message}`);
            }
        }
        
        return analyzedCoins;
    }
    
    async analyzeCoin(ticker) {
        try {
            const symbol = ticker.instId.split('-')[0];
            const currentPrice = parseFloat(ticker.last) || 0;
            const volume24h = parseFloat(ticker.volCcy24h) || 0;
            const openPrice = parseFloat(ticker.open24h) || currentPrice;
            const priceChange = openPrice !== 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;
            
            // حساب المؤشرات الفنية (محاكاة)
            const indicators = await this.calculateIndicators(ticker);
            
            // حساب النقاط
            let score = 0;
            const signals = [];
            
            // 1. RSI يخترق 50 صعوداً
            if (indicators.rsi > this.config.INDICATORS.RSI_THRESHOLD && 
                indicators.rsiPrevious <= this.config.INDICATORS.RSI_THRESHOLD) {
                score += this.config.SCORING.RSI_BREAKTHROUGH;
                signals.push({ 
                    type: 'RSI Breakthrough', 
                    value: indicators.rsi, 
                    weight: this.config.SCORING.RSI_BREAKTHROUGH 
                });
            }
            
            // 2. تقاطع MACD
            if (indicators.macdCrossover) {
                score += this.config.SCORING.MACD_CROSSOVER;
                signals.push({ 
                    type: 'MACD Crossover', 
                    value: indicators.macd, 
                    weight: this.config.SCORING.MACD_CROSSOVER 
                });
            }
            
            // 3. اختراق المتوسط المتحرك
            if (currentPrice > indicators.sma && indicators.previousPrice <= indicators.smaPrevious) {
                score += this.config.SCORING.SMA_BREAKTHROUGH;
                signals.push({ 
                    type: 'SMA Breakthrough', 
                    value: indicators.sma, 
                    weight: this.config.SCORING.SMA_BREAKTHROUGH 
                });
            }
            
            // 4. اقتراب من مستوى المقاومة
            if (indicators.nearResistance) {
                score += this.config.SCORING.RESISTANCE_BREAK;
                signals.push({ 
                    type: 'Near Resistance', 
                    value: indicators.resistance, 
                    weight: this.config.SCORING.RESISTANCE_BREAK 
                });
            }
            
            // 5. تقاطع مؤشر السيولة
            if (indicators.liquidityCross) {
                score += this.config.SCORING.LIQUIDITY_CROSS;
                signals.push({ 
                    type: 'Liquidity Cross', 
                    value: indicators.liquidity, 
                    weight: this.config.SCORING.LIQUIDITY_CROSS 
                });
            }
            
            // 6. زيادة حجم التداول
            if (indicators.volumeIncrease) {
                score += this.config.SCORING.VOLUME_INCREASE;
                signals.push({ 
                    type: 'Volume Increase', 
                    value: indicators.volumeChange, 
                    weight: this.config.SCORING.VOLUME_INCREASE 
                });
            }
            
            // 7. قوة الاتجاه
            if (indicators.trendStrength > 0.7) {
                score += this.config.SCORING.TREND_STRENGTH;
                signals.push({ 
                    type: 'Strong Trend', 
                    value: indicators.trendStrength, 
                    weight: this.config.SCORING.TREND_STRENGTH 
                });
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
        } catch (error) {
            console.error(`خطأ في تحليل ${ticker.instId}:`, error);
            return null;
        }
    }
    
    async calculateIndicators(ticker) {
        try {
            const currentPrice = parseFloat(ticker.last) || 0;
            const high24h = parseFloat(ticker.high24h) || currentPrice;
            const low24h = parseFloat(ticker.low24h) || currentPrice;
            const volume = parseFloat(ticker.vol24h) || 0;
            
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
        } catch (error) {
            console.error('خطأ في حساب المؤشرات:', error);
            return this.getDefaultIndicators();
        }
    }
    
    getDefaultIndicators() {
        return {
            rsi: 50,
            rsiPrevious: 50,
            macd: 0,
            macdSignal: 0,
            macdCrossover: false,
            sma: 0,
            smaPrevious: 0,
            previousPrice: 0,
            resistance: 0,
            support: 0,
            nearResistance: false,
            liquidity: 0,
            liquidityCross: false,
            volumeIncrease: false,
            volumeChange: 0,
            trendStrength: 0
        };
    }
    
    generateAnalysis(ticker, indicators, signals) {
        try {
            const symbol = ticker.instId.split('-')[0];
            const currentPrice = parseFloat(ticker.last) || 0;
            
            return {
                summary: this.generateSummary(signals),
                targets: this.calculateTargets(currentPrice, indicators),
                stopLoss: this.calculateStopLoss(currentPrice, indicators),
                entryPoint: this.calculateEntryPoint(currentPrice, indicators),
                riskReward: this.calculateRiskReward(currentPrice, indicators),
                timeframe: 'قصير إلى متوسط المدى (1-4 أسابيع)',
                confidence: this.calculateConfidence(signals)
            };
        } catch (error) {
            console.error('خطأ في توليد التحليل:', error);
            return this.getDefaultAnalysis();
        }
    }
    
    getDefaultAnalysis() {
        return {
            summary: 'لا توجد بيانات كافية للتحليل',
            targets: { target1: '0', target2: '0', target3: '0' },
            stopLoss: '0',
            entryPoint: { immediate: '0', dip: '0', breakout: '0' },
            riskReward: '0',
            timeframe: 'غير محدد',
            confidence: '0'
        };
    }
    
    generateSummary(signals) {
        if (!Array.isArray(signals)) return 'لا توجد إشارات';
        
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
        if (!price || price <= 0) {
            return { target1: '0', target2: '0', target3: '0' };
        }
        
        return {
            target1: (price * 1.05).toFixed(6),
            target2: (price * 1.12).toFixed(6),
            target3: (price * 1.20).toFixed(6)
        };
    }
    
    calculateStopLoss(price, indicators) {
        if (!price || price <= 0) return '0';
        return (price * 0.95).toFixed(6);
    }
    
    calculateEntryPoint(price, indicators) {
        if (!price || price <= 0) {
            return { immediate: '0', dip: '0', breakout: '0' };
        }
        
        return {
            immediate: price.toFixed(6),
            dip: (price * 0.98).toFixed(6),
            breakout: (price * 1.02).toFixed(6)
        };
    }
    
    calculateRiskReward(price, indicators) {
        if (!price || price <= 0) return '0';
        
        try {
            const target = price * 1.12;
            const stopLoss = price * 0.95;
            const risk = price - stopLoss;
            const reward = target - price;
            
            if (risk <= 0) return '0';
            return (reward / risk).toFixed(2);
        } catch (error) {
            console.error('خطأ في حساب نسبة المخاطرة/العائد:', error);
            return '0';
        }
    }
    
    calculateConfidence(signals) {
        if (!Array.isArray(signals) || signals.length === 0) return '0';
        
        try {
            const totalWeight = signals.reduce((sum, signal) => {
                return sum + (signal.weight || 0);
            }, 0);
            
            const maxPossibleWeight = Object.values(this.config.SCORING).reduce((sum, weight) => sum + weight, 0);
            
            if (maxPossibleWeight <= 0) return '0';
            return Math.min(100, (totalWeight / maxPossibleWeight) * 100).toFixed(0);
        } catch (error) {
            console.error('خطأ في حساب مستوى الثقة:', error);
            return '0';
        }
    }
    
    renderCoins() {
        const grid = document.getElementById('coinsGrid');
        if (!grid) {
            console.error('عنصر coinsGrid غير موجود');
            return;
        }
        
        grid.innerHTML = '';
        
        if (!Array.isArray(this.coins) || this.coins.length === 0) {
            grid.innerHTML = '<div class="loading-card">لا توجد عملات تحقق المعايير المطلوبة حالياً</div>';
            return;
        }
        
        this.coins.forEach((coin, index) => {
            try {
                const card = this.createCoinCard(coin, index + 1);
                if (card) {
                    grid.appendChild(card);
                }
            } catch (error) {
                console.error(`خطأ في إنشاء بطاقة العملة ${coin.symbol}:`, error);
            }
        });
    }
    
    createCoinCard(coin, rank) {
        if (!coin || !coin.symbol) {
            console.error('بيانات العملة غير صحيحة');
            return null;
        }
        
        try {
            const card = document.createElement('div');
            card.className = 'coin-card';
            card.style.animationDelay = `${(rank - 1) * 0.1}s`;
            
            const priceChange = coin.priceChange || 0;
            const priceChangeClass = priceChange >= 0 ? 'price-change' : 'price-change negative';
            const priceChangeIcon = priceChange >= 0 ? '↗' : '↘';
            
            card.innerHTML = `
                <div class="rank-badge">المركز ${rank}</div>
                <div class="coin-header">
                    <div class="coin-logo">${coin.symbol.charAt(0)}</div>
                    <div class="coin-info">
                        <h3>${coin.symbol}</h3>
                        <span class="score">${(coin.score || 0).toFixed(1)} نقطة</span>
                    </div>
                </div>
                <div class="coin-details">
                    <div class="detail-item">
                        <div class="detail-label">السعر الحالي</div>
                        <div class="detail-value">$${parseFloat(coin.price || 0).toFixed(6)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">التغيير 24س</div>
                        <div class="detail-value ${priceChangeClass}">
                            ${priceChangeIcon} ${Math.abs(priceChange).toFixed(2)}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">حجم التداول</div>
                        <div class="detail-value">$${this.formatNumber(coin.volume24h || 0)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">الإشارات</div>
                        <div class="detail-value">${(coin.signals || []).length} إشارة</div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => this.showCoinDetails(coin));
            
            return card;
        } catch (error) {
            console.error('خطأ في إنشاء بطاقة العملة:', error);
            return null;
        }
    }
    
    showCoinDetails(coin) {
        try {
            const modal = document.getElementById('modalOverlay');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            
            if (!modal || !title || !content) {
                console.error('عناصر النافذة المنبثقة غير موجودة');
                return;
            }
            
            title.textContent = `تحليل مفصل - ${coin.symbol}`;
            
            const analysis = coin.analysis || this.getDefaultAnalysis();
            const indicators = coin.indicators || this.getDefaultIndicators();
            const signals = coin.signals || [];
            
            content.innerHTML = `
                <div class="analysis-section">
                    <h3>📊 ملخص التحليل</h3>
                    <p>${analysis.summary}</p>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <div class="label">مستوى الثقة</div>
                            <div class="value">${analysis.confidence}%</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">نسبة المخاطرة/العائد</div>
                            <div class="value">1:${analysis.riskReward}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">الإطار الزمني</div>
                            <div class="value">${analysis.timeframe}</div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h3>🎯 الأهداف السعرية</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <div class="label">الهدف الأول</div>
                            <div class="value">$${analysis.targets.target1}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">الهدف الثاني</div>
                            <div class="value">$${analysis.targets.target2}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">الهدف الثالث</div>
                            <div class="value">$${analysis.targets.target3}</div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h3>📍 نقاط الدخول المقترحة</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <div class="label">دخول فوري</div>
                            <div class="value">$${analysis.entryPoint.immediate}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">عند الانخفاض</div>
                            <div class="value">$${analysis.entryPoint.dip}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">عند الاختراق</div>
                            <div class="value">$${analysis.entryPoint.breakout}</div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h3>🛡️ إدارة المخاطر</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <div class="label">وقف الخسارة</div>
                            <div class="value">$${analysis.stopLoss}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">الدعم القريب</div>
                            <div class="value">$${(indicators.support || 0).toFixed(6)}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">المقاومة القريبة</div>
                            <div class="value">$${(indicators.resistance || 0).toFixed(6)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h3>📈 الإشارات الفنية المحققة</h3>
                    ${signals.length > 0 ? signals.map(signal => `
                        <div style="margin-bottom: 10px;">
                            <span class="signal-indicator signal-buy">${signal.type}</span>
                            <span>القيمة: ${(signal.value || 0).toFixed(2)} | الوزن: ${signal.weight || 0} نقطة</span>
                        </div>
                    `).join('') : '<p>لا توجد إشارات فنية حالياً</p>'}
                </div>
                
                <div class="analysis-section">
                    <h3>🔍 المؤشرات الفنية الحالية</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <div class="label">RSI</div>
                            <div class="value">${(indicators.rsi || 0).toFixed(2)}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">MACD</div>
                            <div class="value">${(indicators.macd || 0).toFixed(4)}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">المتوسط المتحرك</div>
                            <div class="value">$${(indicators.sma || 0).toFixed(6)}</div>
                        </div>
                        <div class="analysis-item">
                            <div class="label">قوة الاتجاه</div>
                            <div class="value">${((indicators.trendStrength || 0) * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
        } catch (error) {
            console.error('خطأ في عرض تفاصيل العملة:', error);
        }
    }
    
    closeModal() {
        try {
            const modal = document.getElementById('modalOverlay');
            if (modal) {
                modal.classList.remove('active');
            }
        } catch (error) {
            console.error('خطأ في إغلاق النافذة المنبثقة:', error);
        }
    }
    
    updateStats() {
        try {
            const totalCoinsElement = document.getElementById('totalCoins');
            const qualifiedCoinsElement = document.getElementById('qualifiedCoins');
            const avgScoreElement = document.getElementById('avgScore');
            const lastUpdateElement = document.getElementById('lastUpdate');
            
            if (totalCoinsElement) {
                totalCoinsElement.textContent = this.coins.length;
            }
            
            if (qualifiedCoinsElement) {
                const qualifiedCount = this.coins.filter(coin => (coin.score || 0) >= 50).length;
                qualifiedCoinsElement.textContent = qualifiedCount;
            }
            
            if (avgScoreElement) {
                const avgScore = this.coins.length > 0 
                    ? (this.coins.reduce((sum, coin) => sum + (coin.score || 0), 0) / this.coins.length).toFixed(1)
                    : '0';
                avgScoreElement.textContent = avgScore;
            }
            
            if (lastUpdateElement && this.lastUpdate) {
                lastUpdateElement.textContent = 
                    `آخر تحديث: ${this.lastUpdate.toLocaleTimeString('ar-SA')}`;
            }
        } catch (error) {
            console.error('خطأ في تحديث الإحصائيات:', error);
        }
    }
    
    showLoading(show) {
        try {
            const indicator = document.getElementById('loadingIndicator');
            if (indicator) {
                if (show) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            }
        } catch (error) {
            console.error('خطأ في عرض مؤشر التحميل:', error);
        }
    }
    
    showError(message) {
        try {
            const grid = document.getElementById('coinsGrid');
            if (grid) {
                grid.innerHTML = `<div class="error-message">${message}</div>`;
            }
            console.error('خطأ:', message);
        } catch (error) {
            console.error('خطأ في عرض رسالة الخطأ:', error);
        }
    }
    
    formatNumber(num) {
        try {
            const number = parseFloat(num) || 0;
            if (number >= 1e9) {
                return (number / 1e9).toFixed(2) + 'B';
            } else if (number >= 1e6) {
                return (number / 1e6).toFixed(2) + 'M';
            } else if (number >= 1e3) {
                return (number / 1e3).toFixed(2) + 'K';
            }
            return number.toFixed(2);
        } catch (error) {
            console.error('خطأ في تنسيق الرقم:', error);
            return '0';
        }
    }
    
    startAutoUpdate() {
        try {
            // تحديث دوري كل 15 دقيقة
            this.updateInterval = setInterval(() => {
                console.log('🔄 تحديث تلقائي...');
                this.loadCoinsData();
            }, this.config.UPDATE_INTERVAL);
        } catch (error) {
            console.error('خطأ في بدء التحديث التلقائي:', error);
        }
    }
    
    stopAutoUpdate() {
        try {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        } catch (error) {
            console.error('خطأ في إيقاف التحديث التلقائي:', error);
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
                if (data.timestamp && Date.now() - data.timestamp < oneHour) {
                    this.coins = Array.isArray(data.coins) ? data.coins : [];
                    this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
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
        try {
            const dataToExport = {
                coins: this.coins,
                exportDate: new Date().toISOString(),
                config: this.config
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
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
        }
    }
    
    // دالة للبحث في العملات
    searchCoins(query) {
        try {
            if (!query || query.trim() === '') {
                this.renderCoins();
                return;
            }
            
            const filteredCoins = this.coins.filter(coin =>
                coin.symbol && coin.symbol.toLowerCase().includes(query.toLowerCase())
            );
            
            const grid = document.getElementById('coinsGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            if (filteredCoins.length === 0) {
                grid.innerHTML = '<div class="loading-card">لا توجد عملات تطابق البحث</div>';
                return;
            }
            
            filteredCoins.forEach((coin, index) => {
                const card = this.createCoinCard(coin, index + 1);
                if (card) {
                    grid.appendChild(card);
                }
            });
        } catch (error) {
            console.error('خطأ في البحث:', error);
        }
    }
    
    // دالة لفلترة العملات حسب النقاط
    filterByScore(minScore) {
        try {
            const score = parseFloat(minScore) || 0;
            const filteredCoins = this.coins.filter(coin => (coin.score || 0) >= score);
            
            const grid = document.getElementById('coinsGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            if (filteredCoins.length === 0) {
                grid.innerHTML = '<div class="loading-card">لا توجد عملات تحقق النقاط المطلوبة</div>';
                return;
            }
            
            filteredCoins.forEach((coin, index) => {
                const card = this.createCoinCard(coin, index + 1);
                if (card) {
                    grid.appendChild(card);
                }
            });
        } catch (error) {
            console.error('خطأ في الفلترة:', error);
        }
    }
    
    // دالة لحساب المؤشرات الفنية الحقيقية
    calculateRealRSI(prices, period = 14) {
        try {
            if (!Array.isArray(prices) || prices.length < period + 1) return null;
            
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
            
            if (avgLoss === 0) return 100;
            const rs = avgGain / avgLoss;
            return 100 - (100 / (1 + rs));
        } catch (error) {
            console.error('خطأ في حساب RSI:', error);
            return null;
        }
    }
    
    calculateRealMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        try {
            if (!Array.isArray(prices) || prices.length < slowPeriod) return null;
            
            const ema12 = this.calculateEMA(prices, fastPeriod);
            const ema26 = this.calculateEMA(prices, slowPeriod);
            
            if (!ema12 || !ema26) return null;
            
            const macdLine = ema12.map((value, index) => value - ema26[index]);
            const signalLine = this.calculateEMA(macdLine, signalPeriod);
            
            if (!signalLine) return null;
            
            const histogram = macdLine.map((value, index) => value - signalLine[index]);
            
            return {
                macd: macdLine[macdLine.length - 1],
                signal: signalLine[signalLine.length - 1],
                histogram: histogram[histogram.length - 1]
            };
        } catch (error) {
            console.error('خطأ في حساب MACD:', error);
            return null;
        }
    }
    
    calculateEMA(prices, period) {
        try {
            if (!Array.isArray(prices) || prices.length === 0) return null;
            
            const multiplier = 2 / (period + 1);
            const ema = [prices[0]];
            
            for (let i = 1; i < prices.length; i++) {
                ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
            }
            
            return ema;
        } catch (error) {
            console.error('خطأ في حساب EMA:', error);
            return null;
        }
    }
    
    calculateSMA(prices, period) {
        try {
            if (!Array.isArray(prices) || prices.length < period) return null;
            
            const sma = [];
            for (let i = period - 1; i < prices.length; i++) {
                const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                sma.push(sum / period);
            }
            return sma;
        } catch (error) {
            console.error('خطأ في حساب SMA:', error);
            return null;
        }
    }
    
    // دالة لتنظيف الموارد
    cleanup() {
        try {
            this.stopAutoUpdate();
            this.saveToLocalStorage();
        } catch (error) {
            console.error('خطأ في تنظيف الموارد:', error);
        }
    }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.tradingStrategy = new TradingStrategy();
    } catch (error) {
        console.error('خطأ في تشغيل التطبيق:', error);
    }
});

// دالات مساعدة عامة
function formatCurrency(amount, currency = 'USD') {
    try {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(amount || 0);
    } catch (error) {
        console.error('خطأ في تنسيق العملة:', error);
        return `${amount || 0} ${currency}`;
    }
}

function formatPercentage(value) {
    try {
        return new Intl.NumberFormat('ar-SA', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format((value || 0) / 100);
    } catch (error) {
        console.error('خطأ في تنسيق النسبة المئوية:', error);
        return `${value || 0}%`;
    }
}

function formatDate(date) {
    try {
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ:', error);
        return new Date(date).toLocaleString('ar-SA');
    }
}

// دالة لإضافة مستمعي الأحداث
function setupEventListeners() {
    try {
        // إغلاق النافذة المنبثقة
        const modalOverlay = document.getElementById('modalOverlay');
        const closeModal = document.getElementById('closeModal');
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    window.tradingStrategy?.closeModal();
                }
            });
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                window.tradingStrategy?.closeModal();
            });
        }
        
        // زر التحديث
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                window.tradingStrategy?.loadCoinsData();
            });
        }
        
        // زر التصدير
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                window.tradingStrategy?.exportData();
            });
        }
        
        // حقل البحث
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                window.tradingStrategy?.searchCoins(e.target.value);
            });
        }
        
        // فلتر النقاط
        const scoreFilter = document.getElementById('scoreFilter');
        if (scoreFilter) {
            scoreFilter.addEventListener('change', (e) => {
                window.tradingStrategy?.filterByScore(e.target.value);
            });
        }
        
        // مفتاح ESC لإغلاق النافذة المنبثقة
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.tradingStrategy?.closeModal();
            }
        });
        
        // تنظيف الموارد عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            window.tradingStrategy?.cleanup();
        });
        
    } catch (error) {
        console.error('خطأ في إعداد مستمعي الأحداث:', error);
    }
}

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', setupEventListeners);

// دالة لإنشاء إشعارات
function showNotification(message, type = 'info') {
    try {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // إضافة الإشعار إلى الصفحة
        document.body.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوان
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
    } catch (error) {
        console.error('خطأ في عرض الإشعار:', error);
    }
}

// دالة لحفظ الإعدادات
function saveSettings(settings) {
    try {
        localStorage.setItem('tradingStrategySettings', JSON.stringify(settings));
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showNotification('فشل في حفظ الإعدادات', 'error');
    }
}

// دالة لتحميل الإعدادات
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('tradingStrategySettings');
        return savedSettings ? JSON.parse(savedSettings) : null;
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        return null;
    }
}

// دالة للتحقق من اتصال الإنترنت
function checkInternetConnection() {
    return navigator.onLine;
}

// دالة لإعادة المحاولة مع التأخير
async function retryWithDelay(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
}

// دالة لتحليل الأداء
function analyzePerformance() {
    try {
        const performance = window.performance;
        const timing = performance.timing;
        
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        const renderTime = timing.domComplete - timing.domLoading;
        
        console.log('📊 تحليل الأداء:');
        console.log(`⏱️ وقت التحميل الكامل: ${loadTime}ms`);
        console.log(`🏗️ وقت جاهزية DOM: ${domReadyTime}ms`);
        console.log(`🎨 وقت الرندر: ${renderTime}ms`);
        
        return {
            loadTime,
            domReadyTime,
            renderTime
        };
    } catch (error) {
        console.error('خطأ في تحليل الأداء:', error);
        return null;
    }
}

// دالة لمراقبة استخدام الذاكرة
function monitorMemoryUsage() {
    try {
        if ('memory' in performance) {
            const memory = performance.memory;
            console.log('💾 استخدام الذاكرة:');
            console.log(`📈 المستخدم: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`📊 المخصص: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`🔒 الحد الأقصى: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
            
            return {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            };
        }
    } catch (error) {
        console.error('خطأ في مراقبة الذاكرة:', error);
    }
    return null;
}

// دالة للتحقق من دعم المتصفح للميزات المطلوبة
function checkBrowserSupport() {
    const features = {
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        es6: typeof Symbol !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        notifications: 'Notification' in window
    };
    
    console.log('🌐 دعم المتصفح للميزات:');
    Object.entries(features).forEach(([feature, supported]) => {
        console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported ? 'مدعوم' : 'غير مدعوم'}`);
    });
    
    return features;
}

// دالة لتسجيل الأخطاء
function logError(error, context = '') {
    try {
        const errorInfo = {
            message: error.message || 'خطأ غير معروف',
            stack: error.stack || 'لا توجد معلومات إضافية',
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('🚨 تسجيل خطأ:', errorInfo);
        
        // حفظ الخطأ في التخزين المحلي للمراجعة لاحقاً
        const errors = JSON.parse(localStorage.getItem('tradingStrategyErrors') || '[]');
        errors.push(errorInfo);
        
        // الاحتفاظ بآخر 50 خطأ فقط
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        localStorage.setItem('tradingStrategyErrors', JSON.stringify(errors));
        
    } catch (logError) {
        console.error('خطأ في تسجيل الخطأ:', logError);
    }
}

// دالة لمسح سجل الأخطاء
function clearErrorLog() {
    try {
        localStorage.removeItem('tradingStrategyErrors');
        showNotification('تم مسح سجل الأخطاء', 'success');
    } catch (error) {
        console.error('خطأ في مسح سجل الأخطاء:', error);
    }
}

// دالة لعرض سجل الأخطاء
function showErrorLog() {
    try {
        const errors = JSON.parse(localStorage.getItem('tradingStrategyErrors') || '[]');
        console.log('📋 سجل الأخطاء:', errors);
        return errors;
    } catch (error) {
        console.error('خطأ في عرض سجل الأخطاء:', error);
        return [];
    }
}

// إعداد معالج الأخطاء العام
window.addEventListener('error', (event) => {
    logError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason), 'Unhandled Promise Rejection');
});

// تشغيل فحوصات الأداء والدعم عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        analyzePerformance();
        monitorMemoryUsage();
        checkBrowserSupport();
    }, 1000);
});

// تصدير الدالات للاستخدام العام
window.TradingStrategyUtils = {
    formatCurrency,
    formatPercentage,
    formatDate,
    showNotification,
    saveSettings,
    loadSettings,
    checkInternetConnection,
    retryWithDelay,
    analyzePerformance,
    monitorMemoryUsage,
    checkBrowserSupport,
    logError,
    clearErrorLog,
    showErrorLog
};

console.log('✅ تم تحميل نظام استراتيجية التداول بنجاح');
