// project/static/js/calculations/indicators/stochastic.js
import { calculateEMA } from '../utils.js';

function calculateStochastic(data, settings) {
    const { kPeriod, dPeriod } = settings;
    let kLine = [];
    
    for (let i = 0; i < data.length; i++) {
        if (i < kPeriod - 1) { 
            kLine.push({x: data[i].x, y: null});
            continue; 
        }
        const slice = data.slice(i - kPeriod + 1, i + 1);
        const low_k = Math.min(...slice.map(d => d.l));
        const high_k = Math.max(...slice.map(d => d.h));
        const kValue = 100 * ((data[i].c - low_k) / (high_k - low_k || 1));
        kLine.push({ x: data[i].x, y: kValue });
    }
    
    const dLine = calculateEMA(kLine.map(d => ({c: d.y, x: d.x})), {period: dPeriod});

    return [ 
        { name: '%K', data: kLine, color: '#2196f3' }, 
        { name: '%D', data: dLine, color: '#ff9800' } 
    ];
}

export const stochastic = {
    id: 'stochastic', 
    name: 'Stokastik Osilatör', 
    type: 'pane', 
    calculation: calculateStochastic, 
    settings: [{id: 'kPeriod', name: '%K Periyodu', type: 'number', default: 14}, {id: 'dPeriod', name: '%D Periyodu', type: 'number', default: 3}], 
    description: 'Kapanış fiyatının belirli bir periyottaki fiyat aralığına göre konumunu ölçer.'
};
