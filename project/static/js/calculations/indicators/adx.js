// project/static/js/calculations/indicators/adx.js
import { calculateEMA } from '../utils.js';
import { calculateTrueRange } from './atr.js';

function calculateADX(data, settings) {
    const { period } = settings;
    if (data.length < period * 2) return [];

    let plusDM = [{x: data[0].x, c: 0}];
    let minusDM = [{x: data[0].x, c: 0}];

    for (let i = 1; i < data.length; i++) {
        let upMove = data[i].h - data[i-1].h;
        let downMove = data[i-1].l - data[i].l;
        plusDM.push({x: data[i].x, c: (upMove > downMove && upMove > 0) ? upMove : 0});
        minusDM.push({x: data[i].x, c: (downMove > upMove && downMove > 0) ? downMove : 0});
    }
    
    const tr = calculateEMA(calculateTrueRange(data), {period});
    const smoothedPlusDM = calculateEMA(plusDM, {period});
    const smoothedMinusDM = calculateEMA(minusDM, {period});
    
    let plusDI = [], minusDI = [], dx = [];

    for (let i = 0; i < data.length; i++) {
        const trVal = tr[i]?.y;
        const pDI = (trVal && smoothedPlusDM[i]?.y) ? (smoothedPlusDM[i].y / trVal) * 100 : null;
        const mDI = (trVal && smoothedMinusDM[i]?.y) ? (smoothedMinusDM[i].y / trVal) * 100 : null;
        plusDI.push({x: data[i].x, y: pDI});
        minusDI.push({x: data[i].x, y: mDI});

        const dxVal = (pDI !== null && mDI !== null && (pDI + mDI) !== 0) ? (Math.abs(pDI - mDI) / (pDI + mDI)) * 100 : null;
        dx.push({x: data[i].x, c: dxVal});
    }
    
    const adx = calculateEMA(dx, {period: period});
    return [
        {name: `ADX (${period})`, data: adx, color: '#e91e63'},
        {name: `+DI (${period})`, data: plusDI, color: '#4caf50'},
        {name: `-DI (${period})`, data: minusDI, color: '#f44336'},
    ];
}

export const adx = {
    id: 'adx', 
    name: 'Ortalama Yönsel Endeks (ADX)', 
    type: 'pane', 
    calculation: calculateADX, 
    settings: [{id: 'period', name: 'Uzunluk', type: 'number', default: 14}], 
    description: 'Trendin gücünü ölçer, yönünü değil.'
};
