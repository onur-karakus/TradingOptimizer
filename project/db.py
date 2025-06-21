# project/db.py
# Veritabanı bağlantısı ve başlatma işlemleri.

import sqlite3
import click
from flask import current_app, g
from flask.cli import with_appcontext

def get_db():
    """Mevcut uygulama bağlamı için veritabanı bağlantısını açar."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            # timeout parametresi kilitlenme durumunda bir süre beklemeyi sağlar.
            timeout=10, 
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
        
        # --- EN ÖNEMLİ DÜZELTME ---
        # 'Write-Ahead Logging' (WAL) modu etkinleştirildi.
        # Bu mod, veritabanına aynı anda hem yazma hem de okuma işlemi yapılmasına
        # olanak tanır. Bu sayede, scheduler veritabanına yazarken web isteğinin
        # 'database is locked' hatası alması ve 500 hatası vermesi engellenir.
        g.db.execute("PRAGMA journal_mode=WAL;")

    return g.db

def close_db(e=None):
    """Veritabanı bağlantısını kapatır."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Veritabanı tablolarını (şemasını) oluşturur."""
    db = get_db()
    # 'klines' tablosu yoksa oluştur. Bu tablo mum verilerini saklar.
    db.execute('''
        CREATE TABLE IF NOT EXISTS klines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            interval TEXT NOT NULL,
            open_time INTEGER NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            volume REAL NOT NULL,
            UNIQUE(symbol, interval, open_time)
        )
    ''')
    # (symbol, interval, open_time) sütunları için index oluşturarak sorgu performansını artır.
    db.execute('CREATE INDEX IF NOT EXISTS idx_symbol_interval_time ON klines (symbol, interval, open_time);')
    print("Veritabanı tabloları ve indexleri başarıyla oluşturuldu/kontrol edildi.")

@click.command('init-db')
@with_appcontext
def init_db_command():
    """'flask init-db' komutunu terminalde çalıştırarak veritabanını başlatır."""
    init_db()
    click.echo('Veritabanı başarıyla başlatıldı.')

def init_app(app):
    """Flask uygulaması ile veritabanı fonksiyonlarını entegre eder."""
    app.teardown_appcontext(close_db) 
    app.cli.add_command(init_db_command)
