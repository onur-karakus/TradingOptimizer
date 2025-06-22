// project/static/js/app.js
import { initializeUI, showLoader, hideLoader, updateWatchlist, updateActiveIndicatorTags, updatePairHeader } from './ui.js';
import { initializeCharts, updateAllCharts, updateLiveCharts } from './chart.js';
import { getState, setSymbol, setInterval as setStateInterval, getWatchlistSymbols, updateLastKlineData } from './state.js';
import { fetchKlineData, fetchTickerData, fetchLatestKline } from './api.js';

let dynamicUpdateIntervalId = null;

async function loadChartData(symbol, interval, resetZoom = false) {
    showLoader();
    try {
        const klineData = await fetchKlineData(symbol, interval);
        updateAllCharts(klineData, resetZoom);
    } catch (error) {
        console.error("Grafik verisi yüklenirken hata oluştu:", error);
    } finally {
        hideLoader();
    }
}

function stopDynamicUpdates() {
    if (dynamicUpdateIntervalId) {
        clearInterval(dynamicUpdateIntervalId);
        dynamicUpdateIntervalId = null;
    }
}

function startDynamicUpdates() {
    stopDynamicUpdates(); 

    const updateTick = async () => {
        const { currentSymbol, currentInterval } = getState();
        const latestKline = await fetchLatestKline(currentSymbol, currentInterval);
        
        if (latestKline) {
            const dataWasUpdated = updateLastKlineData(latestKline);
            if (dataWasUpdated) {
                updateLiveCharts();
            }
        }
    };
    
    dynamicUpdateIntervalId = setInterval(updateTick, 3000);
}


async function refreshWatchlist() {
    const symbols = getWatchlistSymbols();
    if (symbols.length === 0) return;
    try {
        const tickerData = await fetchTickerData(symbols);
        updateWatchlist(tickerData);
    } catch (error) {
        console.error("İzleme listesi güncellenirken hata oluştu:", error);
    }
}

function init() {
    initializeUI({
        onSymbolChange: (newSymbol) => {
            setSymbol(newSymbol);
            updatePairHeader();
            const { currentInterval } = getState();
            loadChartData(newSymbol, currentInterval, false).then(startDynamicUpdates);
        },
        onIntervalChange: (newInterval) => {
            setStateInterval(newInterval);
            const { currentSymbol } = getState();
            loadChartData(currentSymbol, newInterval, true).then(startDynamicUpdates);
        },
        onIndicatorChange: () => {
            updateAllCharts(null, false);
            updateActiveIndicatorTags();
        }
    });

    initializeCharts({ stopUpdates: stopDynamicUpdates, startUpdates: startDynamicUpdates });

    const { currentSymbol, currentInterval } = getState();
    loadChartData(currentSymbol, currentInterval, true).then(startDynamicUpdates);
    
    refreshWatchlist();
    setInterval(refreshWatchlist, 5000);

    lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", init);
