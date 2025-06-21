// project/static/js/app.js
// Bu dosya, frontend uygulamasının ana giriş noktasıdır.

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

// --- ANA DÜZELTME: GÜNCELLEME KONTROL FONKSİYONLARI ---

// Canlı güncellemeleri durduran fonksiyon.
function stopDynamicUpdates() {
    if (dynamicUpdateIntervalId) {
        clearInterval(dynamicUpdateIntervalId);
        dynamicUpdateIntervalId = null;
        console.log("Live updates stopped by user interaction.");
    }
}

// Canlı güncellemeleri başlatan (veya yeniden başlatan) fonksiyon.
function startDynamicUpdates() {
    stopDynamicUpdates(); // Önceki döngüyü her zaman temizle

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
    
    console.log("Live updates started.");
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
            // Sembol değiştiğinde zoom'u koru ve güncellemeleri yeniden başlat.
            loadChartData(newSymbol, currentInterval, false).then(startDynamicUpdates);
        },
        onIntervalChange: (newInterval) => {
            setStateInterval(newInterval);
            const { currentSymbol } = getState();
            // Zaman aralığı değiştiğinde zoom'u sıfırla ve güncellemeleri yeniden başlat.
            loadChartData(currentSymbol, newInterval, true).then(startDynamicUpdates);
        },
        onIndicatorChange: () => {
            updateAllCharts(null, false);
            updateActiveIndicatorTags();
        }
    });

    // Güncelleme kontrol fonksiyonlarını chart.js'e gönder.
    initializeCharts({ stopUpdates: stopDynamicUpdates, startUpdates: startDynamicUpdates });

    const { currentSymbol, currentInterval } = getState();
    loadChartData(currentSymbol, currentInterval, true).then(startDynamicUpdates);
    
    refreshWatchlist();
    setInterval(refreshWatchlist, 5000);

    lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", init);
