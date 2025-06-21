# project/__init__.py
# Bu dosya, "Application Factory" deseni kullanarak Flask uygulamasını oluşturur ve yapılandırır.

import os
from flask import Flask
from .scheduler import scheduler

def create_app():
    """Flask uygulama örneğini oluşturur ve yapılandırır."""
    app = Flask(__name__, instance_relative_config=True)

    # Konfigürasyonu yükle
    app.config.from_object('project.config.Config')

    # 'instance' klasörünün var olduğundan emin ol
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass # Klasör zaten varsa devam et

    # Veritabanı fonksiyonlarını ve CLI komutlarını kaydet
    from . import db
    db.init_app(app)

    # --- HATA DÜZELTME: OTOMATİK VERİTABANI OLUŞTURMA ---
    # Uygulama her başladığında, veritabanı tablolarının var olduğundan emin ol.
    # Bu, 'no such table: klines' hatasını önler.
    with app.app_context():
        db.init_db()
        print("Veritabanı bağlantısı ve tabloları kontrol edildi.")
    # --- DÜZELTME SONU ---

    # Arka plan görev zamanlayıcısını başlat
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

    # Blueprints'leri kaydet
    from .main import routes as main_routes
    app.register_blueprint(main_routes.main_bp)

    from .api import routes as api_routes
    app.register_blueprint(api_routes.api_bp, url_prefix='/api')

    print("Uygulama başarıyla oluşturuldu.")
    print(f"Kayıtlı Blueprints: {list(app.blueprints.keys())}")
    print(f"Zamanlayıcı durumu: {'Çalışıyor' if scheduler.running else 'Durdu'}")

    return app
