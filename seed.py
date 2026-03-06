import os
import random
import shutil
from app import app
from server.extensions import db
from server.models import Product, CartItem

# Mapping of dataset subdirectories to categories and product types
CATEGORY_MAPPING = {
    "women-black-dresses": {"category": "women", "product_type": "dress", "prefix": "Little Black Dress", "slug": "black-dress"},
    "men-polo": {"category": "men", "product_type": "polo", "prefix": "Polo Shirt", "slug": "polo-shirt"},
    "men-shoes": {"category": "men", "product_type": "shoe", "prefix": "Essential Shoe", "slug": "essential-shoe"},
    "men-suits": {"category": "men", "product_type": "suit", "prefix": "Tailored Suit", "slug": "tailored-suit"},
    "women-bags": {"category": "women", "product_type": "bag", "prefix": "Designer Bag", "slug": "designer-bag"},
    "women-dresses": {"category": "women", "product_type": "dress", "prefix": "Elegant Dress", "slug": "elegant-dress"},
    "women-heels": {"category": "women", "product_type": "heel", "prefix": "Stylish Heel", "slug": "stylish-heel"}
}

def seed_database():
    with app.app_context():
        # Show active database
        print(f"Seeding database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Clear existing products to ensure a fresh seed
        db.create_all()
        print("Clearing existing products and cart items...")
        CartItem.query.delete()
        Product.query.delete()
        db.session.commit()

        dataset_root = os.path.join("static", "datasets")
        images_dir = os.path.join("static", "images")
        os.makedirs(images_dir, exist_ok=True)

        if not os.path.exists(dataset_root):
            print(f"Dataset directory not found: {dataset_root}")
            return

        products_added = 0
        for subdir, mapping in CATEGORY_MAPPING.items():
            subdir_path = os.path.join(dataset_root, subdir)
            if not os.path.exists(subdir_path):
                continue

            # Filter for image files
            files = [f for f in os.listdir(subdir_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif'))]
            files.sort()

            # Group by 2 for primary and secondary images
            for i in range(0, len(files), 2):
                # Image files
                primary_image_file = files[i]
                secondary_image_file = files[i+1] if i+1 < len(files) else ""
                
                # Product numbering
                product_index = (i // 2) + 1
                name = f"{mapping['prefix']} {product_index}"
                
                # Copy and Rename files to static/images
                def process_image(src_file, suffix):
                    if not src_file: return ""
                    ext = src_file.rsplit('.', 1)[1].lower()
                    new_filename = f"{mapping['slug']}-{product_index}-{suffix}.{ext}"
                    src_path = os.path.join(subdir_path, src_file)
                    dst_path = os.path.join(images_dir, new_filename)
                    
                    # Copy
                    shutil.copy2(src_path, dst_path)
                    
                    return f"images/{new_filename}"

                primary_image_path = process_image(primary_image_file, "primary")
                secondary_image_path = process_image(secondary_image_file, "secondary")

                new_product = Product(
                    name=name,
                    description=f"Premium {mapping['product_type']} from our {mapping['category']}'s collection.",
                    price=float(random.randint(45, 1200)),
                    category=mapping['category'],
                    product_type=mapping['product_type'],
                    primary_image=primary_image_path,
                    secondary_image=secondary_image_path
                )
                db.session.add(new_product)
                products_added += 1

        db.session.commit()
        print(f"Database seeded with {products_added} products. Images stored in static/images/")

if __name__ == "__main__":
    seed_database()
