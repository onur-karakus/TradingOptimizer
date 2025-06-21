// project/static/js/calculations/utils.js
// Birden fazla indikatör tarafından kullanılan yardımcı hesaplama fonksiyonları.

/**
 * Üstel Hareketli Ortalama (EMA) hesaplar.
 * Null değerleri atlayarak daha sağlam bir hesaplama yapar.
 * @param {Array} data - Mum verisi dizisi veya {x, c} nesneleri. 'c' veya 'y' hesaplama için kaynak olarak kullanılır.
 * @param {Object} settings - Ayarlar (örn: { period: 20 }).
 * @returns {Array} {x, y} formatında EMA verisi.
 */
export function calculateEMA(data, settings) {
    const { period } = settings;
    // Kaynak olarak kapanış (c) veya zaten hesaplanmış bir değeri (y) kullan.
    const source = data.map(d => d.c ?? d.y); 
    if (source.filter(v => v != null).length < period) return data.map(d => ({x: d.x, y: null}));
    
    let emaData = [];
    const multiplier = 2 / (period + 1);

    // Başlangıç SMA'sını null olmayan değerler üzerinden hesapla
    const initialSlice = source.slice(0, period);
    const validInitialValues = initialSlice.filter(v => v != null);
    let sma = validInitialValues.reduce((a, b) => a + b, 0) / validInitialValues.length;

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1 || source[i] == null) {
            emaData.push({ x: data[i].x, y: null });
            continue;
        }
        
        // İlk EMA değerini SMA olarak ata
        if (emaData.filter(e => e.y != null).length === 0) {
             emaData.push({ x: data[i].x, y: sma });
             continue;
        }

        const prevEma = emaData[i - 1].y;
        if (prevEma === null) {
            // Eğer bir önceki EMA null ise, hesaplamaya devam etmek için en son geçerli EMA'yı bul.
            let lastValidEma = null;
            for(let j = i - 1; j >= 0; j--) {
                if(emaData[j].y !== null) {
                    lastValidEma = emaData[j].y;
                    break;
                }
            }
            // Eğer hala geçerli bir EMA yoksa (çok nadir bir durum), null ata.
            if (lastValidEma === null) {
                 emaData.push({ x: data[i].x, y: null });
                 continue;
            }
            const ema = (source[i] - lastValidEma) * multiplier + lastValidEma;
            emaData.push({ x: data[i].x, y: ema });
        } else {
             const ema = (source[i] - prevEma) * multiplier + prevEma;
             emaData.push({ x: data[i].x, y: ema });
        }
    }
    return emaData;
}
