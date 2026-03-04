import os
import random
from app import app, db, Product

# Mapping of dataset subdirectories to categories and cloth types
CATEGORY_MAPPING = {
    "women-black-dresses": {"category": "women", "cloth": "dress", "prefix": "Little Black Dress"},
    "men-polo": {"category": "men", "cloth": "polo", "prefix": "Polo Shirt"},
    "men-shoes": {"category": "men", "cloth": "shoe", "prefix": "Essential Shoe"},
    "men-suits": {"category": "men", "cloth": "suit", "prefix": "Tailored Suit"},
    "women-bags": {"category": "women", "cloth": "bag", "prefix": "Designer Bag"},
    "women-dresses": {"category": "women", "cloth": "dress", "prefix": "Elegant Dress"},
    "women-heels": {"category": "women", "cloth": "heel", "prefix": "Stylish Heel"}
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

            # Group by 2 for img1 and img2
            for i in range(0, len(files), 2):
                # Image files
                img1_file = files[i]
                img2_file = files[i+1] if i+1 < len(files) else ""
                
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
                img1_path = get_webp_if_exists(f"datasets/{subdir}/{img1_file}")
                img2_path = get_webp_if_exists(f"datasets/{subdir}/{img2_file}") if img2_file else ""

                new_product = Product(
                    name=name,
                    description=f"Premium {mapping['cloth']} from our {mapping['category']}'s collection.",
                    price=float(random.randint(45, 1200)),
                    category=mapping['category'],
                    cloth_type=mapping['cloth'],
                    img1=img1_path,
                    img2=img2_path
                )
                db.session.add(new_product)
                products_added += 1

        db.session.commit()
        print(f"Database seeded with {products_added} products from datasets!")

if __name__ == "__main__":
    seed_database()
