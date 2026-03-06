from .extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    product_type = db.Column(db.String(100))
    primary_image = db.Column(db.String(500))
    secondary_image = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def primary_url(self):
        return self._resolve_image_url(self.primary_image)

    @property
    def secondary_url(self):
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
