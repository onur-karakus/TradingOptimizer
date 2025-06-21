# project/config.py
# Uygulamanın tüm konfigürasyon değişkenlerini içerir.

import os

class Config:
    """Ana konfigürasyon sınıfı."""
    # Veritabanı dosyasının yolu (instance klasörü içinde)
    DATABASE = os.path.join(os.path.dirname(__file__), '..', 'instance', 'trading_data.db')
    
    # Binance API tarafından desteklenen semboller ve zaman aralıkları
    # YENİ: '1w' (1 hafta) ve '1M' (1 ay) eklendi.
    ALLOWED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT']
    ALLOWED_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']
    
    # APScheduler yapılandırması
    SCHEDULER_API_ENABLED = True
