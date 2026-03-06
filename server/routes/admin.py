import os
import time
from functools import wraps
from werkzeug.utils import secure_filename
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, current_app
from ..extensions import db
from ..models import Product, User

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login_page'))
        
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
             return "Unauthorized", 403
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'}

def save_upload(file, folder):
    if not file or not file.filename:
        return None
        
    if allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        
        os.makedirs(folder, exist_ok=True)
        save_path = os.path.join(folder, filename)
        file.save(save_path)
        
        return f"images/{filename}"
    return None

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
        price_val = request.form.get('price')
        price = float(price_val) if price_val else 0.0
        
        # Category handling: new_category takes precedence
        category = request.form.get('new_category')
        if not category:
            category = request.form.get('category')
            
        # Product Type handling: new_cloth_type takes precedence
        product_type = request.form.get('new_cloth_type')
        if not product_type:
            product_type = request.form.get('cloth_type')
        
        img1_file = request.files.get('img1')
        img2_file = request.files.get('img2')
        
        img1_path = save_upload(img1_file, current_app.config['UPLOAD_FOLDER'])
        img2_path = save_upload(img2_file, current_app.config['UPLOAD_FOLDER'])

        new_product = Product(
            name=name,
            description=description,
            price=price,
            category=category,
            product_type=product_type,
            primary_image=img1_path or 'images/placeholder.jpg',
            secondary_image=img2_path
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
        price_val = request.form.get('price')
        product.price = float(price_val) if price_val else 0.0
        
        # Category handling: new_category takes precedence
        new_cat = request.form.get('new_category')
        if new_cat:
            product.category = new_cat
        else:
            product.category = request.form.get('category')
            
        # Product Type handling: new_cloth_type takes precedence
        new_type = request.form.get('new_cloth_type')
        if new_type:
            product.product_type = new_type
        else:
            product.product_type = request.form.get('cloth_type')
        
        img1_file = request.files.get('img1')
        img2_file = request.files.get('img2')
        
        new_img1 = save_upload(img1_file, current_app.config['UPLOAD_FOLDER'])
        if new_img1:
            product.primary_image = new_img1
            
        new_img2 = save_upload(img2_file, current_app.config['UPLOAD_FOLDER'])
        if new_img2:
            product.secondary_image = new_img2
        
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
