# project/scheduler.py
from flask_apscheduler import APScheduler
# İçe aktarma sorunlarını önlemek için modülün kendisi kullanılır.
import data_fetcher
import logging

# Loglama ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Var olmayan 'get_db' yerine, doğru olan 'db' nesnesi içeri aktarılır.
from .db import db

# Scheduler nesnesi
scheduler = APScheduler()

# Desteklenen işlem çiftleri ve zaman aralıkları
SUPPORTED_PAIRS = {
    'BTCUSDT': ['1m', '5m', '15m'],
    'ETHUSDT': ['1m', '5m', '15m']
}

def update_klines(symbol, interval):
    """
    Belirli bir sembol ve zaman aralığı için kline verilerini güncelleyen zamanlanmış görev.
    """
    # Bu fonksiyon scheduler tarafından bir uygulama bağlamı (app_context) içinde çalıştırılır.
    with scheduler.app.app_context():
        # Döngüsel içe aktarmayı önlemek için 'Kline' modeli burada içeri aktarılır.
        from .models import Kline

        logger.info(f"Zamanlayıcı çalışıyor: {symbol} {interval}...")

        try:
            # 1. Veritabanındaki son kline verisinin zaman damgasını al.
            # Flask-SQLAlchemy için standart olan 'db.session' kullanılır.
            last_kline = db.session.query(Kline).filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).first()
            start_time = last_kline.open_time if last_kline else None

            # 2. API'den yeni verileri çek.
            new_data = data_fetcher.get_klines(symbol=symbol, interval=interval, startTime=start_time)

            if not new_data:
                logger.info(f"{symbol} {interval} için yeni veri bulunamadı.")
                return

            # 3. Yeni verileri veritabanına ekle.
            query_start_time = new_data[0][0]
            existing_times = {
                k.open_time for k in db.session.query(Kline.open_time).filter(
                    Kline.symbol == symbol,
                    Kline.interval == interval,
                    Kline.open_time >= query_start_time
                ).all()
            }

            klines_to_add = [
                Kline(
                    symbol=symbol, interval=interval, open_time=k[0], open=k[1],
                    high=k[2], low=k[3], close=k[4], volume=k[5],
                )
                for k in new_data if k[0] not in existing_times
            ]
            
            if klines_to_add:
                db.session.add_all(klines_to_add)
                db.session.commit()
                logger.info(f"{symbol} {interval} için {len(klines_to_add)} adet yeni veri eklendi.")
            else:
                logger.info(f"{symbol} {interval} için veriler güncel.")

        except Exception as e:
            logger.error(f"{symbol} {interval} güncellenirken hata oluştu: {e}")
            db.session.rollback()

def initialize_jobs():
    """
    Tüm güncelleme görevlerini oluşturur ve zamanlayıcıya ekler.
    """
    logger.info("Zamanlayıcı görevleri başlatılıyor...")
    for symbol, intervals in SUPPORTED_PAIRS.items():
        for interval in intervals:
            job_id = f"update_{symbol}_{interval}"
            if not scheduler.get_job(job_id):
                try:
                    interval_seconds = int(interval[:-1]) * 60 
                    scheduler.add_job(
                        id=job_id, func=update_klines, args=[symbol, interval],
                        trigger='interval', seconds=interval_seconds, misfire_grace_time=60
                    )
                    logger.info(f"Görev eklendi: {job_id}, her {interval_seconds} saniyede bir çalışacak.")
                except Exception as e:
                    logger.error(f"{job_id} görevi eklenirken hata: {e}")
    logger.info("Zamanlayıcı görevleri başlatıldı.")

# Bu görev, uygulama başladıktan kısa bir süre sonra bir defaya mahsus çalışarak
# diğer ana görevleri başlatır ve başlangıçtaki uygulama bağlamı sorunlarını önler.
@scheduler.task('date', id='init_scheduler_jobs')
def scheduled_init():
    """Ana veri çekme görevlerini başlatır."""
    initialize_jobs()
