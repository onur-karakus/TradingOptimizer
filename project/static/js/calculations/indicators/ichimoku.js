// project/static/js/calculations/indicators/ichimoku.js
function calculateIchimoku(data, settings) {
    const { tenkanP, kijunP, senkouBP } = settings;
    const displacement = kijunP;
    
    const high = data.map(d => d.h);
    const low = data.map(d => d.l);
    
    const getMinMax = (arr, start, end) => ({
        min: Math.min(...arr.slice(start, end)),
        max: Math.max(...arr.slice(start, end)),
    });

    let tenkan = [], kijun = [], senkouA = [], senkouB = [], chikou = [];

    for (let i = 0; i < data.length; i++) {
        // Tenkan Sen
        if (i >= tenkanP - 1) { const {min, max} = getMinMax(low.slice(0, i+1), i - tenkanP + 1, i + 1); tenkan.push({ x: data[i].x, y: (min + max) / 2 }); } 
        else { tenkan.push({x:data[i].x, y: null}); }

        // Kijun Sen
        if (i >= kijunP - 1) { const {min, max} = getMinMax(low.slice(0, i+1), i - kijunP + 1, i + 1); kijun.push({ x: data[i].x, y: (min + max) / 2 }); } 
        else { kijun.push({x:data[i].x, y: null}); }
        
        // Senkou Span B (geleceğe kaydırılır)
        if (i >= senkouBP - 1) { const {min, max} = getMinMax(low.slice(0, i+1), i - senkouBP + 1, i + 1); senkouB.push({x: data[i + displacement]?.x, y: (min + max) / 2}); }
        
        // Chikou Span (geçmişe kaydırılır)
        if(data[i-displacement]){
             chikou.push({x: data[i-displacement].x, y: data[i].c});
        }
    }

    // Senkou Span A (geleceğe kaydırılır)
    for(let i=0; i<data.length; i++) {
        if(tenkan[i]?.y !== null && kijun[i]?.y !== null && data[i + displacement]) { 
            senkouA.push({x: data[i + displacement].x, y: (tenkan[i].y + kijun[i].y) / 2}); 
        }
    }

    const kumoData = senkouA.map((d, i) => (d.y !== null && senkouB[i]?.y !== null) ? { x: d.x, y: [d.y, senkouB[i].y] } : {x: d.x, y: []});

    return [
        { name: 'Tenkan', data: tenkan, type: 'line', color: '#03a9f4' },
        { name: 'Kijun', data: kijun, type: 'line', color: '#e91e63' },
        { name: 'Chikou', data: chikou, type: 'line', color: '#4caf50' },
        { name: 'Kumo', data: kumoData, type: 'rangeArea', color: '#e91e63', fill: { opacity: 0.1 }, stroke: { width: 0 }, zIndex: 0 },
    ];
}

export const ichimoku = {
    id: 'ichimoku', 
    name: 'Ichimoku Bulutu', 
    type: 'overlay', 
    calculation: calculateIchimoku, 
    settings: [ {id: 'tenkanP', name: 'Tenkan', type: 'number', default: 9}, {id: 'kijunP', name: 'Kijun', type: 'number', default: 26}, {id: 'senkouBP', name: 'Senkou B', type: 'number', default: 52}], 
    description: 'Trend, momentum ve destek/direnç seviyelerini bir arada gösterir.'
};
