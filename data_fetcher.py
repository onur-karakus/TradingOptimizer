# project/data_fetcher.py
import requests
import sqlite3
import time
from datetime import datetime
import os

# Projenin kök dizinini baz alarak veritabanı yolunu belirle
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, 'instance', 'trading_data.db')

ALLOWED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT']
ALLOWED_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']
KLINE_LIMIT = 1000 

# --- OPTIMIZASYON: Her periyot için makul bir geçmiş veri limiti belirlendi ---
# Bu, `fetch-data` komutunun saatler sürmesini engeller.
# Değerler, "kaç adet 1000'lik paket çekileceğini" belirtir.
BACKFILL_PAGE_LIMITS = {
    '1m': 30,   # ~30,000 mum = ~21 gün
    '5m': 20,   # ~20,000 mum = ~69 gün
    '15m': 15,  # ~15,000 mum = ~156 gün
    '30m': 10,  # ~10,000 mum = ~208 gün
    '1h': 10,   # ~10,000 mum = ~1 yıl
    '4h': 5,    # ~5,000 mum = ~2.2 yıl
    '1d': 5,    # ~5,000 mum = ~13 yıl (Bitcoin'in tüm geçmişi)
    '1w': 2,    # ~2,000 mum = ~38 yıl (fazlasıyla yeterli)
    '1M': 1,    # ~1,000 mum = ~83 yıl (fazlasıyla yeterli)
}

def get_klines_from_api(symbol, interval, startTime=None, endTime=None, limit=1000):
    """Binance API'den kline verilerini çeker ve hataları detaylı raporlar."""
    url = "https://api.binance.com/api/v3/klines"
    params = {'symbol': symbol, 'interval': interval, 'limit': limit}
    if startTime: params['startTime'] = startTime
    if endTime: params['endTime'] = endTime
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status() 
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print(f"API HTTP Hatası: {http_err} - URL: {response.url}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"API Bağlantı Hatası: {e}")
        return []

def save_klines_to_db(klines, symbol, interval):
    """Gelen kline verilerini veritabanına kaydeder."""
    if not klines: return 0
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    data_to_insert = [(symbol, interval, k[0], k[1], k[2], k[3], k[4], k[5]) for k in klines]
    try:
        cursor.executemany("INSERT OR IGNORE INTO klines (symbol, interval, open_time, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", data_to_insert)
        conn.commit()
        return cursor.rowcount
    except Exception as e:
        print(f"Veritabanı kaydetme hatası: {e}")
        return 0
    finally:
        conn.close()

def backfill_full_history(symbol, interval):
    """
    Şimdiki zamandan geriye giderek bir paritenin geçmişini, belirlenen limitler dahilinde çeker.
    """
    print(f"'{symbol}-{interval}' için tarihsel veri dolgusu başlatıldı...")
    
    endTime = int(datetime.utcnow().timestamp() * 1000)
    total_saved_count = 0
    page_count = 0
    limit_pages = BACKFILL_PAGE_LIMITS.get(interval, 1)

    while page_count < limit_pages:
        page_count += 1
        klines = get_klines_from_api(symbol, interval, endTime=endTime, limit=KLINE_LIMIT)
        if not klines:
            print("-> API'den daha fazla geçmiş veri gelmedi. Döngü sonlandırılıyor.")
            break
            
        oldest_kline_time = klines[0][0]
        saved_count = save_klines_to_db(klines, symbol, interval)
        total_saved_count += saved_count
        
        if saved_count == 0 and page_count > 1:
            print("-> Veritabanında zaten mevcut olan bir bölüme ulaşıldı. Döngü sonlandırılıyor.")
            break

        # Bir sonraki paketi, bu paketin en eski mumundan bir milisaniye öncesinden başlat
        endTime = oldest_kline_time - 1
        print(f"-> Sayfa {page_count}/{limit_pages}: {saved_count} mum kaydedildi. {datetime.utcfromtimestamp(endTime/1000)} öncesi aranacak...")
        time.sleep(1)
        
    if total_saved_count > 0:
        print(f"'{symbol}-{interval}' için toplam {total_saved_count} geçmiş veri başarıyla kaydedildi.")
    else:
        print(f"'{symbol}-{interval}' için yeni geçmiş veri bulunamadı veya veri zaten tamamdı.")


def update_recent_klines(symbol, interval):
    """Sadece veritabanındaki son kayıttan bu yana olan yeni verileri çeker."""
    print(f"'{symbol}-{interval}' için güncel veriler kontrol ediliyor...")
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(open_time) FROM klines WHERE symbol=? AND interval=?", (symbol, interval))
    last_timestamp = cursor.fetchone()[0]
    conn.close()

    start_fetch_time = last_timestamp + 1 if last_timestamp else None
    klines = get_klines_from_api(symbol, interval, startTime=start_fetch_time, limit=KLINE_LIMIT)
    saved_count = save_klines_to_db(klines, symbol, interval)

    if saved_count > 0:
        print(f"-> {saved_count} adet güncel mum eklendi.")
    else:
        print(f"-> Veri güncel.")

def run_full_fetch():
    """'flask fetch-data' komutunun çalıştırdığı ana fonksiyon."""
    os.makedirs(os.path.dirname(DATABASE_FILE), exist_ok=True)
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS klines (symbol TEXT, interval TEXT, open_time INTEGER, open TEXT, high TEXT, low TEXT, close TEXT, volume TEXT, PRIMARY KEY (symbol, interval, open_time))''')
    conn.commit()
    conn.close()

    for symbol in ALLOWED_SYMBOLS:
        for interval in ALLOWED_INTERVALS:
            backfill_full_history(symbol, interval)

if __name__ == '__main__':
    run_full_fetch()
