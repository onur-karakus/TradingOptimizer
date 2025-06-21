from flask_sqlalchemy import SQLAlchemy

# Paylaşılan SQLAlchemy veritabanı nesnesini oluşturur.
# Bu nesne, uygulama genelinde veritabanı modelleri ve oturumları
# için tek bir erişim noktası olarak kullanılır.
db = SQLAlchemy()
