// project/static/js/chart.js
import { getState, setKlineData } from './state.js';

let mainChart, secondaryChart;
let chartCallbacks = {};

const mainChartOptions = {
    series: [],
    chart: {
        type: 'candlestick',
        height: '100%',
        id: 'mainChart',
        group: 'tradingCharts',
        background: 'transparent',
        animations: { enabled: false },
        toolbar: { show: true, tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
        events: {
            zoomed: (chartContext, { xaxis }) => {
                chartCallbacks.stopUpdates();
            },
            panned: (chartContext, { xaxis }) => {
                chartCallbacks.stopUpdates();
            },
            reset: () => {
                chartCallbacks.startUpdates();
            }
        },
        zoom: { enabled: true, type: 'x', autoScaleYaxis: true }
    },
    xaxis: { type: 'datetime', labels: { style: { colors: 'var(--text-secondary)' } } },
    yaxis: { tooltip: { enabled: true }, labels: { style: { colors: 'var(--text-secondary)' }, formatter: (v) => v ? `$${v.toFixed(2)}` : '' }, opposite: true },
    tooltip: { shared: true, theme: 'dark', x: { format: 'dd MMM HH:mm' } },
    plotOptions: { candlestick: { colors: { upward: 'var(--up-color)', downward: 'var(--down-color)' }, wick: { useFillColor: true } } },
    grid: { borderColor: 'var(--border-color)', strokeDashArray: 4 },
};

const secondaryChartOptions = {
    series: [],
    chart: {
        type: 'line',
        height: '100%',
        id: 'secondaryChart',
        group: 'tradingCharts',
        background: 'transparent',
        animations: { enabled: false },
        toolbar: { show: false }
    },
    xaxis: { type: 'datetime', labels: { show: false } },
    yaxis: { labels: { style: { colors: 'var(--text-secondary)' } }, opposite: true },
    tooltip: { theme: 'dark', x: { format: 'dd MMM HH:mm' } },
    grid: { borderColor: 'var(--border-color)', strokeDashArray: 4 }
};

export function initializeCharts(callbacks) {
    chartCallbacks = callbacks;
    mainChart = new ApexCharts(document.getElementById('main-chart'), mainChartOptions);
    secondaryChart = new ApexCharts(document.getElementById('secondary-chart-container'), secondaryChartOptions);
    mainChart.render();
    secondaryChart.render();
}

function calculateAllSeries() {
    const { klineData, activeOverlays, activePaneIndicator } = getState();
    const chartContainer = document.getElementById('chart-container');
    
    const isPaneActive = !!activePaneIndicator;
    chartContainer.classList.toggle('pane-active', isPaneActive);

    if (!klineData || klineData.length === 0) {
        return { mainSeries: [], secondarySeries: [] };
    }
    const mainSeries = [{ type: 'candlestick', name: 'Fiyat', data: klineData.map(d => ({ x: d.x, y: [d.o, d.h, d.l, d.c] })) }];
    activeOverlays.forEach(indicator => {
        const indicatorData = indicator.definition.calculation(klineData, indicator.settings);
        if (indicatorData && Array.isArray(indicatorData)) {
            mainSeries.push(...indicatorData);
        }
    });
    const secondarySeries = [];
    if (activePaneIndicator) {
        const seriesData = activePaneIndicator.definition.calculation(klineData, activePaneIndicator.settings);
        if (seriesData && Array.isArray(seriesData)) {
            secondarySeries.push(...seriesData);
        }
    }
    return { mainSeries, secondarySeries };
}

function updatePriceAnnotation() {
    const { klineData } = getState();
    if (!klineData || klineData.length < 1) return;

    const lastPrice = klineData[klineData.length - 1].c;
    const prevPrice = klineData.length > 1 ? klineData[klineData.length - 2].c : lastPrice;
    const color = lastPrice >= prevPrice ? 'var(--up-color)' : 'var(--down-color)';

    mainChart.removeAnnotation('price-line');
    mainChart.addYaxisAnnotation({
        id: 'price-line',
        y: lastPrice,
        borderColor: color,
        strokeDashArray: 4,
        label: {
            borderColor: color,
            style: { color: '#fff', background: color },
            text: lastPrice.toFixed(2),
            position: 'right',
            textAnchor: 'start',
            offsetX: 10,
        }
    });
}

export function updateAllCharts(rawData = null, resetZoom = false) {
    const minX = mainChart.w.globals.minX;
    const maxX = mainChart.w.globals.maxX;
    const isZoomedOrPanned = mainChart.w.globals.isZoomed || mainChart.w.globals.isPanned;

    if (rawData) {
        setKlineData(rawData);
    }
    const { mainSeries, secondarySeries } = calculateAllSeries();
    
    mainChart.updateSeries(mainSeries, false);

    const { activePaneIndicator } = getState();
    let secondaryOpts = { 
        series: secondarySeries, 
        chart: { animations: { enabled: false } },
        yaxis: { 
            opposite: true,
            labels: { style: { colors: 'var(--text-secondary)' } } 
        } 
    };
    if (activePaneIndicator) {
        const indicatorId = activePaneIndicator.definition.id;
        if (indicatorId === 'rsi' || indicatorId === 'stochastic') {
            secondaryOpts.yaxis.min = 0;
            secondaryOpts.yaxis.max = 100;
        } else if (indicatorId === 'volume' || indicatorId === 'macd') {
            secondaryOpts.chart.type = 'bar';
        } else {
             secondaryOpts.chart.type = 'line';
        }
    }
    secondaryChart.updateOptions(secondaryOpts, false, false);
    
    updatePriceAnnotation();

    if (resetZoom) {
        mainChart.resetSeries(true, true);
        chartCallbacks.startUpdates();
    } else if (isZoomedOrPanned) {
        mainChart.zoomX(minX, maxX);
    }
}

export function updateLiveCharts() {
    const { mainSeries, secondarySeries } = calculateAllSeries();
    
    mainChart.updateSeries(mainSeries, false);
    secondaryChart.updateSeries(secondarySeries, false);

    updatePriceAnnotation();
}
