import json
import os
import uuid
from flask import Flask, request, jsonify, render_template, url_for, send_from_directory
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)

# --- Configuration ---
# Define paths relative to the application root
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'templates')
STATIC_FOLDER = os.path.join(BASE_DIR, 'static')
UPLOAD_FOLDER = os.path.join(STATIC_FOLDER, 'images', 'AnM') # Images will be stored here

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Max upload size (16MB)

# Allowed extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Path to your simulated database file
PRODUCTS_FILE = os.path.join(BASE_DIR, 'products.json')

# --- Helper Functions ---

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_products():
    if not os.path.exists(PRODUCTS_FILE) or os.stat(PRODUCTS_FILE).st_size == 0:
        return []
    with open(PRODUCTS_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {PRODUCTS_FILE}. File might be empty or malformed.")
            return []

def save_products(products):
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(products, f, indent=4)

# Ensure necessary directories and files exist on startup
with app.app_context():
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    if not os.path.exists(PRODUCTS_FILE):
        save_products([]) # Initialize with empty list if not exists

# --- Routes ---

# Route for the main index page
@app.route('/')
def index():
    return render_template('index.html')

# Routes for other HTML pages (using render_template for clarity)
@app.route('/accessories-merchandise.html')
def accessories_merchandise():
    return render_template('accessories-merchandise.html')

@app.route('/spares.html')
def spares():
    return render_template('spares.html')

@app.route('/charging-infrastructure.html')
def charging_infrastructure():
    return render_template('charging-infrastructure.html')

# --- NEW: Route for the Product Management Options Landing Page ---
@app.route('/manage-products-options.html')
def manage_products_options():
    return render_template('manage-products-options.html')

# --- MODIFIED: add-product-form.html now only contains the ADD form ---
@app.route('/add-product-form.html')
def add_product_form():
    return render_template('add-product-form.html')

# --- NEW: Route for the Delete Product Page ---
@app.route('/delete-product.html')
def delete_product_page():
    return render_template('delete-product.html')

# API to get all products (Used by delete-product.html)
@app.route('/api/products', methods=['GET'])
def get_products():
    products = load_products()
    return jsonify(products)

# API to add a new product (Used by add-product-form.html)
@app.route('/api/products', methods=['POST'])
def add_product():
    if not request.form:
        return jsonify({"message": "No form data received."}), 400

    product_name = request.form.get('name')
    part_code = request.form.get('partCode')
    description = request.form.get('description')
    category_id = request.form.get('categoryId')
    model_id = request.form.get('modelId', 'all') # Default to 'all' if not provided

    missing_fields = []
    if not product_name: missing_fields.append('Product Name')
    if not part_code: missing_fields.append('Part Code')
    if not description: missing_fields.append('Description')
    if not category_id: missing_fields.append('Category')

    if missing_fields:
        return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}."}), 400

    uploaded_files = request.files.getlist('images')
    if not uploaded_files or uploaded_files[0].filename == '':
        return jsonify({"message": "No image files selected or uploaded."}), 400

    image_urls = []
    for file in uploaded_files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = str(uuid.uuid4()) + '_' + filename # Prepend UUID for uniqueness
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            try:
                file.save(file_path)
                image_urls.append(url_for('static', filename=f'images/AnM/{unique_filename}'))
            except Exception as e:
                print(f"Error saving image {filename}: {e}")
                return jsonify({"message": f"Error saving image: {filename}. Details: {str(e)}"}), 500
        else:
            return jsonify({"message": f"Invalid file type or no filename for one of the images: {file.filename}"}), 400

    products = load_products()
    new_product_id = str(uuid.uuid4()) # Generate a unique ID for the product

    new_product = {
        "id": new_product_id,
        "name": product_name,
        "partCode": part_code,
        "description": description,
        "images": image_urls,
        "categoryId": category_id,
        "modelId": model_id
    }
    products.append(new_product)
    save_products(products)

    return jsonify({"message": "Product added successfully!", "product": new_product}), 201


# API to DELETE a product (Used by delete-product.html)
@app.route('/api/products/<string:product_id>', methods=['DELETE'])
def delete_product(product_id):
    products = load_products()
    product_to_delete = None
    for i, product in enumerate(products):
        if product.get('id') == product_id:
            product_to_delete = products.pop(i)
            break

    if product_to_delete:
        # Delete associated image files
        for image_url in product_to_delete.get('images', []):
            image_filename = os.path.basename(image_url)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    print(f"Deleted image file: {image_path}")
                except OSError as e:
                    print(f"Error deleting image file {image_path}: {e}")
        
        save_products(products)
        return jsonify({"message": f"Product with ID '{product_id}' and its images deleted successfully."}), 200
    else:
        return jsonify({"message": f"Product with ID '{product_id}' not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)