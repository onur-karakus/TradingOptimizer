from flask import Flask
from .config import Config
from .db import db
from .main.routes import main
from .api.routes import api
from .scheduler import scheduler

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Veritabanını Flask uygulaması ile başlatır.
    db.init_app(app)

    # Veritabanı tablolarının oluşturulabilmesi için modelleri içeri aktarır.
    from . import models

    # Uygulama bağlamında, tanımlanan tüm veritabanı tablolarını oluşturur.
    # Bu, uygulama ilk çalıştığında 'kline' tablosunun yaratılmasını sağlar.
    with app.app_context():
        db.create_all()

    # Zamanlanmış görevleri (scheduler) başlatır.
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

    app.register_blueprint(main)
    app.register_blueprint(api, url_prefix='/api')

    return app
