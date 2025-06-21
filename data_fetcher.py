# data_fetcher.py
# Veritabanını doldurmak için Binance API'den toplu tarihsel veri çeker.
# Bu betik, uygulama çalışmıyorken manuel olarak çalıştırılmalıdır.

import requests
import sqlite3
import time
from datetime import datetime
import os

# instance klasörünün var olduğundan emin ol
if not os.path.exists('instance'):
    os.makedirs('instance')

DATABASE_FILE = 'instance/trading_data.db'
ALLOWED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT']
# YENİ: '1w' (1 hafta) ve '1M' (1 ay) eklendi.
ALLOWED_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']
KLINE_LIMIT = 15000 

def fetch_historical_data(symbol, interval):
    """Belirtilen parite için Binance'ten toplu veri çeker ve veritabanına yazar."""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    print(f"'{symbol}-{interval}' için tarihsel veri çekiliyor...")
    
    try:
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={KLINE_LIMIT}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        klines = response.json()

        if not klines:
            print(f"Veri alınamadı.")
            return

        cursor.executemany(
            "INSERT OR IGNORE INTO klines (symbol, interval, open_time, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [(symbol, interval, k[0], float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[5])) for k in klines]
        )
        conn.commit()
        
        start_date = datetime.fromtimestamp(klines[0][0]/1000)
        end_date = datetime.fromtimestamp(klines[-1][0]/1000)
        print(f"{len(klines)} adet mum başarıyla eklendi. ({start_date} -> {end_date})")

    except requests.exceptions.RequestException as e:
        print(f"API hatası: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    print("--- Tarihsel Veri Çekme Betiği Başlatıldı ---")
    for symbol in ALLOWED_SYMBOLS:
        for interval in ALLOWED_INTERVALS:
            fetch_historical_data(symbol, interval)
            time.sleep(1) 
    print("--- Tüm işlemler tamamlandı. ---")
