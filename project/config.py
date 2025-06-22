# project/config.py
import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    # DÜZELTME: Veritabanı yolu, Flask uygulamasının 'instance' klasörünü işaret edecek şekilde güncellendi.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.join(basedir, '..', 'instance')), 'trading_data.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False