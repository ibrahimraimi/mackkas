import os
from flask import Blueprint, request, jsonify, url_for, current_app
from ..extensions import db
from ..models import Product

products_bp = Blueprint('products', __name__)

@products_bp.route('/api/products', methods=['GET'])
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category = request.args.get('category')
    cloth_type = request.args.getlist('cloth_type')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    sort = request.args.get('sort', 'featured')
    q = request.args.get('q')
    new_only = request.args.get('new_only') == 'true'

    query = Product.query
    
    if new_only:
        from datetime import datetime, timedelta
        query = query.filter(Product.created_at >= (datetime.utcnow() - timedelta(days=14)))

    if q:
        search = f"%{q}%"
        query = query.filter(db.or_(
            Product.name.ilike(search),
            Product.description.ilike(search),
            Product.category.ilike(search)
        ))

    if category:
        query = query.filter(Product.category == category)
    
    if cloth_type:
        query = query.filter(Product.product_type.in_(cloth_type))
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == 'price-low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price-high':
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    products = pagination.items
    result = []
    for p in products:
        img1 = p.primary_image
        if img1 and not img1.startswith('http'):
            # Check for webp version first
            webp_path = img1.rsplit('.', 1)[0] + '.webp'
            if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
                img1 = webp_path
        
        img2 = p.secondary_image
        if img2 and not img2.startswith('http'):
            webp_path = img2.rsplit('.', 1)[0] + '.webp'
            if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
                img2 = webp_path

        from datetime import datetime, timedelta
        is_new = False
        if p.created_at:
            is_new = p.created_at >= (datetime.utcnow() - timedelta(days=14))

        result.append({
            'id': p.id,
            'name': p.name,
            'desc': p.description,
            'Price': p.price,
            'price': f'${p.price:,.2f}',
            'category': p.category,
            'cloth': p.product_type,
            'img1': url_for('static', filename=img1),
            'img2': url_for('static', filename=img2) if img2 else url_for('static', filename=img1),
            'buy': 'Add to Cart',
            'qty': 1,
            'is_new': is_new
        })

    return jsonify({
        'items': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    })

@products_bp.route('/api/products/meta', methods=['GET'])
def get_products_meta():
    categories = db.session.query(Product.category).distinct().all()
    cloth_types = db.session.query(Product.product_type).distinct().all()
    
    return jsonify({
        'categories': [c[0] for c in categories if c[0]],
        'cloth_types': [t[0] for t in cloth_types if t[0]]
    })

@products_bp.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    p = Product.query.get_or_404(id)
    img1 = p.primary_image
    if img1 and not img1.startswith('http'):
        webp_path = img1.rsplit('.', 1)[0] + '.webp'
        if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
            img1 = webp_path
    
    img2 = p.secondary_image
    if img2 and not img2.startswith('http'):
        webp_path = img2.rsplit('.', 1)[0] + '.webp'
        if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
            img2 = webp_path

    from datetime import datetime, timedelta
    is_new = False
    if p.created_at:
        is_new = p.created_at >= (datetime.utcnow() - timedelta(days=14))

    return jsonify({
        'id': p.id,
        'name': p.name,
        'desc': p.description,
        'Price': p.price,
        'price': f'${p.price:,.2f}',
        'category': p.category,
        'cloth': p.product_type,
        'img1': url_for('static', filename=img1),
        'img2': url_for('static', filename=img2) if img2 else '',
        'buy': 'Add to Cart',
        'qty': 1,
        'is_new': is_new
    })

@products_bp.route('/api/products/<int:id>/related', methods=['GET'])
def get_related_products(id):
    product = Product.query.get_or_404(id)
    related = Product.query.filter(
        Product.category == product.category,
        Product.id != id
    ).limit(4).all()
    
    result = []
    for p in related:
        img1 = p.primary_image
        if img1 and not img1.endswith('.webp'):
            webp_path = img1.rsplit('.', 1)[0] + '.webp'
            if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
                img1 = webp_path
        
        result.append({
            'id': p.id,
            'name': p.name,
            'price': f'${p.price:,.2f}',
            'Price': p.price,
            'category': p.category,
            'img1': url_for('static', filename=img1)
        })
    return jsonify(result)
