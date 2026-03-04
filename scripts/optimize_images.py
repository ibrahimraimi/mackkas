import os
from PIL import Image
import shutil

def optimize_images():
    base_dir = "static/datasets"
    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} not found.")
        return

    print("Starting image optimization...")
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                file_path = os.path.join(root, file)
                filename, ext = os.path.splitext(file)
                webp_path = os.path.join(root, f"{filename}.webp")
                
                # Only process if webp doesn't exist
                if not os.path.exists(webp_path):
                    try:
                        with Image.open(file_path) as img:
                            # Convert to WebP
                            img.save(webp_path, "WEBP", quality=80)
                            print(f"Converted: {file} -> {filename}.webp")
                            
                            # Optional: Remove original to save space if desired
                            # os.remove(file_path)
                    except Exception as e:
                        print(f"Error processing {file}: {e}")
                else:
                    print(f"Skipping (already exists): {filename}.webp")

if __name__ == "__main__":
    optimize_images()
