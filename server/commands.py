import click
from flask.cli import with_appcontext
from .extensions import db
from .models import User
from werkzeug.security import generate_password_hash

@click.command('create-admin')
@click.argument('username')
@click.argument('email')
@click.argument('password')
@with_appcontext
def create_admin(username, email, password):
    """Create a new admin user or promote an existing one."""
    user = User.query.filter_by(username=username).first()
    
    if user:
        # If user exists, promote them to admin
        user.is_admin = True
        try:
            db.session.commit()
            click.echo(f"User '{username}' already exists. Promoted to administrator!")
        except Exception as e:
            db.session.rollback()
            click.echo(f"Error promoting user: {e}")
        return

    # Check email uniqueness for new user
    if User.query.filter_by(email=email).first():
        click.echo(f"Error: User with email '{email}' already exists.")
        return

    hashed_password = generate_password_hash(password)
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        is_admin=True
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        click.echo(f"Admin user '{username}' created successfully!")
    except Exception as e:
        db.session.rollback()
        click.echo(f"Error creating admin user: {e}")
