/* Mackkas Luxury Product Catalog Logic */

// DOM Elements
const Product_Container = document.querySelector(".product");
const Cart_Drawer = document.getElementById("cartDrawer");
const Cart_Overlay = document.getElementById("cartOverlay");
const Close_Cart_Btn = document.getElementById("close");
const Open_Cart_Btn = document.querySelector(".nav__cart");
const List_Cart = document.querySelector(".list_cart");
const List_Numbers = document.querySelectorAll(".number");
const Subtotal_Displays = document.querySelectorAll(".total");
const Category_Sidebar = document.getElementById("categorySidebar");
const Category_Blocker = document.getElementById("categoryBlocker");
const Category_Open_Btn = document.getElementById("categoryBtn");
const Category_Close_Btn = document.querySelector(".category__close");
const Slider = document.getElementById("range");
const Slide_Value_Display = document.querySelector(".slide-value");
const Item_Search_Input = document.querySelector(".search_input");

// State
let Cart_Items = [];
let All_Products = [];

// Get logged-in user info
const CurrentUser = sessionStorage.getItem("currentUser");
if (CurrentUser) {
    const ParsedUser = JSON.parse(CurrentUser);
    const NameDisplay = document.querySelector(".name_user");
    if (NameDisplay) NameDisplay.textContent = ParsedUser.Name;
}

/**
 * Fetch initial data
 */
async function Initialize() {
    await FetchProducts();
    await FetchCart();
    SetupEventListeners();
}

async function FetchProducts() {
    try {
        const response = await fetch('/api/products');
        All_Products = await response.json();
        GenerateItems(All_Products);
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

async function FetchCart() {
    try {
        const response = await fetch('/api/cart');
        Cart_Items = await response.json();
        UpdateCartUI();
    } catch (error) {
        console.error("Error fetching cart:", error);
    }
}

async function SyncCart() {
    try {
        await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: Cart_Items })
        });
    } catch (error) {
        console.error("Error syncing cart:", error);
    }
}

/**
 * UI Rendering
 */
function GenerateItems(items_to_render) {
    Product_Container.innerHTML = "";
    
    if (items_to_render.length === 0) {
        Product_Container.innerHTML = `<div class="no-results">No products found matching your criteria.</div>`;
        return;
    }

    items_to_render.forEach((item) => {
        const isAdded = Cart_Items.some(cart_item => cart_item.id === item.id);
        const buttonText = isAdded ? "In Cart" : "Add to Cart";
        const buttonClass = isAdded ? "button button--outline" : "button button--primary";

        const productCard = document.createElement('article');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card__image">
                <img src="${item.img1}" alt="${item.name}" class="product-card__img product-card__img--primary">
                <img src="${item.img2 || item.img1}" alt="${item.name}" class="product-card__img product-card__img--hover">
                ${item.Price > 500 ? '<span class="product-card__badge">Premium</span>' : ''}
            </div>
            <div class="product-card__content">
                <span class="product-card__category">${item.category || 'Luxury'}</span>
                <h3 class="product-card__title">${item.name}</h3>
                <div class="product-card__price">$${item.Price}</div>
                <button id="prod-btn-${item.id}" class="product-card__add-to-cart ${buttonClass}" onclick="AddToCart(${item.id})">
                    <iconify-icon icon="lucide:shopping-bag"></iconify-icon>
                    ${buttonText}
                </button>
            </div>
        `;
        Product_Container.appendChild(productCard);
    });
}

async function UpdateCartUI() {
    // Update number badges
    const totalQty = Cart_Items.reduce((acc, curr) => acc + curr.qty, 0);
    List_Numbers.forEach(el => el.textContent = totalQty);

    // Render cart items
    if (Cart_Items.length === 0) {
        List_Cart.innerHTML = `<div class="cart-empty-msg">Your cart is currently empty.</div>`;
    } else {
        List_Cart.innerHTML = Cart_Items.map(item => `
            <div class="cart-item">
                <img src="${item.img1}" alt="${item.name}" class="cart-item__image">
                <div class="cart-item__details">
                    <h3 class="cart-item__title">${item.name}</h3>
                    <p class="cart-item__variant">Unit Price: $${item.Price}</p>
                    <div class="cart-item__quantity">
                        <button class="quantity-btn" onclick="UpdateQuantity(${item.id}, -1)">-</button>
                        <span class="digit">${item.qty}</span>
                        <button class="quantity-btn" onclick="UpdateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item__price-total">$${item.Price * item.qty}</div>
            </div>
        `).join("");
    }
    
    // Update total price displays
    const grandTotal = Cart_Items.reduce((acc, curr) => acc + curr.Price * curr.qty, 0);
    Subtotal_Displays.forEach(el => el.textContent = `$${grandTotal}`);
}

/**
 * Cart Operations
 */
async function AddToCart(id) {
    const item = All_Products.find(p => p.id === id);
    if (!item) return;

    if (Cart_Items.some(cart_item => cart_item.id === id)) {
        ShowToast("alreadyToast");
        return;
    }

    Cart_Items.push({...item, qty: 1});
    UpdateCartUI();
    GenerateItems(All_Products); // Refresh main grid buttons
    await SyncCart();
    OpenCart();
}

async function UpdateQuantity(id, change) {
    const item = Cart_Items.find(item => item.id === id);
    if (!item) return;

    item.qty += change;
    if (item.qty < 1) {
        Cart_Items = Cart_Items.filter(item => item.id !== id);
    }
    
    UpdateCartUI();
    GenerateItems(All_Products); // Refresh main grid buttons
    await SyncCart();
}

async function Buy() {
    if (Cart_Items.length === 0) {
        ShowToast("nothingToast");
        return;
    }

    ShowToast("pendingToast");
    setTimeout(async () => {
        HideToast("pendingToast");
        ShowToast("successToast");
        
        Cart_Items = [];
        await SyncCart();
        UpdateCartUI();
        GenerateItems(All_Products);
        
        setTimeout(() => {
            HideToast("successToast");
            CloseCart();
        }, 2000);
    }, 1500);
}

/**
 * UI Controls
 */
function OpenCart() {
    Cart_Drawer.classList.add("open");
    Cart_Drawer.classList.remove("close_cart");
    Cart_Overlay.classList.add("cart_blocker_show");
}

function CloseCart() {
    Cart_Drawer.classList.remove("open");
    Cart_Drawer.classList.add("close_cart");
    Cart_Overlay.classList.remove("cart_blocker_show");
}

function OpenCategories() {
    Category_Sidebar.classList.add("open");
    Category_Blocker.classList.add("category_blocker_show");
}

function CloseCategories() {
    Category_Sidebar.classList.remove("open");
    Category_Blocker.classList.remove("category_blocker_show");
}

/**
 * Filtering
 */
function filter(selectedFilter) {
    let filtered = All_Products;
    if (selectedFilter !== 'All') {
        const search = selectedFilter.toLowerCase();
        filtered = All_Products.filter(i => 
            (i.category && i.category.toLowerCase() === search) || 
            (i.cloth && i.cloth.toLowerCase() === search)
        );
    }
    
    // Update active state in UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `${selectedFilter}Filter`);
    });

    GenerateItems(filtered);
    CloseCategories();
}

/**
 * Toasts
 */
function ShowToast(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("success", "pending", "not-in-cart", "nothing-in-cart");
}

function HideToast(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("success", "pending", "not-in-cart", "nothing-in-cart");
}

/**
 * Event Listeners
 */
function SetupEventListeners() {
    Open_Cart_Btn.addEventListener("click", OpenCart);
    Close_Cart_Btn.addEventListener("click", CloseCart);
    Cart_Overlay.addEventListener("click", CloseCart);

    Category_Open_Btn.addEventListener("click", OpenCategories);
    Category_Close_Btn.addEventListener("click", CloseCategories);
    Category_Blocker.addEventListener("click", CloseCategories);

    Slider.oninput = () => {
        const val = Slider.value;
        Slide_Value_Display.textContent = "$" + val;
        Slide_Value_Display.classList.add("show");
    };

    Slider.onblur = () => Slide_Value_Display.classList.remove("show");

    Slider.addEventListener("mouseup", () => {
        const filtered = All_Products.filter(item => item.Price <= Slider.value);
        GenerateItems(filtered);
    });

    Item_Search_Input.addEventListener("keyup", () => {
        const query = Item_Search_Input.value.toLowerCase();
        const filtered = All_Products.filter(item => 
            item.name.toLowerCase().includes(query) || 
            (item.desc && item.desc.toLowerCase().includes(query))
        );
        GenerateItems(filtered);
    });
}

// Initalize on load
Initialize();
