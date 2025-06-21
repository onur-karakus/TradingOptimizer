# project/__init__.py
from flask import Flask
from .config import Config
from .db import db
from .scheduler import scheduler

def create_app(config_class=Config):
    """
    Uygulama fabrikası fonksiyonu. 
    Döngüsel içe aktarmaları önlemek için Blueprint ve model import'ları bu fonksiyonun içine taşındı.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Veritabanını ve diğer eklentileri uygulama ile başlatır.
    db.init_app(app)

    # --- Döngüsel Import Düzeltmesi ---
    # Blueprint'ler ve diğer parçalar, uygulama nesnesi (app) ve db nesnesi
    # oluşturulduktan SONRA içeri aktarılır.
    from .main.routes import main
    from .api.routes import api
 
    # Blueprint'leri uygulamaya kaydeder.
    app.register_blueprint(main)
    app.register_blueprint(api, url_prefix='/api')

    # Uygulama bağlamında (application context) veritabanı tablolarını oluşturur.
    with app.app_context():
        # Hatanın çözümü: 'models' modülü, döngüye girmemesi için
        # uygulama ve veritabanı tamamen hazır olduktan sonra,
        # ancak tablolara ihtiyaç duyulmadan hemen önce burada içeri aktarılır.
        from . import models
        db.create_all()

    # Zamanlayıcıyı (scheduler) başlatır.
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

    return app
