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

    from ..models import Category
    if category:
        # Find ALL categories with this name (e.g. 'Accessories' under both Men and Women)
        matching_cats = Category.query.filter(Category.name.ilike(category)).all()
        if matching_cats:
            cat_ids = []
            for cat in matching_cats:
                cat_ids.append(cat.id)
                # Include subcategories for each matching category
                for sub in cat.subcategories:
                    cat_ids.append(sub.id)
            query = query.filter(Product.category_id.in_(cat_ids))
        else:
            # Fallback to legacy string matching
            query = query.filter(Product.category.ilike(category))
    
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
        from datetime import datetime, timedelta
        is_new = False
        if p.created_at:
            is_new = p.created_at >= (datetime.utcnow() - timedelta(hours=24))

        result.append({
            'id': p.id,
            'name': p.name,
            'desc': p.description,
            'Price': p.price,
            'price': f'${p.price:,.2f}',
            'category': p.category,
            'cloth': p.product_type,
            'img1': p.primary_url,
            'img2': p.secondary_url or p.primary_url,
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
    from ..models import Category
    # Get root categories (Men, Women, etc.)
    root_categories = Category.query.filter_by(parent_id=None).all()
    categories_list = [c.name for c in root_categories]
    
    cloth_types = db.session.query(Product.product_type).distinct().all()
    
    return jsonify({
        'categories': categories_list,
        'cloth_types': [t[0] for t in cloth_types if t[0]]
    })

@products_bp.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    p = Product.query.get_or_404(id)
    
    from datetime import datetime, timedelta
    is_new = False
    if p.created_at:
        is_new = p.created_at >= (datetime.utcnow() - timedelta(hours=24))

    return jsonify({
        'id': p.id,
        'name': p.name,
        'desc': p.description,
        'Price': p.price,
        'price': f'${p.price:,.2f}',
        'category': p.category,
        'cloth': p.product_type,
        'img1': p.primary_url,
        'img2': p.secondary_url or '',
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
        result.append({
            'id': p.id,
            'name': p.name,
            'price': f'${p.price:,.2f}',
            'Price': p.price,
            'category': p.category,
            'img1': p.primary_url
        })
    return jsonify(result)

@products_bp.route('/api/products/image/<int:id>/<type>')
def get_product_image(id, type):
    p = Product.query.get_or_404(id)
    if type == 'primary':
        data = p.primary_image_data
        filename = p.primary_image
    else:
        data = p.secondary_image_data
        filename = p.secondary_image
    
    if not data:
        # Fallback to local file if path exists but no data in DB yet
        if filename:
            from flask import send_from_directory
            return send_from_directory(current_app.static_folder, filename)
        return "Not found", 404
    
    import io
    from flask import send_file
    import mimetypes
    
    mimetype = mimetypes.guess_type(filename or 'image.jpg')[0] or 'image/jpeg'
    
    return send_file(
        io.BytesIO(data),
        mimetype=mimetype,
        download_name=filename or f'product_{id}_{type}.jpg'
    )
