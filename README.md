📊 TradingOptimizer Pro
TradingOptimizer Pro, kripto para piyasaları için modern web teknolojileri kullanılarak geliştirilmiş gelişmiş bir finansal analiz ve grafik platformudur. Kullanıcıların, çeşitli teknik göstergelerle donatılmış ayrıntılı ve etkileşimli mum grafikleri sağlayarak ticaret stratejilerini test etmelerine ve geliştirmelerine yardımcı olur.
Flask tabanlı bir Python arka ucu ve modüler bir JavaScript ön ucu kullanılarak sağlam ve ölçeklenebilir bir temel üzerine inşa edilmiştir.
✨ Temel Özellikler
Etkileşimli Mum Grafikleri: ApexCharts ile oluşturulmuş, akıcı, yakınlaştırılabilir ve kaydırılabilir grafikler.
Geniş Teknik Gösterge Desteği: EMA, Bollinger Bantları, RSI, MACD, Hacim ve daha fazlası.
Özelleştirilebilir Göstergeler: Tüm göstergeler, periyot ve uzunluk gibi ayarlara gerçek zamanlı olarak sahiptir.
Veritabanı Merkezli Mimari: Tüm grafik verileri, hızlı ve tutarlı bir deneyim için yerel SQLite veritabanından sunulur.
Otomatik Veri Senkronizasyonu: Arka planda çalışan zamanlayıcı, piyasa verilerini periyodik olarak Binance API'sinden çeker ve yerel veritabanını güncel tutar.
🏗️ Veri Akış Mimarisi
Uygulama, veritabanı merkezli bir yaklaşımla çalışır. Kullanıcı arayüzüne sunulan veriler her zaman yerel veritabanından gelir. Harici API'ler yalnızca bu veritabanını doldurmak ve güncellemek için kullanılır.
graph TD
    subgraph "Kurulum (Tek Seferlik)"
        U[Kullanıcı] -- "flask fetch-data" --> C[Flask CLI]
        C --> DF1[data_fetcher.py]
        DF1 -- "Tarihsel Veri İsteği" --> BA[Binance API]
        BA --> DF1
        DF1 -- "Toplu Kayıt" --> DB[(SQLite Veritabanı)]
    end

    subgraph "Periyodik Güncelleme (Arka Plan)"
        S[APScheduler] -- "Her 1-60dk'da bir tetikler" --> J[Senkronizasyon Görevi]
        J --> DF2[data_fetcher.py]
        DF2 -- "Sadece Yeni Verileri İste" --> BA
        BA --> DF2
        DF2 -- "Yeni Verileri Ekle" --> DB
    end

    subgraph "Kullanıcı Etkileşimi (Grafik Yükleme)"
        FE[Frontend] -- "GET /api/klines" --> API[Flask API]
        API -- "SELECT * FROM klines" --> DB
        DB -- "Kline Verileri" --> API
        API -- "JSON Yanıtı" --> FE
    end

    style DB fill:#cde,stroke:#333,stroke-width:2px


🛠️ Kullanılan Teknolojiler
Arka Uç (Backend)
Python 3
Flask – Esnek ve hafif web çatısı
Flask-APScheduler – Arka plan işleri ve periyodik görevler için
Flask-SQLAlchemy - ORM ile veritabanı yönetimi
SQLite – Geliştirme için sunucusuz veritabanı
Requests – Binance API'sine HTTP istekleri göndermek için
Ön Uç (Frontend)
Vanilla JavaScript (ES6+ Modülleri)
ApexCharts.js – Etkileşimli grafik kütüphanesi
Lucide Icons – Modern ve temiz ikon seti
HTML5 & CSS3 – Duyarlı ve modern arayüz
🚀 Kurulum ve Çalıştırma
Bu projeyi yerel olarak çalıştırmak için aşağıdaki adımları izleyin.
Gereksinimler
Python 3.8+
pip ve venv
Adımlar
# Depoyu klonlayın
git clone [https://github.com/onur-karakus/tradingoptimizer.git](https://github.com/onur-karakus/tradingoptimizer.git)
cd tradingoptimizer

# Sanal ortam oluşturun ve etkinleştirin
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# 1. Adım: Tarihsel veriyi çekin
# Bu komut, tüm desteklenen pariteler için veritabanını doldurur.
flask fetch-data

# 2. Adım: Uygulamayı çalıştırın
# Bu komut web sunucusunu ve arka plan güncelleyiciyi başlatır.
python run.py


Tarayıcınızda http://127.0.0.1:5000 adresini ziyaret edin.
🗺️ Gelecek Geliştirmeler (Yol Haritası)
Kullanıcılar için çizim araçları (trend çizgileri, fibonacci vb.)
WebSocket ile canlı veri akışı entegrasyonu
Kullanıcı hesapları ve kişisel izleme listeleri
Strateji testleri için Backtesting modülü
