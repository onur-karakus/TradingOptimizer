// project/static/js/state.js
// Bu modül, uygulamanın tüm paylaşılan durumunu (state) yönetir.

import { INDICATORS, AVAILABLE_SYMBOLS } from './calculations/index.js';

const state = {
    currentSymbol: 'BTCUSDT',
    currentInterval: '1h',
    activeOverlays: [],
    activePaneIndicator: null,
    availableSymbols: AVAILABLE_SYMBOLS,
    allIndicators: INDICATORS,
    klineData: [] // Grafik verisinin tek ve doğru kaynağı
};

export function getState() {
    return { ...state };
}

export function setSymbol(newSymbol) {
    if (state.availableSymbols.includes(newSymbol)) {
        state.currentSymbol = newSymbol;
    }
}

export function setInterval(newInterval) {
    state.currentInterval = newInterval;
}

/**
 * Gelen en son fiyat verisine göre state'deki mum dizisini günceller.
 * @param {Object} latestKline - /api/latest_kline'dan gelen veri.
 * @returns {boolean} Verinin güncellenip güncellenmediğini döndürür.
 */
export function updateLastKlineData(latestKline) {
    if (!latestKline || !state.klineData || state.klineData.length === 0) {
        return false;
    }
    
    const lastPoint = state.klineData[state.klineData.length - 1];

    if (latestKline.x === lastPoint.x) {
        lastPoint.h = Math.max(lastPoint.h, latestKline.h);
        lastPoint.l = Math.min(lastPoint.l, latestKline.l);
        lastPoint.c = latestKline.c;
        lastPoint.v = latestKline.v;
        return true;
    } 
    else if (latestKline.x > lastPoint.x) {
        // --- ANA DÜZELTME ---
        // Yeni bir mum oluştuğunda sadece sona ekle.
        // En eski mumu silen .shift() komutu kaldırıldı.
        // Bu, grafik güncellendiğinde geçmiş verilerin kaybolmasını önler.
        state.klineData.push(latestKline);
        return true;
    }
    
    return false;
}

export function addOverlayIndicator(indicatorId) {
    const definition = state.allIndicators.find(i => i.id === indicatorId);
    if (!definition || definition.type !== 'overlay') return;
    const settings = {};
    definition.settings?.forEach(s => { settings[s.id] = s.default; });
    state.activeOverlays.push({ instanceId: `${definition.id}_${Date.now()}`, definition: definition, settings: settings });
}

export function setPaneIndicator(indicatorId) {
    const definition = state.allIndicators.find(i => i.id === indicatorId);
    if (!definition || definition.type !== 'pane') return;
    const settings = {};
    definition.settings?.forEach(s => { settings[s.id] = s.default; });
    state.activePaneIndicator = { instanceId: `${definition.id}_${Date.now()}`, definition: definition, settings: settings };
}

export function removeIndicator(instanceId) {
    state.activeOverlays = state.activeOverlays.filter(o => o.instanceId !== instanceId);
    if (state.activePaneIndicator?.instanceId === instanceId) {
        state.activePaneIndicator = null;
    }
}

export function updateIndicatorSettings(instanceId, newSettings) {
    const indicator = [...state.activeOverlays, state.activePaneIndicator].find(i => i?.instanceId === instanceId);
    if (indicator) {
        indicator.settings = { ...indicator.settings, ...newSettings };
    }
}

export function getWatchlistSymbols() {
    return state.availableSymbols;
}

export function setKlineData(rawData) {
    if (!rawData || rawData.length === 0) {
        state.klineData = [];
        return [];
    }
    const parsedData = rawData.map(k => ({ 
        x: k[0], o: parseFloat(k[1]), h: parseFloat(k[2]), 
        l: parseFloat(k[3]), c: parseFloat(k[4]), v: parseFloat(k[5])
    }));
    state.klineData = parsedData;
    return parsedData;
}
