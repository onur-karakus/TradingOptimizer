# project/scheduler.py
# Arka planda periyodik olarak veri senkronizasyonu yapacak görevleri yönetir.

import requests
import time
from datetime import datetime
from flask import current_app
from flask_apscheduler import APScheduler
from .db import get_db

scheduler = APScheduler()

def get_interval_in_milliseconds(interval_str):
    """Zaman aralığı string'ini milisaniyeye çevirir."""
    unit = interval_str[-1]
    value = int(interval_str[:-1])
    if unit == 'm': return value * 60 * 1000
    if unit == 'h': return value * 3600 * 1000
    if unit == 'd': return value * 86400 * 1000
    return 0

def _sync_data_for_pair(app, symbol, interval):
    """Belirtilen bir parite ve zaman aralığı için veriyi senkronize eder."""
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("SELECT MAX(open_time) FROM klines WHERE symbol = ? AND interval = ?", (symbol, interval))
        last_time = cursor.fetchone()[0] or 0

        if not last_time: return

        while True:
            start_time = last_time + 1
            if start_time > int(time.time() * 1000) - get_interval_in_milliseconds(interval):
                break
            try:
                url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&startTime={start_time}&limit=1000"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                klines = response.json()

                if not klines: break
                
                data_to_insert = [(symbol, interval, k[0], float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[5])) for k in klines]
                cursor.executemany("INSERT OR IGNORE INTO klines (symbol, interval, open_time, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", data_to_insert)
                db.commit()
                
                last_time = klines[-1][0]
                print(f"DB GÜNCELLEME (arka plan): '{symbol}-{interval}' için {len(klines)} yeni mum eklendi.")

                if len(klines) < 1000: break
                time.sleep(0.5)
            except requests.exceptions.RequestException as e:
                print(f"Scheduler API hatası ('{symbol}-{interval}'): {e}")
                break

# --- DEĞİŞİKLİK ---
# Görevin amacı, kullanıcı bir grafiği açtığında veritabanının makul ölçüde
# güncel olmasını sağlamaktır (backfilling). Gerçek zamanlı son mum güncellemesi
# frontend tarafından /api/latest_kline endpoint'i üzerinden yapılır.
# Bu nedenle, bu arka plan görevinin çok sık çalışmasına gerek yoktur.
# Çalışma sıklığı 1 dakikaya ayarlandı.
@scheduler.task('interval', id='sync_all_data_job', minutes=1, misfire_grace_time=30)
def sync_all_data_job():
    """Tüm sembol ve zaman aralıkları için veri senkronizasyonunu tetikler."""
    app = scheduler.app
    with app.app_context():
        symbols = app.config['ALLOWED_SYMBOLS']
        intervals = app.config['ALLOWED_INTERVALS']
    
    print(f"--- Periyodik DB Arka Plan Doldurma Görevi Başladı ({datetime.now().strftime('%H:%M:%S')}) ---")
    for symbol in symbols:
        for interval in intervals:
            _sync_data_for_pair(app, symbol, interval)
