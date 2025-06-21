// project/static/js/calculations/indicators/volume.js
function calculateVolume(data) {
    return [{ 
        name: 'Hacim', 
        type: 'bar', 
        data: data.map((p, i) => ({ 
            x: p.x, 
            y: p.v, 
            color: i > 0 && data[i].c >= data[i-1].c ? 'var(--up-color)' : 'var(--down-color)' 
        })) 
    }];
}

export const volume = {
    id: 'volume', 
    name: 'İşlem Hacmi', 
    type: 'pane', 
    calculation: calculateVolume, 
    settings: [], 
    description: 'Belirli bir zaman aralığındaki toplam işlem miktarını gösterir.' 
};
