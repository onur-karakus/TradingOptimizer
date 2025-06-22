// project/static/js/api.js
const API_BASE_URL = '/api';

async function fetchData(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}/${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    
    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `API Hatası: ${response.status}` }));
            throw new Error(errorData.error);
        }
        return await response.json();
    } catch (error) {
        console.error(`${endpoint} verisi çekme hatası:`, error);
        throw error;
    }
}

export function fetchKlineData(symbol, interval) {
    return fetchData('klines', { symbol, interval, limit: 1000 });
}

export function fetchLatestKline(symbol, interval) {
    return fetchData('latest_kline', { symbol, interval }).catch(() => null);
}

export function fetchTickerData(symbols) {
    if (!symbols || symbols.length === 0) return Promise.resolve({});
    return fetchData('ticker', { symbols: symbols.join(',') });
}
