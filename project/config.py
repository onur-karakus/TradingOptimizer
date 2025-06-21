# project/config.py
import os

# Proje kök dizinini belirler. 'config.py' dosyasının bulunduğu dizin.
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    
    # Veritabanı yapılandırması.
    # Bu satır, Flask-SQLAlchemy'ye veritabanı dosyasının nerede olduğunu söyler.
    # 'sqlite:///' öneki bir SQLite veritabanı olduğunu belirtir.
    # Geri kalanı ise, projenin ana klasöründe 'trading_data.db' adında bir dosya yolu oluşturur.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.join(basedir, '..')), 'trading_data.db')
        
    # Flask-SQLAlchemy'nin olay sistemini devre dışı bırakarak performansı artırır.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
