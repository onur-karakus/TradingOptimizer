# project/main/routes.py
# Ana uygulama route'larını (örn. anasayfa) içeren Blueprint.

from flask import Blueprint, render_template

# 'main' adında bir Blueprint oluştur
main_bp = Blueprint('main', __name__, template_folder='../templates')

@main_bp.route('/')
def index():
    """Ana sayfayı render eder."""
    # templates klasöründeki index.html dosyasını döndürür.
    return render_template('index.html')
