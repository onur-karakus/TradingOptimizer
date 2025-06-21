// project/static/js/calculations/indicators/bollingerBands.js
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

export const bollingerBands = { 
    id: 'bb', 
    name: 'Bollinger Bantları', 
    type: 'overlay', 
    calculation: calculateBollingerBands, 
    settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 20 }, { id: 'stdDev', name: 'StdSapma', type: 'number', default: 2 }], 
    description: 'Fiyatların volatilitesini ölçmek için kullanılır.' 
};
