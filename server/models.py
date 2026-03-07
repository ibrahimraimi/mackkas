from .extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    
    __table_args__ = (db.UniqueConstraint('name', 'parent_id', name='_category_name_parent_uc'),)
    
    parent = db.relationship('Category', remote_side=[id], backref='subcategories')
    products = db.relationship('Product', backref='category_rel', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100)) # Legacy string field
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    product_type = db.Column(db.String(100))
    primary_image = db.Column(db.String(500))
    secondary_image = db.Column(db.String(500))
    primary_image_data = db.Column(db.LargeBinary)
    secondary_image_data = db.Column(db.LargeBinary)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def primary_url(self):
        if self.primary_image_data:
            from flask import url_for
            return url_for('products.get_product_image', id=self.id, type='primary', _external=True)
        return self._resolve_image_url(self.primary_image)

    @property
    def secondary_url(self):
        if self.secondary_image_data:
            from flask import url_for
            return url_for('products.get_product_image', id=self.id, type='secondary', _external=True)
        return self._resolve_image_url(self.secondary_image)

    def _resolve_image_url(self, image_path):
        if not image_path:
            return None
        
        # If it's already a full URL, return it
        if image_path.startswith(('http://', 'https://')):
            return image_path
            
        from flask import current_app, url_for
        import os

        # If BASE_IMAGE_URL is configured, prepend it
        base_url = current_app.config.get('BASE_IMAGE_URL')
        if base_url:
            return f"{base_url.rstrip('/')}/{image_path.lstrip('/')}"

        # Otherwise, serve from static folder with local path check
        # Check for webp version for local files
        try:
            webp_path = image_path.rsplit('.', 1)[0] + '.webp'
            if os.path.exists(os.path.join(current_app.static_folder, webp_path)):
                return url_for('static', filename=webp_path)
        except Exception:
            pass

        return url_for('static', filename=image_path)

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    product = db.relationship('Product', backref='cart_items')
