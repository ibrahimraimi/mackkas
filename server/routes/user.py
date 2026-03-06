from flask import Blueprint, request, jsonify, session, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..models import User, CartItem

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/order/complete', methods=['POST'])
def complete_order():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    CartItem.query.filter_by(user_id=session['user_id']).delete()
    db.session.commit()
    return jsonify({'message': 'Order placed successfully', 'order_id': 'MKK-827394'}), 200

@user_bp.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    user = User.query.get(session['user_id'])
    return jsonify({
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin
    })

@user_bp.route('/api/user/orders', methods=['GET'])
def get_user_orders():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify([
        {
            'id': 'MKK-827394',
            'date': 'March 03, 2026',
            'status': 'Processing',
            'total': '$1,250.00',
            'items': 2
        },
        {
            'id': 'MKK-716253',
            'date': 'Feb 15, 2026',
            'status': 'Delivered',
            'total': '$420.00',
            'items': 1
        }
    ])

@user_bp.route('/api/user/addresses', methods=['GET'])
def get_user_addresses():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify([
        {
            'id': 1,
            'type': 'Home',
            'name': 'Ibrahim Raimi',
            'street': '123 Minimalist Way',
            'city': 'London',
            'postal': 'E1 6AN',
            'default': True
        }
    ])

@user_bp.route('/api/user/payments', methods=['GET'])
def get_user_payments():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify([
        {
            'id': 1,
            'brand': 'Visa',
            'last4': '4242',
            'expiry': '12/28',
            'default': True
        }
    ])

@user_bp.route('/api/user/activity', methods=['GET'])
def get_user_activity():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    return jsonify([
        {'id': 1, 'type': 'order', 'desc': 'Placed order MKK-827394', 'time': '2 hours ago'},
        {'id': 2, 'type': 'security', 'desc': 'Password changed successfully', 'time': '2 days ago'},
        {'id': 3, 'type': 'account', 'desc': 'Joined Mackkas Membership', 'time': 'March 2026'}
    ])

@user_bp.route('/api/cart', methods=['GET'])
def get_cart():
    if 'user_id' not in session:
        return jsonify([]), 200
    cart_items = CartItem.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{
        'id': item.product.id,
        'name': item.product.name,
        'price': f'${item.product.price}',
        'Price': item.product.price,
        'qty': item.quantity,
        'img1': url_for('static', filename=item.product.img1)
    } for item in cart_items])

@user_bp.route('/api/cart', methods=['POST'])
def update_cart():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
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

@user_bp.route('/api/user/settings', methods=['POST'])
def update_user_settings():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    user = User.query.get(session['user_id'])
    
    if data.get('username') != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already taken'}), 400
        user.username = data['username']
        session['username'] = user.username
        
    if data.get('email') != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already taken'}), 400
        user.email = data['email']
        
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': {'username': user.username, 'email': user.email}}), 200

@user_bp.route('/api/user/password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    user = User.query.get(session['user_id'])
    
    if not check_password_hash(user.password_hash, data['currentPassword']):
        return jsonify({'message': 'Incorrect current password'}), 400
    
    if data['newPassword'] != data['confirmPassword']:
        return jsonify({'message': 'Passwords do not match'}), 400
        
    user.password_hash = generate_password_hash(data['newPassword'])
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200
