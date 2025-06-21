// project/static/js/ui.js
// Bu modül, tüm DOM manipülasyonları ve olay dinleyicilerinden sorumludur.

import { getState, addOverlayIndicator, setPaneIndicator, removeIndicator, updateIndicatorSettings } from './state.js';

let callbacks = {};
const ui = {
    loader: document.getElementById('loader'),
    pairInfo: document.getElementById('pair-info'),
    // DEĞİŞİKLİK: Konteynerin ID'si güncellendi.
    intervalSelectorContainer: document.getElementById('interval-selector-container'),
    activeIndicatorsList: document.getElementById('active-indicators-list'),
    watchlistContainer: document.querySelector('.watchlist-container'),
    indicatorModal: document.getElementById('indicator-modal-overlay'),
    symbolModal: document.getElementById('symbol-search-overlay'),
    settingsModal: document.getElementById('settings-modal-overlay'),
    indicatorList: document.getElementById('indicators-list'),
    symbolList: document.getElementById('symbols-list'),
    indicatorSearch: document.getElementById('indicator-search'),
    symbolSearch: document.getElementById('symbol-search-input'),
    settingsForm: document.getElementById('settings-form'),
    settingsModalTitle: document.getElementById('settings-modal-title'),
};

export function initializeUI(cbs) {
    callbacks = cbs;
    setupEventListeners();
    populateIndicatorModal();
    populateSymbolModalAndWatchlist();
    // DEĞİŞİKLİK: Ayrı butonlar yerine dropdown menüsü oluşturuluyor.
    createTimeIntervalDropdown();
    updatePairHeader();
    updateActiveIndicatorTags();
}

function setupEventListeners() {
    document.getElementById('open-indicator-modal-btn').addEventListener('click', () => showModal(ui.indicatorModal));
    ui.pairInfo.addEventListener('click', () => showModal(ui.symbolModal));

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay || e.target.closest('.close-modal-btn')) {
                hideModal(overlay);
            }
        });
    });
    
    ui.settingsForm.addEventListener('submit', handleSettingsSave);
    ui.indicatorSearch.addEventListener('keyup', e => filterList(e.target.value, ui.indicatorList));
    ui.symbolSearch.addEventListener('keyup', e => filterList(e.target.value, ui.symbolList));
    
    // Dropdown menüsü dışına tıklandığında menüyü kapat.
    window.addEventListener('click', function(event) {
        if (!ui.intervalSelectorContainer.contains(event.target)) {
            const dropdownContent = ui.intervalSelectorContainer.querySelector('.interval-dropdown-content');
            if (dropdownContent) {
                dropdownContent.style.display = 'none';
                ui.intervalSelectorContainer.querySelector('.interval-dropdown-btn').classList.remove('active');
            }
        }
    });
}

function populateIndicatorModal() {
    const { allIndicators } = getState();
    ui.indicatorList.innerHTML = '';
    allIndicators.forEach(ind => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.dataset.id = ind.id;
        li.innerHTML = `<h5>${ind.name} <span class="type-tag ${ind.type}">${ind.type === 'overlay' ? 'Ana Grafik' : 'Yeni Bölme'}</span></h5><p>${ind.description || ''}</p>`;
        li.addEventListener('click', () => handleAddIndicator(ind.id, ind.type));
        ui.indicatorList.appendChild(li);
    });
}

function populateSymbolModalAndWatchlist() {
    const { availableSymbols } = getState();
    ui.symbolList.innerHTML = '';
    ui.watchlistContainer.innerHTML = '';
    availableSymbols.forEach(symbol => {
        const modalLi = document.createElement('li');
        modalLi.className = 'list-item';
        modalLi.innerHTML = `<h5>${symbol}</h5>`;
        modalLi.addEventListener('click', () => {
            callbacks.onSymbolChange(symbol);
            hideModal(ui.symbolModal);
        });
        ui.symbolList.appendChild(modalLi);

        const watchItem = document.createElement('div');
        watchItem.className = 'watchlist-item';
        watchItem.dataset.symbol = symbol;
        watchItem.innerHTML = `<span class="pair">${symbol.replace('USDT','/USDT')}</span><div class="price"><span class="last-price">--</span><span class="change">--%</span></div>`;
        watchItem.addEventListener('click', () => callbacks.onSymbolChange(symbol));
        ui.watchlistContainer.appendChild(watchItem);
    });
}

// --- ANA DEĞİŞİKLİK: Dropdown Menüsü Oluşturma ---
function createTimeIntervalDropdown() {
    // YENİ: Haftalık ve aylık eklendi.
    const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
    const intervalMap = {'1m': '1 Dakika', '5m': '5 Dakika', '15m': '15 Dakika', '30m': '30 Dakika', '1h': '1 Saat', '4h': '4 Saat', '1d': '1 Gün', '1w': '1 Hafta', '1M': '1 Ay'};
    const { currentInterval } = getState();

    ui.intervalSelectorContainer.innerHTML = '';

    // Dropdown butonu
    const btn = document.createElement('button');
    btn.className = 'interval-dropdown-btn';
    btn.innerHTML = `<span>${intervalMap[currentInterval]}</span><i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>`;
    
    // Dropdown içerik listesi
    const content = document.createElement('div');
    content.className = 'interval-dropdown-content';

    intervals.forEach(interval => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = intervalMap[interval];
        link.dataset.interval = interval;
        if (interval === currentInterval) {
            link.className = 'active';
        }

        link.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation(); // Butonun click event'ini tetiklemeyi önle
            
            // Eğer zaten seçili olan seçildiyse bir şey yapma
            if (link.classList.contains('active')) {
                content.style.display = 'none';
                btn.classList.remove('active');
                return;
            }
            
            content.querySelector('.active')?.classList.remove('active');
            link.classList.add('active');
            
            btn.querySelector('span').textContent = intervalMap[interval];
            content.style.display = 'none';
            btn.classList.remove('active');

            callbacks.onIntervalChange(interval);
        });
        content.appendChild(link);
    });

    // Butona tıklandığında dropdown'u aç/kapat
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Pencere click event'ini tetiklemeyi önle
        const isShown = content.style.display === 'block';
        content.style.display = isShown ? 'none' : 'block';
        btn.classList.toggle('active', !isShown);
    });

    ui.intervalSelectorContainer.appendChild(btn);
    ui.intervalSelectorContainer.appendChild(content);
    lucide.createIcons({
        attrs: {
            'stroke-width': 1.75,
        },
    });
}

export function updatePairHeader() {
    const { currentSymbol } = getState();
    ui.pairInfo.innerHTML = `<h1>${currentSymbol.replace('USDT', '')}/USDT</h1>`;
}

export function updateActiveIndicatorTags() {
    const { activeOverlays, activePaneIndicator } = getState();
    ui.activeIndicatorsList.innerHTML = '';
    [...activeOverlays, activePaneIndicator].filter(Boolean).forEach(indicator => {
        const tag = document.createElement('div');
        tag.className = 'indicator-tag';
        const settingsButton = indicator.definition.settings?.length > 0 ? `<button class="config-indicator-btn" data-id="${indicator.instanceId}" title="Ayarlar"><i data-lucide="settings-2" style="pointer-events: none;"></i></button>` : '';
        const settingsText = Object.values(indicator.settings).join(', ');
        tag.innerHTML = `<span>${indicator.definition.name} ${settingsText ? `(${settingsText})` : ''}</span>${settingsButton}<button class="remove-indicator-btn" data-id="${indicator.instanceId}" title="Kaldır"><i data-lucide="x" style="pointer-events: none;"></i></button>`;
        ui.activeIndicatorsList.appendChild(tag);
    });
    ui.activeIndicatorsList.querySelectorAll('.remove-indicator-btn').forEach(btn => btn.addEventListener('click', (e) => handleRemoveIndicator(e.currentTarget.dataset.id)));
    ui.activeIndicatorsList.querySelectorAll('.config-indicator-btn').forEach(btn => btn.addEventListener('click', (e) => openSettingsModal(e.currentTarget.dataset.id)));
    lucide.createIcons();
}

export function updateWatchlist(tickerData) {
    ui.watchlistContainer.querySelectorAll('.watchlist-item').forEach(item => {
        const symbol = item.dataset.symbol;
        const data = tickerData[symbol];
        if (data) {
            const priceEl = item.querySelector('.last-price');
            const changeEl = item.querySelector('.change');
            priceEl.textContent = parseFloat(data.lastPrice).toFixed(2);
            const change = parseFloat(data.priceChangePercent);
            changeEl.textContent = `${change.toFixed(2)}%`;
            changeEl.className = 'change';
            if (change > 0) changeEl.classList.add('up');
            else if (change < 0) changeEl.classList.add('down');
        }
    });
}

function handleAddIndicator(indicatorId, type) {
    if (type === 'overlay') addOverlayIndicator(indicatorId);
    else if (type === 'pane') setPaneIndicator(indicatorId);
    hideModal(ui.indicatorModal);
    callbacks.onIndicatorChange();
}

function handleRemoveIndicator(instanceId) {
    removeIndicator(instanceId);
    callbacks.onIndicatorChange();
}

function openSettingsModal(instanceId) {
    const indicator = [...getState().activeOverlays, getState().activePaneIndicator].find(i => i && i.instanceId === instanceId);
    if (!indicator || !indicator.definition.settings) return;
    ui.settingsForm.innerHTML = '';
    ui.settingsForm.dataset.instanceId = instanceId;
    ui.settingsModalTitle.textContent = `${indicator.definition.name} Ayarları`;
    indicator.definition.settings.forEach(setting => {
        const value = indicator.settings[setting.id];
        ui.settingsForm.innerHTML += `<div class="form-row"><label for="setting-${setting.id}">${setting.name}</label><input type="number" id="setting-${setting.id}" name="${setting.id}" value="${value}"></div>`;
    });
    showModal(ui.settingsModal);
}

function handleSettingsSave(e) {
    e.preventDefault();
    const { instanceId } = e.target.dataset;
    const newSettings = Object.fromEntries(new FormData(e.target).entries());
    Object.keys(newSettings).forEach(key => newSettings[key] = Number(newSettings[key]));
    updateIndicatorSettings(instanceId, newSettings);
    hideModal(ui.settingsModal);
    callbacks.onIndicatorChange();
}

export function showLoader() { ui.loader.style.display = 'block'; }
export function hideLoader() { ui.loader.style.display = 'none'; }
function showModal(modalEl) { modalEl.style.display = 'flex'; }
function hideModal(modalEl) { modalEl.style.display = 'none'; }
function filterList(searchTerm, listElement) {
    listElement.querySelectorAll('li').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}
