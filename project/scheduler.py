# project/scheduler.py
from flask_apscheduler import APScheduler
import logging
from .extensions import db
from .models import Kline
# data_fetcher artık API ve kaydetme fonksiyonlarını içeriyor
import data_fetcher 

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

scheduler = APScheduler()

# Güncellenecek çiftler ve aralıklar. Artık daha kapsamlı.
# Aralık (key) -> Saniye cinsinden güncelleme sıklığı (value)
SCHEDULE_CONFIG = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600
}

def sync_kline_data(app, symbol, interval):
    """Belirli bir sembol/aralık için veriyi senkronize eder."""
    with app.app_context():
        logger.info(f"Zamanlayıcı çalışıyor: {symbol} {interval} senkronizasyonu...")
        try:
            # 1. DB'deki en son mumu bul
            last_kline = Kline.query.filter_by(symbol=symbol, interval=interval).order_by(Kline.open_time.desc()).first()
            start_time = last_kline.open_time if last_kline else None
            
            # 2. API'den yeni verileri çek
            new_data = data_fetcher.get_klines_from_api(symbol, interval, startTime=start_time)
            
            # 3. Gelen yeni verileri veritabanına kaydet
            count = data_fetcher.save_klines_to_db(new_data, symbol, interval)
            
            if count > 0:
                logger.info(f"-> {symbol}-{interval} için {count} adet yeni veri eklendi.")
            else:
                logger.info(f"-> {symbol}-{interval} için veri güncel.")

        except Exception as e:
            logger.error(f"{symbol} {interval} güncellenirken hata oluştu: {e}")
            db.session.rollback()

def initialize_scheduler(app):
    """Tüm periyodik senkronizasyon görevlerini oluşturur ve zamanlayıcıya ekler."""
    if scheduler.running:
        logger.info("Zamanlayıcı zaten çalışıyor.")
        return
        
    logger.info("Zamanlayıcı görevleri oluşturuluyor...")
    for symbol in data_fetcher.ALLOWED_SYMBOLS:
        for interval, seconds in SCHEDULE_CONFIG.items():
            job_id = f"sync_{symbol}_{interval}"
            if not scheduler.get_job(job_id):
                scheduler.add_job(
                    id=job_id,
                    func=sync_kline_data,
                    args=[app, symbol, interval],
                    trigger='interval',
                    seconds=seconds,
                    misfire_grace_time=30 # Görev gecikirse 30 saniye içinde çalıştır
                )
                logger.info(f"-> Görev eklendi: {job_id}, her {seconds} saniyede bir.")
    
    logger.info("Tüm zamanlayıcı görevleri eklendi.")

# __init__.py içinde app oluşturulduktan sonra bu fonksiyon çağrılacak.
# Scheduler artık app bağlamı ile başlatılıyor.
