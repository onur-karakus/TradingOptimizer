// project/static/js/calculations/utils.js
export function calculateEMA(data, settings) {
    const { period } = settings;
    const source = data.map(d => d.c ?? d.y); 
    if (source.filter(v => v != null).length < period) return data.map(d => ({x: d.x, y: null}));
    
    let emaData = [];
    const multiplier = 2 / (period + 1);

    const firstValidIndex = source.findIndex(v => v != null);
    if(firstValidIndex === -1 || firstValidIndex + period > source.length) return data.map(d => ({x: d.x, y: null}));

    let sma = 0;
    for(let i = firstValidIndex; i < firstValidIndex + period; i++) {
        sma += source[i];
    }
    sma /= period;

    for (let i = 0; i < data.length; i++) {
        if (i < firstValidIndex + period -1 || source[i] == null) {
            emaData.push({ x: data[i].x, y: null });
            continue;
        }
        
        if (i === firstValidIndex + period - 1) {
             emaData.push({ x: data[i].x, y: sma });
             continue;
        }

        const prevEma = emaData[i - 1].y;
        if(prevEma === null) {
            emaData.push({ x: data[i].x, y: null });
            continue;
        }
       
        const ema = (source[i] - prevEma) * multiplier + prevEma;
        emaData.push({ x: data[i].x, y: ema });
    }
    return emaData;
}
