const Product_Grid = document.getElementById("productGrid");
const Cart_Drawer = document.getElementById("cartDrawer");
const Cart_Overlay = document.getElementById("cartOverlay");
const Cart_Items_Container = document.getElementById("cartItemsContainer");
const Cart_Count_Badges = document.querySelectorAll("#cartCountBadge");
const Cart_Subtotal_Display = document.getElementById("cartSubtotal");
const Product_Count_Text = document.getElementById("productCountText");

// Filter Elements
const Filter_Drawer = document.getElementById("filterDrawer");
const Filter_Overlay = document.getElementById("filterOverlay");
const Category_Pill_List = document.getElementById("categoryPillList");
const Category_Filter_Options = document.getElementById("categoryFilterOptions");
const Cloth_Type_Filter_Options = document.getElementById("clothTypeFilterOptions");
const Min_Price_Input = document.getElementById("minPrice");
const Max_Price_Input = document.getElementById("maxPrice");
const Current_Category_Title = document.getElementById("currentCategoryTitle");

let All_Products = [];
let Cart_Items = [];
let Active_Filters = {
    category: null,
    clothType: [],
    minPrice: null,
    maxPrice: null
};

// Initialize
async function Init() {
    await FetchProducts();
    await FetchCart();
    SetupCategories();
    RenderProducts(All_Products);
}

async function FetchProducts() {
    try {
        const response = await fetch('/api/products');
        All_Products = await response.json();
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

function SetupCategories() {
    const categories = [...new Set(All_Products.map(p => p.category))];
    const clothTypes = [...new Set(All_Products.map(p => p.cloth))];

    // Render pills
    if (Category_Pill_List) {
        Category_Pill_List.innerHTML = `
            <div class="category-pill active" onclick="SetCategory(null, this)">All</div>
            ${categories.map(cat => `<div class="category-pill" onclick="SetCategory('${cat}', this)">${cat}</div>`).join("")}
        `;
    }

    // Render filter drawer options
    if (Category_Filter_Options) {
        Category_Filter_Options.innerHTML = categories.map(cat => `
            <div class="filter-option" onclick="ToggleFilter('category', '${cat}', this)">${cat}</div>
        `).join("");
    }

    if (Cloth_Type_Filter_Options) {
        Cloth_Type_Filter_Options.innerHTML = clothTypes.map(type => `
            <div class="filter-option" onclick="ToggleFilter('clothType', '${type}', this)">${type}</div>
        `).join("");
    }
}

function ToggleFilterMenu() {
    Filter_Drawer.classList.toggle("close_cart");
    Filter_Drawer.classList.toggle("open_filters");
    Filter_Overlay.classList.toggle("cart_blocker_hide");
    document.body.style.overflow = Filter_Drawer.classList.contains("open_filters") ? "hidden" : "";
}

function SetCategory(cat, el) {
    Active_Filters.category = cat;
    
    // Update pills UI
    document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
    el.classList.add("active");

    Current_Category_Title.textContent = cat ? `${cat.charAt(0).toUpperCase() + cat.slice(1)} Collection` : "All Collection";
    
    ApplyFilters();
}

function ToggleFilter(type, value, el) {
    if (type === 'category') {
        Active_Filters.category = Active_Filters.category === value ? null : value;
    } else if (type === 'clothType') {
        const index = Active_Filters.clothType.indexOf(value);
        if (index > -1) Active_Filters.clothType.splice(index, 1);
        else Active_Filters.clothType.push(value);
    }
    el.classList.toggle("active");
}

function ApplyFilters() {
    Active_Filters.minPrice = Min_Price_Input.value ? parseFloat(Min_Price_Input.value) : null;
    Active_Filters.maxPrice = Max_Price_Input.value ? parseFloat(Max_Price_Input.value) : null;

    let filtered = All_Products.filter(product => {
        const matchesCategory = !Active_Filters.category || product.category === Active_Filters.category;
        const matchesCloth = Active_Filters.clothType.length === 0 || Active_Filters.clothType.includes(product.cloth);
        const matchesMinPrice = !Active_Filters.minPrice || product.Price >= Active_Filters.minPrice;
        const matchesMaxPrice = !Active_Filters.maxPrice || product.Price <= Active_Filters.maxPrice;
        
        return matchesCategory && matchesCloth && matchesMinPrice && matchesMaxPrice;
    });

    RenderProducts(filtered);
    
    if (Filter_Drawer.classList.contains("open_filters")) {
        ToggleFilterMenu();
    }
}

function ResetFilters() {
    Active_Filters = { category: null, clothType: [], minPrice: null, maxPrice: null };
    Min_Price_Input.value = "";
    Max_Price_Input.value = "";
    document.querySelectorAll(".filter-option").forEach(opt => opt.classList.remove("active"));
    document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
    if (document.querySelector(".category-pill")) {
        document.querySelector(".category-pill").classList.add("active");
    }
    Current_Category_Title.textContent = "All Collection";
    RenderProducts(All_Products);
}

function RenderProducts(products) {
    if (products.length === 0) {
        Product_Grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 100px 0; color: var(--color-neutral-400);">No products found matching your selection.</div>`;
        Product_Count_Text.textContent = "0 Items";
        return;
    }

    Product_Grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card__image-wrapper">
                <img src="${product.img1}" alt="${product.name}" class="product-card__image" loading="lazy">
            </div>
            <div class="product-card__details">
                <p class="product-card__category">${product.category} / ${product.cloth}</p>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">$${product.Price.toFixed(2)}</p>
                <button class="button button--primary w-full m-0" style="padding: 10px; font-size: 10px; margin-top: 15px;" onclick="AddToCart(${product.id})">
                    Add to Bag
                </button>
            </div>
        </div>
    `).join("");
    
    Product_Count_Text.textContent = `${products.length} Items`;
}

function OpenCart() {
    Cart_Drawer.classList.remove("close_cart");
    Cart_Overlay.classList.remove("cart_blocker_hide");
    document.body.style.overflow = "hidden";
}

async function AddToCart(id) {
    const product = All_Products.find(p => p.id === id);
    if (!product) return;

    const existingItem = Cart_Items.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        Cart_Items.push({ ...product, qty: 1 });
    }

    UpdateCartUI();
    await SyncCart();
    OpenCart();
}

async function UpdateQuantity(id, delta) {
    const item = Cart_Items.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        Cart_Items = Cart_Items.filter(i => i.id !== id);
    }

    UpdateCartUI();
    await SyncCart();
}

function UpdateCartUI() {
    const totalQty = Cart_Items.reduce((acc, curr) => acc + curr.qty, 0);
    Cart_Count_Badges.forEach(badge => badge.textContent = totalQty);

    if (Cart_Items.length === 0) {
        Cart_Items_Container.innerHTML = `<div class="text-center" style="padding: 40px 0;">Your bag is empty.</div>`;
        Cart_Subtotal_Display.textContent = "$0.00";
    } else {
        Cart_Items_Container.innerHTML = Cart_Items.map(item => `
            <div class="cart-item">
                <img src="${item.img1}" alt="${item.name}" class="cart-item__image">
                <div class="cart-item__details">
                    <p class="cart-item__category">${item.category}</p>
                    <h4 class="cart-item__title">${item.name}</h4>
                    <div class="cart-item__quantity">
                        <button class="quantity-btn" onclick="UpdateQuantity(${item.id}, -1)">-</button>
                        <span style="font-size: 12px;">${item.qty}</span>
                        <button class="quantity-btn" onclick="UpdateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div style="text-align: right; font-size: 14px;">
                    $${(item.Price * item.qty).toFixed(2)}
                </div>
            </div>
        `).join("");

        const subtotal = Cart_Items.reduce((acc, curr) => acc + (curr.Price * curr.qty), 0);
        Cart_Subtotal_Display.textContent = `$${subtotal.toFixed(2)}`;
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

function HandleSort(criteria) {
    if (criteria === 'price-low') {
        All_Products.sort((a, b) => a.Price - b.Price);
    } else if (criteria === 'price-high') {
        All_Products.sort((a, b) => b.Price - a.Price);
    }
    ApplyFilters(); // Re-render with current filters applied to sorted list
}

Init();
