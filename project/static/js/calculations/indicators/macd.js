// project/static/js/calculations/indicators/macd.js
import { calculateEMA } from '../utils.js';

function calculateMACD(data, settings) {
    const { fast, slow, signal } = settings;
    
    const emaFast = calculateEMA(data, {period: fast});
    const emaSlow = calculateEMA(data, {period: slow});
    
    const macdLine = data.map((d, i) => ({ 
        x: d.x, 
        y: (emaFast[i]?.y !== null && emaSlow[i]?.y !== null) ? emaFast[i].y - emaSlow[i].y : null 
    }));
    
    const signalLine = calculateEMA(macdLine.map(d => ({c: d.y, x: d.x})), { period: signal });

    const histogram = macdLine.map((d, i) => {
        const histVal = (d.y !== null && signalLine[i]?.y !== null) ? d.y - signalLine[i].y : null;
        return { x: d.x, y: histVal, color: histVal >= 0 ? 'var(--up-color)' : 'var(--down-color)' };
    });

    return [
        { name: 'MACD', data: macdLine, type: 'line', color: '#2196f3' },
        { name: 'Signal', data: signalLine, type: 'line', color: '#ff9800' },
        { name: 'Histogram', data: histogram, type: 'bar' }
    ];
}

export const macd = { 
    id: 'macd', 
    name: 'MACD', 
    type: 'pane', 
    calculation: calculateMACD, 
    settings: [ { id: 'fast', name: 'Hızlı Uzunluk', type: 'number', default: 12 }, { id: 'slow', name: 'Yavaş Uzunluk', type: 'number', default: 26 }, { id: 'signal', name: 'Sinyal Düzeltme', type: 'number', default: 9 }], 
    description: 'Trend yönünü ve momentumu gösterir.' 
};
