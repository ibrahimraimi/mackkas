import os
import time
from functools import wraps
from werkzeug.utils import secure_filename
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, current_app
from ..extensions import db
from ..models import Product, User, Category

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

def save_upload(file):
    if not file or not file.filename:
        return None, None
        
    if allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        
        # We don't save to disk anymore, just return filename and data
        data = file.read()
        return filename, data
    return None, None

@admin_bp.route('/')
@admin_required
def dashboard():
    product_count = Product.query.count()
    user_count = User.query.count()
    category_count = Category.query.count()
    
    # Simple seed for Men/Women if they don't exist
    if Category.query.filter_by(name='Men').first() is None:
        db.session.add(Category(name='Men'))
    if Category.query.filter_by(name='Women').first() is None:
        db.session.add(Category(name='Women'))
    db.session.commit()
    
    return render_template('admin/dashboard.html', 
                            product_count=product_count, 
                            user_count=user_count,
                            category_count=Category.query.count())

@admin_bp.route('/products')
@admin_required
def products():
    page = request.args.get('page', 1, type=int)
    pagination = Product.query.order_by(Product.id.desc()).paginate(page=page, per_page=12, error_out=False)
    return render_template('admin/products.html', products=pagination.items, pagination=pagination)

@admin_bp.route('/categories')
@admin_required
def categories():
    categories = Category.query.all()
    # Separate root categories and subcategories for the form
    root_categories = Category.query.filter_by(parent_id=None).all()
    return render_template('admin/categories.html', categories=categories, root_categories=root_categories)

@admin_bp.route('/categories/add', methods=['POST'])
@admin_required
def add_category():
    name = request.form.get('name')
    parent_id = request.form.get('parent_id')
    
    if name:
        new_cat = Category(name=name)
        if parent_id:
            new_cat.parent_id = int(parent_id)
        db.session.add(new_cat)
        db.session.commit()
    
    return redirect(url_for('admin.categories'))

@admin_bp.route('/categories/delete/<int:id>', methods=['POST'])
@admin_required
def delete_category(id):
    category = Category.query.get_or_404(id)
    # Orphaning products
    Product.query.filter_by(category_id=id).update({Product.category_id: None})
    
    db.session.delete(category)
    db.session.commit()
    return redirect(url_for('admin.categories'))

@admin_bp.route('/products/add', methods=['GET', 'POST'])
@admin_required
def add_product():
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        price_val = request.form.get('price')
        price = float(price_val) if price_val else 0.0
        product_type = request.form.get('cloth_type')
        
        img1_file = request.files.get('img1')
        img2_file = request.files.get('img2')
        
        img1_path, img1_data = save_upload(img1_file)
        img2_path, img2_data = save_upload(img2_file)
        
        category_id = request.form.get('category_id') or None
        legacy_category = 'other'
        if category_id:
            category_id = int(category_id)
            cat_obj = Category.query.get(category_id)
            if cat_obj:
                legacy_category = cat_obj.name.lower()

        new_product = Product(
            name=name,
            description=description,
            price=price,
            category=legacy_category,
            category_id=category_id,
            product_type=product_type,
            primary_image=img1_path or 'images/placeholder.jpg',
            primary_image_data=img1_data,
            secondary_image=img2_path,
            secondary_image_data=img2_data
        )
        db.session.add(new_product)
        db.session.commit()
        return redirect(url_for('admin.products'))
    
    categories = Category.query.filter_by(parent_id=None).all()
    return render_template('admin/product_form.html', title="Add Product", categories=categories)

@admin_bp.route('/products/edit/<int:id>', methods=['GET', 'POST'])
@admin_required
def edit_product(id):
    product = Product.query.get_or_404(id)
    if request.method == 'POST':
        product.name = request.form.get('name')
        product.description = request.form.get('description')
        price_val = request.form.get('price')
        product.price = float(price_val) if price_val else 0.0
        product.product_type = request.form.get('cloth_type')
        
        img1_file = request.files.get('img1')
        img2_file = request.files.get('img2')
        
        new_img1, img1_data = save_upload(img1_file)
        if new_img1:
            product.primary_image = new_img1
            product.primary_image_data = img1_data
            
        new_img2, img2_data = save_upload(img2_file)
        if new_img2:
            product.secondary_image = new_img2
            product.secondary_image_data = img2_data
            
        category_id = request.form.get('category_id') or None
        if category_id:
            category_id = int(category_id)
            product.category_id = category_id
            cat_obj = Category.query.get(category_id)
            if cat_obj:
                product.category = cat_obj.name.lower()
        
        db.session.commit()
        return redirect(url_for('admin.products'))
    
    categories = Category.query.filter_by(parent_id=None).all()
    return render_template('admin/product_form.html', product=product, title="Edit Product", categories=categories)

@admin_bp.route('/products/delete/<int:id>', methods=['POST'])
@admin_required
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return redirect(url_for('admin.products'))
