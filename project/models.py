# project/models.py
from .extensions import db

class Kline(db.Model):
    """
    Represents a single candlestick data point (kline) for a symbol and interval.
    """
    __tablename__ = 'klines'
    
    # Composite primary key to ensure each kline is unique for its symbol, interval, and time
    symbol = db.Column(db.String(20), primary_key=True)
    interval = db.Column(db.String(10), primary_key=True)
    open_time = db.Column(db.BigInteger, primary_key=True)

    open = db.Column(db.String(32))
    high = db.Column(db.String(32))
    low = db.Column(db.String(32))
    close = db.Column(db.String(32))
    volume = db.Column(db.String(32))

    def __repr__(self):
        return f"<Kline(symbol='{self.symbol}', interval='{self.interval}', open_time={self.open_time})>"
