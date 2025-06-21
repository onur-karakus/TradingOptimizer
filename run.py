# run.py
# Bu dosya, Flask uygulama fabrikasını çağırarak uygulamayı başlatır.
# Uygulamayı çalıştırmak için terminalde 'python run.py' komutunu kullanın.

from project import create_app

app = create_app()

if __name__ == '__main__':
    # debug=False üretim ortamı için daha güvenlidir.
    # Geliştirme sırasında debug=True kullanılabilir.
    app.run(debug=True)
