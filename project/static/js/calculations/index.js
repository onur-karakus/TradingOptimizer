// project/static/js/calculations/index.js
// Bu dosya, tüm bireysel indikatör modüllerini içe aktarır ve
// uygulamanın kullanması için tek bir 'INDICATORS' dizisinde birleştirir.

import { ema } from './indicators/ema.js';
import { bollingerBands } from './indicators/bollingerBands.js';
import { ichimoku } from './indicators/ichimoku.js';
import { rsi } from './indicators/rsi.js';
import { macd } from './indicators/macd.js';
import { stochastic } from './indicators/stochastic.js';
import { atr } from './indicators/atr.js';
import { adx } from './indicators/adx.js';
import { volume } from './indicators/volume.js';

// Sembol listesi gibi genel sabitler burada kalabilir.
export const AVAILABLE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];

// Tüm indikatör tanımlarını tek bir dizide birleştir.
export const INDICATORS = [
    ema,
    bollingerBands,
    ichimoku,
    rsi,
    macd,
    stochastic,
    atr,
    adx,
    volume,
];
