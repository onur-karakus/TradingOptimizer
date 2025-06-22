# project/api/routes.py
from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Kline
import data_fetcher
from datetime import datetime, timedelta
import re

api = Blueprint('api', __name__)

def get_interval_timedelta(interval_str):
    """Verilen aralık string'ini bir timedelta nesnesine çevirir."""
    nums = re.findall(r'\d+', interval_str)
    if not nums: return timedelta(days=90)
    num = int(nums[0])
    
    units = re.findall(r'[a-zA-Z]+', interval_str)
    if not units: return timedelta(days=90)
    unit = units[0]
    
    if unit == 'm': return timedelta(minutes=num)
    if unit == 'h': return timedelta(hours=num)
    if unit == 'd': return timedelta(days=num)
    if unit == 'w': return timedelta(weeks=num)
    if unit == 'M': return timedelta(days=num * 30)
    return timedelta(days=90)

def needs_update(symbol, interval):
    """
    Verinin durumunu kontrol eder.
    Dönüş değerleri: 0 (güncel), 1 (eski, güncellenmeli), 2 (boş, tamamen doldurulmalı)
    """
    last_kline = Kline.query.filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).first()

    if not last_kline:
        return 2

    now = datetime.utcnow()
    last_kline_time = datetime.utcfromtimestamp(last_kline.open_time / 1000)
    staleness_threshold = get_interval_timedelta(interval) * 2

    if now - last_kline_time > staleness_threshold:
        return 1
            
    return 0

@api.route('/klines')
def klines_endpoint():
    """
    Grafik verilerini sunar. Gerekirse veriyi otomatik olarak doldurur veya günceller.
    """
    symbol = request.args.get('symbol', 'BTCUSDT').upper()
    interval = request.args.get('interval', '1h')
    limit = int(request.args.get('limit', 1500))
    before_timestamp = request.args.get('before', type=int)

    if not before_timestamp:
        update_status = needs_update(symbol, interval)
        if update_status == 2:
            print(f"-> OTOMATİK DOLGU: {symbol}-{interval} için tam geçmiş çekiliyor...")
            data_fetcher.backfill_full_history(symbol, interval)
            print(f"-> Otomatik dolgu tamamlandı.")
        elif update_status == 1:
            print(f"-> OTOMATİK GÜNCELLEME: {symbol}-{interval} için son veriler çekiliyor...")
            data_fetcher.update_recent_klines(symbol, interval)
            print(f"-> Otomatik güncelleme tamamlandı.")

    query = Kline.query.filter_by(symbol=symbol, interval=interval)
    if before_timestamp:
        query = query.filter(Kline.open_time < before_timestamp)
    
    klines_from_db = query.order_by(Kline.open_time.desc()).limit(limit).all()
    klines_from_db.reverse()
    
    response_data = [
        {"x": k.open_time, "o": float(k.open), "h": float(k.high), "l": float(k.low), "c": float(k.close), "v": float(k.volume)}
        for k in klines_from_db
    ]
    return jsonify(response_data)

@api.route('/latest_kline')
def latest_kline_endpoint():
    """Tek bir en son mumu canlı güncellemeler için döndürür."""
    symbol = request.args.get('symbol', 'BTCUSDT').upper()
    interval = request.args.get('interval', '1h')
    kline = Kline.query.filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).first()
    if not kline: 
        return jsonify(None)
    # DÜZELTME: 'k' yerine 'kline' değişkeni kullanıldı.
    return jsonify({
        "x": kline.open_time, 
        "o": float(kline.open), 
        "h": float(kline.high), 
        "l": float(kline.low), 
        "c": float(kline.close), 
        "v": float(kline.volume)
    })

@api.route('/ticker')
def ticker_endpoint():
    """İzleme listesi için temel fiyat bilgilerini döndürür."""
    symbols_str = request.args.get('symbols')
    if not symbols_str: 
        return jsonify({})
    data = {}
    for symbol in symbols_str.split(','):
        kline = Kline.query.filter_by(symbol=symbol).order_by(Kline.open_time.desc()).first()
        data[symbol] = {"lastPrice": kline.close if kline else "0", "priceChangePercent": "0.00"}
    return jsonify(data)
