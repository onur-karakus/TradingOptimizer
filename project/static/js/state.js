// project/static/js/state.js
import { INDICATORS, AVAILABLE_SYMBOLS } from './calculations/index.js';

const state = {
    currentSymbol: 'BTCUSDT',
    currentInterval: '1h',
    activeOverlays: [],
    activePaneIndicator: null,
    availableSymbols: AVAILABLE_SYMBOLS,
    allIndicators: INDICATORS,
    klineData: []
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
        state.klineData.push(latestKline);
        // Grafiğin sürekli sola kaymasını önlemek için baştan bir veri silinir.
        // Bu, uzun süreli çalışmalarda belleğin dolmasını engeller.
        state.klineData.shift(); 
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
    // Eğer zaten bir panel göstergesi varsa, onu kaldır.
    if(state.activePaneIndicator) {
        removeIndicator(state.activePaneIndicator.instanceId);
    }
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

export function setKlineData(apiData) {
    if (!apiData || apiData.length === 0) {
        state.klineData = [];
        return;
    }
    state.klineData = apiData.map(k => ({ 
        x: k.x, 
        o: k.o, 
        h: k.h, 
        l: k.l, 
        c: k.c,
        v: k.v
    }));
}
