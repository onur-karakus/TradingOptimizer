# project/__init__.py
import os
from flask import Flask
from .extensions import db
from .config import Config
from .main.routes import main as main_blueprint
from .api.routes import api as api_blueprint
from .scheduler import scheduler
import data_fetcher

def create_app(config_class=Config):
    """
    Application factory, used to create and configure the Flask application.
    """
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)
    
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    
    if not scheduler.running:
      scheduler.init_app(app)
      scheduler.start()

    app.register_blueprint(main_blueprint)
    app.register_blueprint(api_blueprint, url_prefix='/api')

    with app.app_context():
        from . import models

        @app.cli.command("init-db")
        def init_db_command():
            """Mevcut veritabanını siler ve tabloları yeniden oluşturur."""
            db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
            if db_uri and db_uri.startswith("sqlite:///"):
                db_path = db_uri.split('sqlite:///')[1]
                if os.path.exists(db_path):
                    print(f"Mevcut veritabanı siliniyor: {db_path}")
                    os.remove(db_path)
                else:
                    print("Silinecek veritabanı dosyası bulunamadı, yine de devam ediliyor.")
            
            print("Tablolar yeniden oluşturuluyor...")
            db.create_all()
            print("Veritabanı başarıyla sıfırlandı ve tablolar oluşturuldu.")


        @app.cli.command("fetch-data")
        def fetch_all_data_command():
            """Tüm desteklenen semboller ve aralıklar için tarihsel verileri çeker."""
            print("Tarihsel veriler çekiliyor...")
            data_fetcher.run_full_fetch()
            print("Veri çekme işlemi tamamlandı.")

    return app
