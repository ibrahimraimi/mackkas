import os
from flask import Flask, request
from .extensions import db, migrate
from .routes.main import main_bp
from .routes.auth import auth_bp
from .routes.products import products_bp
from .routes.user import user_bp
from .routes.admin import admin_bp

def create_app():
    app = Flask(__name__, 
                static_folder='../static', 
                template_folder='../templates')
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Database configuration
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Flask-SQLAlchemy/PostgreSQL compatibility for old 'postgres://' URL
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    elif os.environ.get('FLASK_ENV') == 'production':
        db_path = os.path.join(app.root_path, '../db', 'mackkas.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.abspath(db_path)}'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../instance/mackkas.db'
    
    # Upload configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, '../static/uploads/products')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)

    # Register CLI commands
    from .commands import create_admin
    app.cli.add_command(create_admin)

    # Cache control for static assets
    @app.after_request
    def add_header(response):
        if 'Cache-Control' not in response.headers:
            if request.path.startswith('/static/'):
                response.headers['Cache-Control'] = 'public, max-age=31536000'
        return response

    # Remove dynamic create_all as we use migrations now
    # with app.app_context():
    #     db.create_all()

    return app
