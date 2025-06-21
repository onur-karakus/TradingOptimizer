from flask import Blueprint, jsonify, request
from data_fetcher import get_klines
from ..models import Kline
from ..db import db

api = Blueprint('api', __name__)

@api.route('/klines')
def klines_endpoint():
    """
    Grafik verilerini önbellekleme mekanizmasıyla sunar.
    Önce veritabanını kontrol eder, eksik verileri API'den çeker,
    veritabanını günceller ve sonucu veritabanından gönderir.
    """
    symbol = request.args.get('symbol', 'BTCUSDT').upper()
    interval = request.args.get('interval', '1h')
    limit = int(request.args.get('limit', '1000'))

    # 1. Adım: Veritabanındaki en son veriyi bul.
    last_kline = Kline.query.filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).first()
    
    start_time = None
    if last_kline:
        # Eğer veritabanında veri varsa, sadece eksik olan yeni verileri çekmek için
        # başlangıç zamanını son verinin zamanı olarak ayarla.
        start_time = last_kline.open_time

    # 2. Adım: API'den yeni verileri çek.
    new_klines_data = get_klines(symbol=symbol, interval=interval, startTime=start_time, limit=limit)

    # 3. Adım: Gelen yeni verileri veritabanına kaydet.
    if new_klines_data:
        # Hızlı kontrol için veritabanındaki mevcut zaman damgalarını bir sete al.
        # Bu, gereksiz veritabanı sorgularını önler ve performansı artırır.
        query_start_time = new_klines_data[0][0]
        existing_times = {
            t[0] for t in db.session.query(Kline.open_time).filter(
                Kline.symbol == symbol,
                Kline.interval == interval,
                Kline.open_time >= query_start_time
            ).all()
        }
        
        # Sadece veritabanında olmayan yeni mumları listeye ekle.
        kline_objects = [
            Kline(
                symbol=symbol,
                interval=interval,
                open_time=k[0],
                open=k[1],
                high=k[2],
                low=k[3],
                close=k[4],
                volume=k[5]
            )
            for k in new_klines_data if k[0] not in existing_times
        ]
        
        # Toplu kayıt işlemi (bulk save) ile yeni verileri veritabanına verimli bir şekilde ekle.
        if kline_objects:
            db.session.bulk_save_objects(kline_objects)
            db.session.commit()

    # 4. Adım: Tüm güncel veriyi veritabanından çek ve arayüze gönder.
    # Arayüzün aşırı veri ile yavaşlamaması için sonucu limitle.
    all_klines_from_db = Kline.query.filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).limit(limit).all()
    # Grafiklerin doğru çizilmesi için veriyi zaman damgasına göre artan şekilde sırala.
    all_klines_from_db.reverse()
    
    # Veriyi arayüzün (JavaScript) beklediği formata dönüştür.
    response_data = [
        {
            "x": kline.open_time,
            "o": float(kline.open),
            "h": float(kline.high),
            "l": float(kline.low),
            "c": float(kline.close),
        }
        for kline in all_klines_from_db
    ]

    return jsonify(response_data)
