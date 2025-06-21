# project/api/routes.py
# Tüm API endpoint'lerini içeren Blueprint.

import requests
from flask import Blueprint, jsonify, request, current_app
from project.db import get_db
import time
from datetime import datetime

api_bp = Blueprint('api', __name__)

# --- YENİ YARDIMCI FONKSİYON ---
def _fetch_and_store_initial_data(symbol, interval, db):
    """
    Belirli bir sembol/zaman aralığı için veritabanında veri yoksa,
    Binance'ten tarihsel veriyi çeker ve veritabanına kaydeder.
    """
    print(f"'{symbol}-{interval}' için veritabanında veri bulunamadı. Otomatik veri çekme başlatılıyor...")
    
    try:
        # Binance API'den çekilebilecek maksimum mum sayısını çekelim.
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit=1500"
        response = requests.get(url, timeout=15) # Zaman aşımını biraz artıralım
        response.raise_for_status()
        klines = response.json()

        if not klines:
            print(f"'{symbol}-{interval}' için API'den veri alınamadı.")
            return False

        data_to_insert = [
            (symbol, interval, k[0], float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[5])) 
            for k in klines
        ]

        cursor = db.cursor()
        cursor.executemany(
            "INSERT OR IGNORE INTO klines (symbol, interval, open_time, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            data_to_insert
        )
        db.commit()
        
        start_date = datetime.fromtimestamp(klines[0][0]/1000)
        end_date = datetime.fromtimestamp(klines[-1][0]/1000)
        print(f"Otomatik çekme başarılı: {len(klines)} mum eklendi. ({start_date} -> {end_date})")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Otomatik veri çekme sırasında API hatası: {e}")
        return False
    except Exception as e:
        print(f"Otomatik veri çekme sırasında beklenmedik bir hata: {e}")
        return False


@api_bp.route('/data')
def get_kline_data():
    """Veritabanından mum verilerini çeker. Veri yoksa, otomatik olarak çeker."""
    symbol = request.args.get('symbol', 'BTCUSDT').upper()
    interval = request.args.get('interval', '1h')

    if symbol not in current_app.config['ALLOWED_SYMBOLS'] or \
       interval not in current_app.config['ALLOWED_INTERVALS']:
        return jsonify({"error": "Geçersiz sembol veya zaman aralığı"}), 400

    db = get_db()
    cursor = db.cursor()
    
    # Veritabanından veriyi çekmeyi dene
    cursor.execute(
        """
        SELECT open_time, open, high, low, close, volume 
        FROM klines 
        WHERE symbol = ? AND interval = ? 
        ORDER BY open_time ASC
        """,
        (symbol, interval)
    )
    rows = cursor.fetchall()
    
    # --- ANA DÜZELTME: OTOMATİK VERİ ÇEKME MANTIĞI ---
    # Eğer veritabanında bu zaman aralığı için hiç veri yoksa...
    if not rows:
        # Veriyi çek, kaydet ve başarılı olursa tekrar sorgula.
        if _fetch_and_store_initial_data(symbol, interval, db):
            cursor.execute(
                "SELECT open_time, open, high, low, close, volume FROM klines WHERE symbol = ? AND interval = ? ORDER BY open_time ASC",
                (symbol, interval)
            )
            rows = cursor.fetchall()
        else:
            # Eğer otomatik çekme başarısız olursa, boş bir liste döndür.
            return jsonify([])

    db_data = [[row[f] for f in row.keys()] for row in rows]
    return jsonify(db_data)


# ... (diğer endpoint'ler değişmedi) ...
@api_bp.route('/latest_kline')
def get_latest_kline_data():
    """Grafiğin son mumunu canlı güncellemek için sadece en son mumu Binance'ten çeker."""
    symbol = request.args.get('symbol', 'BTCUSDT').upper()
    interval = request.args.get('interval', '1h')

    if symbol not in current_app.config['ALLOWED_SYMBOLS'] or interval not in current_app.config['ALLOWED_INTERVALS']:
        return jsonify({"error": "Geçersiz sembol veya zaman aralığı"}), 400

    try:
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit=2"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        latest_kline = data[-1] if data else None
        if not latest_kline: return jsonify(None)

        formatted_kline = { "x": latest_kline[0], "o": float(latest_kline[1]), "h": float(latest_kline[2]), "l": float(latest_kline[3]), "c": float(latest_kline[4]), "v": float(latest_kline[5]) }
        return jsonify(formatted_kline)
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/ticker')
def get_ticker_data():
    """İzleme listesi için anlık fiyat verilerini çeker."""
    symbols_query = request.args.get('symbols')
    if not symbols_query: return jsonify({})
    
    symbols_json = f'["' + '","'.join(symbols_query.split(',')) + '"]'
    try:
        url = f"https://api.binance.com/api/v3/ticker/24hr?symbols={symbols_json}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        ticker_data = {item['symbol']: {'lastPrice': item['lastPrice'], 'priceChangePercent': item['priceChangePercent']} for item in response.json()}
        return jsonify(ticker_data)
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Binance API ile iletişim kurulamadı: {e}'}), 500
