from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from ..extensions import db
from ..models import Product, User
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Basic check for now; in a real app, you'd check a 'role' column
        if 'user_id' not in session:
            return redirect(url_for('main.login_page'))
        
        user = User.query.get(session['user_id'])
        if not user or user.username != 'admin': # Simplistic admin check
             return "Unauthorized", 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@admin_required
def dashboard():
    product_count = Product.query.count()
    user_count = User.query.count()
    return render_template('admin/dashboard.html', 
                            product_count=product_count, 
                            user_count=user_count)

@admin_bp.route('/products')
@admin_required
def products():
    all_products = Product.query.order_by(Product.id.desc()).all()
    return render_template('admin/products.html', products=all_products)

@admin_bp.route('/products/add', methods=['GET', 'POST'])
@admin_required
def add_product():
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        price = float(request.form.get('price'))
        category = request.form.get('category')
        cloth_type = request.form.get('cloth_type')
        img1 = request.form.get('img1')
        img2 = request.form.get('img2')

        new_product = Product(
            name=name,
            description=description,
            price=price,
            category=category,
            cloth_type=cloth_type,
            img1=img1,
            img2=img2
        )
        db.session.add(new_product)
        db.session.commit()
        return redirect(url_for('admin.products'))
    
    return render_template('admin/product_form.html', title="Add Product")

@admin_bp.route('/products/edit/<int:id>', methods=['GET', 'POST'])
@admin_required
def edit_product(id):
    product = Product.query.get_or_404(id)
    if request.method == 'POST':
        product.name = request.form.get('name')
        product.description = request.form.get('description')
        product.price = float(request.form.get('price'))
        product.category = request.form.get('category')
        product.cloth_type = request.form.get('cloth_type')
        product.img1 = request.form.get('img1')
        product.img2 = request.form.get('img2')
        
        db.session.commit()
        return redirect(url_for('admin.products'))
    
    return render_template('admin/product_form.html', product=product, title="Edit Product")

@admin_bp.route('/products/delete/<int:id>', methods=['POST'])
@admin_required
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return redirect(url_for('admin.products'))
