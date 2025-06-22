# run.py
from project import create_app
import os

# instance klasörünün var olup olmadığını kontrol et ve yoksa oluştur.
if not os.path.exists('instance'):
    os.makedirs('instance')

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
