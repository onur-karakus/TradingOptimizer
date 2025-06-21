// project/static/js/calculations/indicators.js
// Bu dosya, tüm teknik göstergelerin tanımlarını ve hesaplama fonksiyonlarını içerir.

export const AVAILABLE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];

// --- SAF HESAPLAMA FONKSİYONLARI ---

function calculateEMA(data, settings) {
    const { period } = settings;
    const source = data.map(d => d.c);
    if (source.length < period) return [];
    let emaData = [];
    const multiplier = 2 / (period + 1);
    let sma = source.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for(let i=0; i < period - 1; i++) emaData.push({x: data[i].x, y: null});
    emaData.push({ x: data[period - 1].x, y: sma });
    for (let i = period; i < source.length; i++) {
        if(emaData[i - 1].y === null) { emaData.push({ x: data[i].x, y: null }); continue; }
        const ema = (source[i] - emaData[i - 1].y) * multiplier + emaData[i - 1].y;
        emaData.push({ x: data[i].x, y: ema });
    }
    return [{ name: `EMA (${period})`, data: emaData, type: 'line', color: '#ffc107' }];
}

function calculateBollingerBands(data, settings) {
    const { period, stdDev } = settings;
    if (data.length < period) return [];
    let middle = [], upper = [], lower = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            middle.push({x: data[i].x, y: null}); upper.push({x: data[i].x, y: null}); lower.push({x: data[i].x, y: null});
            continue;
        }
        const slice = data.slice(i - period + 1, i + 1).map(d => d.c);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const standardDeviation = Math.sqrt(slice.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / period);
        middle.push({ x: data[i].x, y: mean });
        upper.push({ x: data[i].x, y: mean + stdDev * standardDeviation });
        lower.push({ x: data[i].x, y: mean - stdDev * standardDeviation });
    }
    return [
        { name: 'BB Üst', data: upper, type: 'line', color: '#03a9f4'},
        { name: 'BB Orta', data: middle, type: 'line', color: '#e91e63' },
        { name: 'BB Alt', data: lower, type: 'line', color: '#03a9f4'}
    ];
}

function calculateRSI(data, settings) {
    const { period } = settings;
    if (data.length <= period) return [];
    let rsiData = [], avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const change = data[i].c - data[i - 1].c;
        if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
    }
    avgGain /= period; avgLoss /= period;
    for (let i = 0; i < period; i++) rsiData.push({ x: data[i].x, y: null });
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiData.push({ x: data[period].x, y: 100 - (100 / (1 + rs)) });
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].c - data[i - 1].c;
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
        rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiData.push({ x: data[i].x, y: 100 - (100 / (1 + rs)) });
    }
    return [{ name: `RSI (${period})`, data: rsiData, color: '#9c27b0' }];
}

function calculateMACD(data, settings) {
    const { fast, slow, signal } = settings;
    const emaFast = calculateEMA(data, {period: fast})[0]?.data || [];
    const emaSlow = calculateEMA(data, {period: slow})[0]?.data || [];
    const macdLine = emaSlow.map((d, i) => ({ x: d.x, c: (emaFast[i]?.y !== null && d.y !== null) ? emaFast[i].y - d.y : null }));
    const signalLineSeries = calculateEMA(macdLine.map(d => ({c: d.c})), { period: signal });
    let fullSignalLine = [];
    if (signalLineSeries && signalLineSeries.length > 0) {
        const signalLine = signalLineSeries[0].data;
        const nulls = Array(macdLine.length - signalLine.length).fill(null);
        fullSignalLine = [...nulls, ...signalLine].map((d,i) => ({x: macdLine[i].x, y: d?.y ?? null }));
    }
    const histogram = macdLine.map((d, i) => {
        const histVal = (d.c !== null && fullSignalLine[i]?.y !== null) ? d.c - fullSignalLine[i].y : null;
        return { x: d.x, y: histVal, fillColor: histVal >= 0 ? 'var(--up-color)' : 'var(--down-color)' };
    });
    return [
        { name: 'MACD', data: macdLine.map(d=>({x:d.x, y:d.c})), type: 'line', color: '#2196f3' },
        { name: 'Signal', data: fullSignalLine, type: 'line', color: '#ff9800' },
        { name: 'Histogram', data: histogram, type: 'bar' }
    ];
}

// --- GÖSTERGE TANIMLARI ---
export const INDICATORS = [
    { id: 'ema', name: 'Üstel Hareketli Ortalama (EMA)', type: 'overlay', calculation: calculateEMA, settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 20 }], description: 'Fiyatların ağırlıklı ortalamasını alarak trendi yumuşatır.' },
    { id: 'bb', name: 'Bollinger Bantları', type: 'overlay', calculation: calculateBollingerBands, settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 20 }, { id: 'stdDev', name: 'StdSapma', type: 'number', default: 2 }], description: 'Fiyatların volatilitesini ölçmek için kullanılır.' },
    { id: 'rsi', name: 'Göreceli Güç Endeksi (RSI)', type: 'pane', calculation: calculateRSI, settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 14 }], description: 'Aşırı alım ve satım bölgelerini belirler.' },
    { id: 'macd', name: 'MACD', type: 'pane', calculation: calculateMACD, settings: [ { id: 'fast', name: 'Hızlı Uzunluk', type: 'number', default: 12 }, { id: 'slow', name: 'Yavaş Uzunluk', type: 'number', default: 26 }, { id: 'signal', name: 'Sinyal Düzeltme', type: 'number', default: 9 }], description: 'Trend yönünü ve momentumu gösterir.' },
    { id: 'volume', name: 'İşlem Hacmi', type: 'pane', calculation: (data) => [{ name: 'Hacim', type: 'bar', data: data.map((p, i) => ({ x: p.x, y: p.v, fillColor: i > 0 && data[i].c >= data[i-1].c ? 'var(--up-color)' : 'var(--down-color)' })) }], settings: [], description: 'İşlem miktarını gösterir.' },
];
