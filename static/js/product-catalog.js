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
    maxPrice: null,
    sort: 'featured',
    page: 1
};

// Initialize
async function Init() {
    // Load state from URL
    const params = new URLSearchParams(window.location.search);
    if (params.has('category')) Active_Filters.category = params.get('category');
    if (params.has('sort')) Active_Filters.sort = params.get('sort');
    if (params.has('page')) Active_Filters.page = parseInt(params.get('page'));
    if (params.has('minPrice')) Active_Filters.minPrice = parseFloat(params.get('minPrice'));
    if (params.has('maxPrice')) Active_Filters.maxPrice = parseFloat(params.get('maxPrice'));
    if (params.has('clothType')) Active_Filters.clothType = params.get('clothType').split(',');

    await SetupCategories(); // Fetch filter options first
    await FetchProducts();
    await FetchCart();
    SetupSortDropdown();
}

async function FetchProducts() {
    try {
        const queryParams = new URLSearchParams();
        if (Active_Filters.category) queryParams.set('category', Active_Filters.category);
        if (Active_Filters.sort) queryParams.set('sort', Active_Filters.sort);
        if (Active_Filters.page) queryParams.set('page', Active_Filters.page);
        if (Active_Filters.minPrice) queryParams.set('min_price', Active_Filters.minPrice);
        if (Active_Filters.maxPrice) queryParams.set('max_price', Active_Filters.maxPrice);
        if (window.location.pathname === '/new-in') queryParams.set('new_only', 'true');
        Active_Filters.clothType.forEach(type => queryParams.append('cloth_type', type));

        const response = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await response.json();
        
        All_Products = data.items;
        Pagination_Data = {
            total: data.total,
            pages: data.pages,
            current_page: data.current_page,
            has_next: data.has_next,
            has_prev: data.has_prev
        };

        RenderProducts(All_Products);
        RenderPagination();
        UpdateURL();
        SyncUIState();
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

async function SetupCategories() {
    try {
        const response = await fetch('/api/products/meta');
        const data = await response.json();
        const categories = (data.categories || []).map(c => c.trim());
        const clothTypes = (data.cloth_types || []).map(t => t.trim());
        
        const currentActive = (Active_Filters.category || "all").toLowerCase().trim();

        // Render pills with initial active state
        if (Category_Pill_List) {
            Category_Pill_List.innerHTML = "";
            
            // All Pill
            const btnAll = document.createElement("button");
            btnAll.className = `category-pill ${currentActive === 'all' ? 'active' : ''}`;
            btnAll.setAttribute("data-category", "all");
            btnAll.textContent = "All";
            btnAll.addEventListener("click", () => SetCategory(null));
            Category_Pill_List.appendChild(btnAll);

            // Category Pills
            categories.forEach(cat => {
                const normCat = cat.toLowerCase();
                const btn = document.createElement("button");
                btn.className = `category-pill ${normCat === currentActive ? 'active' : ''}`;
                btn.setAttribute("data-category", normCat);
                btn.textContent = cat;
                btn.addEventListener("click", () => SetCategory(cat));
                Category_Pill_List.appendChild(btn);
            });
        }

        // Render filter drawer options
        if (Category_Filter_Options) {
            Category_Filter_Options.innerHTML = "";
            categories.forEach(cat => {
                const normCat = cat.toLowerCase();
                const btn = document.createElement("button");
                btn.className = `filter-option ${normCat === currentActive ? 'active' : ''}`;
                btn.setAttribute("data-category", normCat);
                btn.textContent = cat;
                btn.addEventListener("click", () => ToggleFilter('category', cat));
                Category_Filter_Options.appendChild(btn);
            });
        }

        if (Cloth_Type_Filter_Options) {
            Cloth_Type_Filter_Options.innerHTML = "";
            const selectedTypes = Active_Filters.clothType.map(t => t.toLowerCase());
            clothTypes.forEach(type => {
                const normType = type.toLowerCase();
                const btn = document.createElement("button");
                btn.className = `filter-option ${selectedTypes.includes(normType) ? 'active' : ''}`;
                btn.setAttribute("data-type", normType);
                btn.textContent = type;
                btn.addEventListener("click", () => ToggleFilter('clothType', type));
                Cloth_Type_Filter_Options.appendChild(btn);
            });
        }
        SyncUIState();
    } catch (error) {
        console.error("Error setting up categories:", error);
    }
}

function ToggleFilterMenu() {
    Filter_Drawer.classList.toggle("close_cart");
    Filter_Drawer.classList.toggle("open_filters");
    Filter_Overlay.classList.toggle("cart_blocker_hide");
    document.body.style.overflow = Filter_Drawer.classList.contains("open_filters") ? "hidden" : "";
}

function SetCategory(cat) {
    Active_Filters.category = (cat && cat.toLowerCase() !== "all") ? cat.trim() : null;
    Active_Filters.page = 1; // Reset to page 1

    const displayCat = Active_Filters.category || "All";
    Current_Category_Title.textContent = `${displayCat.charAt(0).toUpperCase() + displayCat.slice(1)} Collection`;
    
    SyncUIState();
    FetchProducts();
}

function ToggleFilter(type, value) {
    if (type === 'category') {
        const val = (value && value.toLowerCase() !== "all") ? value.trim() : null;
        Active_Filters.category = (Active_Filters.category && Active_Filters.category.toLowerCase() === (val ? val.toLowerCase() : null)) ? null : val;
    } else if (type === 'clothType') {
        const trimmedVal = value ? value.trim() : "";
        const index = Active_Filters.clothType.map(t => t.toLowerCase()).indexOf(trimmedVal.toLowerCase());
        if (index > -1) Active_Filters.clothType.splice(index, 1);
        else Active_Filters.clothType.push(trimmedVal);
    }
    SyncUIState();
}

function SyncUIState() {
    // Determine the truly normalized active category
    let normalized = "all";
    if (Active_Filters.category) {
        const temp = Active_Filters.category.toString().trim().toLowerCase();
        if (temp !== "" && temp !== "all") {
            normalized = temp;
        }
    }
    const activeCat = normalized;

    // Sync Category Pills
    document.querySelectorAll(".category-pill").forEach(pill => {
        pill.classList.remove("active"); // Force remove for all first
        const catVal = (pill.getAttribute("data-category") || "").toLowerCase().trim();
        if (catVal === activeCat) {
            pill.classList.add("active");
        }
    });

    // Sync Filter Drawer - Categories
    document.querySelectorAll("#categoryFilterOptions .filter-option").forEach(opt => {
        opt.classList.remove("active");
        const catVal = (opt.getAttribute("data-category") || "").toLowerCase().trim();
        if (catVal === activeCat) {
            opt.classList.add("active");
        }
    });

    // Sync Filter Drawer - Cloth Types
    const lowerSelectedTypes = (Active_Filters.clothType || []).map(t => t.toString().trim().toLowerCase());
    document.querySelectorAll("#clothTypeFilterOptions .filter-option").forEach(opt => {
        const optType = (opt.getAttribute("data-type") || "").toLowerCase().trim();
        opt.classList.toggle("active", lowerSelectedTypes.includes(optType));
    });

    // Sync Custom Sort Dropdown
    const sortOptions = document.querySelectorAll(".custom-dropdown__option");
    const currentSort = (Active_Filters.sort || "featured").toLowerCase();
    sortOptions.forEach(opt => {
        const val = (opt.getAttribute("data-value") || "").toLowerCase();
        const isActive = val === currentSort;
        opt.classList.toggle("active", isActive);
        if (isActive) {
            const selectedText = document.getElementById("sortSelectedText");
            if (selectedText) selectedText.textContent = opt.textContent;
        }
    });
}

function SetupSortDropdown() {
    const dropdown = document.getElementById("sortDropdown");
    if (!dropdown) return;

    const selected = dropdown.querySelector(".custom-dropdown__selected");
    const options = dropdown.querySelectorAll(".custom-dropdown__option");

    selected.addEventListener("click", () => {
        dropdown.classList.toggle("open");
    });

    options.forEach(opt => {
        opt.addEventListener("click", () => {
            const val = opt.getAttribute("data-value");
            HandleSort(val);
            dropdown.classList.remove("open");
        });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });
}

function ApplyFilters() {
    Active_Filters.minPrice = Min_Price_Input.value ? parseFloat(Min_Price_Input.value) : null;
    Active_Filters.maxPrice = Max_Price_Input.value ? parseFloat(Max_Price_Input.value) : null;
    Active_Filters.page = 1; // Reset to page 1

    FetchProducts();
    
    if (Filter_Drawer.classList.contains("open_filters")) {
        ToggleFilterMenu();
    }
}

function ResetFilters() {
    Active_Filters = { category: null, clothType: [], minPrice: null, maxPrice: null, sort: 'featured', page: 1 };
    Min_Price_Input.value = "";
    Max_Price_Input.value = "";
    SyncUIState();
    Current_Category_Title.textContent = "All Collection";
    FetchProducts();
}

function RenderProducts(products) {
    if (products.length === 0) {
        Product_Grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 100px 0; color: var(--color-neutral-400);">No products found matching your selection.</div>`;
        Product_Count_Text.textContent = "0 Items";
        return;
    }

    Product_Grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='/product/${product.id}'">
            <div class="product-card__image-wrapper">
                ${product.is_new ? '<span class="product-badge">New</span>' : ''}
                <img src="${product.img1}" alt="${product.name}" class="product-card__image" loading="lazy">
            </div>
            <div class="product-card__details">
                <p class="product-card__category">${product.category} / ${product.cloth}</p>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">$${product.Price.toFixed(2)}</p>
                <div class="product-card__cta">
                    <button class="button button--primary w-full m-0" style="padding: 10px; font-size: 10px; margin-top: 15px;" onclick="event.stopPropagation(); AddToCart(${product.id})">
                        Add to Bag
                    </button>
                </div>
            </div>
        </div>
    `).join("");
    
    Product_Count_Text.textContent = `${Pagination_Data.total} Items`;
}

function RenderPagination() {
    const container = document.getElementById("paginationControls");
    if (!container) return;

    if (Pagination_Data.pages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `
        <div class="pagination">
            <button class="page-btn ${!Pagination_Data.has_prev ? 'disabled' : ''}" 
                    onclick="ChangePage(${Pagination_Data.current_page - 1})" 
                    ${!Pagination_Data.has_prev ? 'disabled' : ''}>
                <iconify-icon icon="lucide:chevron-left"></iconify-icon>
            </button>
    `;

    for (let i = 1; i <= Pagination_Data.pages; i++) {
        html += `
            <button class="page-btn ${i === Pagination_Data.current_page ? 'active' : ''}" 
                    onclick="ChangePage(${i})">${i}</button>
        `;
    }

    html += `
            <button class="page-btn ${!Pagination_Data.has_next ? 'disabled' : ''}" 
                    onclick="ChangePage(${Pagination_Data.current_page + 1})" 
                    ${!Pagination_Data.has_next ? 'disabled' : ''}>
                <iconify-icon icon="lucide:chevron-right"></iconify-icon>
            </button>
        </div>
    `;

    container.innerHTML = html;
}

function ChangePage(page) {
    if (page < 1 || page > Pagination_Data.pages) return;
    Active_Filters.page = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    FetchProducts();
}

function UpdateURL() {
    const params = new URLSearchParams();
    if (Active_Filters.category) params.set('category', Active_Filters.category);
    if (Active_Filters.sort !== 'featured') params.set('sort', Active_Filters.sort);
    if (Active_Filters.page > 1) params.set('page', Active_Filters.page);
    if (Active_Filters.minPrice) params.set('minPrice', Active_Filters.minPrice);
    if (Active_Filters.maxPrice) params.set('maxPrice', Active_Filters.maxPrice);
    if (Active_Filters.clothType.length > 0) params.set('clothType', Active_Filters.clothType.join(','));

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
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
    Active_Filters.sort = criteria;
    Active_Filters.page = 1; // Reset to page 1
    FetchProducts();
}

Init();
