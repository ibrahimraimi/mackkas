from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mackkas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    cloth_type = db.Column(db.String(50))
    img1 = db.Column(db.String(200))
    img2 = db.Column(db.String(200))

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    product = db.relationship('Product', backref='cart_items')

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mackkas')
def product_catalog():
    return render_template('product-catalog.html')

@app.route('/login')
def login_page():
    return render_template('login-page.html')

@app.route('/signup')
def signup_page():
    return render_template('signup-page.html')

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    return render_template('product-detail.html', product_id=product_id)

@app.route('/profile')
def profile_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('profile-page.html')

@app.route('/search')
def search_page():
    return render_template('search-page.html')

@app.route('/about')
def about_page():
    return render_template('about-page.html')

@app.route('/contact')
def contact_page():
    return render_template('contact-page.html')

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Account created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({'message': 'Login successful', 'user': {'username': user.username}}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    user = User.query.get(session['user_id'])
    return jsonify({
        'username': user.username,
        'email': user.email
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'desc': p.description,
        'Price': p.price,
        'price': f'${p.price}',
        'category': p.category,
        'cloth': p.cloth_type,
        'img1': f'/static/images/{p.img1.split("/")[-1]}',
        'img2': f'/static/images/{p.img2.split("/")[-1]}' if p.img2 else '',
        'buy': 'Add to Cart',
        'qty': 1
    } for p in products])

@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    p = Product.query.get_or_404(id)
    return jsonify({
        'id': p.id,
        'name': p.name,
        'desc': p.description,
        'Price': p.price,
        'price': f'${p.price}',
        'category': p.category,
        'cloth': p.cloth_type,
        'img1': f'/static/images/{p.img1.split("/")[-1]}',
        'img2': f'/static/images/{p.img2.split("/")[-1]}' if p.img2 else '',
        'buy': 'Add to Cart',
        'qty': 1
    })

@app.route('/api/cart', methods=['GET'])
def get_cart():
    if 'user_id' not in session:
        return jsonify([]), 200  # Return empty cart for guests
    cart_items = CartItem.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{
        'id': item.product.id,
        'name': item.product.name,
        'price': f'${item.product.price}',
        'Price': item.product.price,
        'qty': item.quantity,
        'img1': f'/static/images/{item.product.img1}'
    } for item in cart_items])

@app.route('/api/cart', methods=['POST'])
def update_cart():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    # Simple clear and re-add for simplicity in this prototype improvement
    CartItem.query.filter_by(user_id=session['user_id']).delete()
    for item in data.get('items', []):
        cart_item = CartItem(
            user_id=session['user_id'],
            product_id=item['id'],
            quantity=item['qty']
        )
        db.session.add(cart_item)
    db.session.commit()
    return jsonify({'message': 'Cart updated successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
