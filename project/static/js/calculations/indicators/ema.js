// project/static/js/calculations/indicators/ema.js
import { calculateEMA as calculateEmaSeries } from '../utils.js';

function calculateEMA(data, settings) {
    const emaData = calculateEmaSeries(data, settings);
    return [{ name: `EMA (${settings.period})`, data: emaData, type: 'line', color: '#ffc107' }];
}

export const ema = { 
    id: 'ema', 
    name: 'Üstel Hareketli Ortalama (EMA)', 
    type: 'overlay', 
    calculation: calculateEMA, 
    settings: [{ id: 'period', name: 'Uzunluk', type: 'number', default: 20 }], 
    description: 'Fiyatların ağırlıklı ortalamasını alarak trendi yumuşatır.' 
};
