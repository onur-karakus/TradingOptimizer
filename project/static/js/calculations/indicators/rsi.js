// project/static/js/calculations/indicators/rsi.js
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

export const rsi = { 
    id: 'rsi', 
    name: 'Göreceli Güç Endeksi (RSI)', 
    type: 'pane', 
    calculation: calculateRSI, 
    settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 14 }], 
    description: 'Aşırı alım ve satım bölgelerini belirler.' 
};
