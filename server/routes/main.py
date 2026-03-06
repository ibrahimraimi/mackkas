from flask import Blueprint, render_template, redirect, url_for, session
from ..models import Product

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/mackkas')
def product_catalog():
    return render_template('product-catalog.html')

@main_bp.route('/new-in')
def new_in_page():
    return render_template('product-catalog.html', is_new_in=True)

@main_bp.route('/login')
def login_page():
    return render_template('login-page.html')

@main_bp.route('/signup')
def signup_page():
    return render_template('signup-page.html')

@main_bp.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('product-detail.html', product=product, product_id=product_id)

@main_bp.route('/profile')
def profile_page():
    if 'user_id' not in session:
        return redirect(url_for('main.login_page'))
    return render_template('profile-page.html')

@main_bp.route('/search')
def search_page():
    return render_template('search-page.html')

@main_bp.route('/about')
def about_page():
    return render_template('about-page.html')

@main_bp.route('/contact')
def contact_page():
    return render_template('contact-page.html')

@main_bp.route('/shipping')
def shipping_page():
    return render_template('shipping-page.html')

@main_bp.route('/returns')
def returns_page():
    return render_template('returns-page.html')

@main_bp.route('/size-guide')
def size_guide():
    return render_template('size-guide.html')

@main_bp.route('/care-instructions')
def care_instructions():
    return render_template('care-instructions.html')

@main_bp.route('/privacy')
def privacy_page():
    return render_template('privacy-page.html')

@main_bp.route('/terms')
def terms_page():
    return render_template('terms-page.html')

@main_bp.route('/checkout')
def checkout_page():
    if 'user_id' not in session:
        return redirect(url_for('main.login_page'))
    return render_template('checkout-page.html')
