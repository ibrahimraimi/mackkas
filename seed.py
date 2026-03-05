import os
import random
from app import app
from server.extensions import db
from server.models import Product

# Mapping of dataset subdirectories to categories and product types
CATEGORY_MAPPING = {
    "women-black-dresses": {"category": "women", "product_type": "dress", "prefix": "Little Black Dress"},
    "men-polo": {"category": "men", "product_type": "polo", "prefix": "Polo Shirt"},
    "men-shoes": {"category": "men", "product_type": "shoe", "prefix": "Essential Shoe"},
    "men-suits": {"category": "men", "product_type": "suit", "prefix": "Tailored Suit"},
    "women-bags": {"category": "women", "product_type": "bag", "prefix": "Designer Bag"},
    "women-dresses": {"category": "women", "product_type": "dress", "prefix": "Elegant Dress"},
    "women-heels": {"category": "women", "product_type": "heel", "prefix": "Stylish Heel"}
}

def seed_database():
    with app.app_context():
        # Show active database
        print(f"Seeding database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Clear existing products to ensure a fresh seed
        db.create_all()
        print("Clearing existing products...")
        Product.query.delete()
        db.session.commit()

        dataset_dir = os.path.join("static", "datasets")
        if not os.path.exists(dataset_dir):
            print(f"Dataset directory not found: {dataset_dir}")
            return

        products_added = 0
        for subdir, mapping in CATEGORY_MAPPING.items():
            subdir_path = os.path.join(dataset_dir, subdir)
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
                
                # Product name
                product_index = (i // 2) + 1
                name = f"{mapping['prefix']} {product_index}"
                
                # Use webp if available
                def get_webp_if_exists(rel_path):
                    webp_rel = rel_path.rsplit('.', 1)[0] + '.webp'
                    if os.path.exists(os.path.join("static", webp_rel)):
                        return webp_rel
                    return rel_path

                # Image paths relative to the static directory
                primary_image_path = get_webp_if_exists(f"datasets/{subdir}/{primary_image_file}")
                secondary_image_path = get_webp_if_exists(f"datasets/{subdir}/{secondary_image_file}") if secondary_image_file else ""

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
        print(f"Database seeded with {products_added} products from datasets!")

if __name__ == "__main__":
    seed_database()
