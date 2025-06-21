from flask import Blueprint, render_template

# Blueprint nesnesinin adının 'main' olarak ayarlanması,
# __init__.py dosyasındaki 'from .main.routes import main' ifadesiyle
# eşleşmesini ve hatanın giderilmesini sağlar.
main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template("index.html")
