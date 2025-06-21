// project/static/js/api.js
// Bu modül, backend ile olan tüm ağ isteklerini yönetir.

const API_BASE_URL = '/api';

export async function fetchKlineData(symbol, interval) {
    const url = new URL(`${API_BASE_URL}/data`, window.location.origin);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Hatası: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Mum verisi çekme hatası:", error);
        throw error;
    }
}

// --- YENİ FONKSİYON ---
export async function fetchLatestKline(symbol, interval) {
    const url = new URL(`${API_BASE_URL}/latest_kline`, window.location.origin);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error(`Latest kline API Hatası: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("En son mum verisi çekme hatası:", error);
        return null;
    }
}

export async function fetchTickerData(symbols) {
    if (!symbols || symbols.length === 0) return {};
    
    const url = new URL(`${API_BASE_URL}/ticker`, window.location.origin);
    url.searchParams.set('symbols', symbols.join(','));

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ticker API Hatası: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Ticker verisi çekme hatası:", error);
        throw error;
    }
}
