// project/static/js/calculations/indicators/atr.js
import { calculateEMA } from '../utils.js';

// Bu fonksiyon hem ATR indikatörü hem de ADX hesaplaması için kullanılır.
export function calculateTrueRange(data) {
    let trValues = [{x: data[0].x, c: data[0].h - data[0].l}];
    for (let i = 1; i < data.length; i++) {
        const tr = Math.max(data[i].h - data[i].l, Math.abs(data[i].h - data[i - 1].c), Math.abs(data[i].l - data[i - 1].c));
        trValues.push({x: data[i].x, c: tr});
    }
    return trValues;
}

function calculateATR(data, settings) {
    const { period } = settings;
    if (data.length <= period) return [];
    
    const trValues = calculateTrueRange(data);
    const atrResult = calculateEMA(trValues, {period: period});
    return [{ name: `ATR (${period})`, data: atrResult, color: '#00bcd4' }];
}

export const atr = {
    id: 'atr', 
    name: 'Ortalama Gerçek Aralık (ATR)', 
    type: 'pane', 
    calculation: calculateATR, 
    settings: [{id: 'period', name: 'Uzunluk', type: 'number', default: 14}], 
    description: 'Piyasa volatilitesini ölçer.' 
};
