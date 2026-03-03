const Detail_Container = document.getElementById("productDetailContainer");
const Related_Grid = document.getElementById("relatedProductsGrid");
const Cart_Drawer = document.getElementById("cartDrawer");
const Cart_Overlay = document.getElementById("cartOverlay");
const Open_Cart_Btn = document.getElementById("openCartBtn");
const Close_Cart_Btn = document.getElementById("closeCartBtn");
const Cart_Items_Container = document.getElementById("cartItemsContainer");
const Cart_Count_Badges = document.querySelectorAll("#cartCountBadge");
const Cart_Subtotal_Display = document.getElementById("cartSubtotal");

let Current_Product = null;
let Cart_Items = [];

async function Init() {
    await FetchProduct();
    await FetchCart();
    await FetchRelated();
    SetupEventListeners();
}

async function FetchProduct() {
    try {
        const response = await fetch(`/api/products/${CURRENT_PRODUCT_ID}`);
        Current_Product = await response.json();
        RenderProductDetail(Current_Product);
    } catch (error) {
        console.error("Error fetching product:", error);
        Detail_Container.innerHTML = `<div class="text-center" style="padding: 100px 0;">Product not found.</div>`;
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

async function FetchRelated() {
    try {
        const response = await fetch('/api/products');
        const all = await response.json();
        const related = all.filter(p => p.id !== CURRENT_PRODUCT_ID).slice(0, 4);
        RenderRelated(related);
    } catch (error) {
        console.error("Error fetching related products:", error);
    }
}

function SetupEventListeners() {
    Open_Cart_Btn.onclick = OpenCart;
    Close_Cart_Btn.onclick = CloseCart;
    Cart_Overlay.onclick = CloseCart;
    document.getElementById("continueShoppingBtn").onclick = CloseCart;
}

function RenderProductDetail(product) {
    Detail_Container.innerHTML = `
        <div class="product-detail">
            <div class="product-detail__gallery">
                <img src="${product.img1}" alt="${product.name}" class="product-detail__img">
                ${product.img2 ? `<img src="${product.img2}" alt="${product.name} alternate" class="product-detail__img">` : ''}
            </div>
            <div class="product-detail__info">
                <span class="product-detail__category">${product.category} / ${product.cloth}</span>
                <h1 class="product-detail__title">${product.name}</h1>
                <p class="product-detail__price">${product.price}</p>
                
                <div class="product-detail__desc">
                    ${product.desc || 'Timeless piece crafted with precision and attention to detail. This garment represents the peak of minimalist luxury, designed to be a versatile staple in your wardrobe.'}
                </div>

                <div class="product-detail__actions">
                    <button class="button button--primary w-full" onclick="AddToCart(${product.id})">Add to Bag</button>
                    <button class="button button--outline w-full">Express Checkout</button>
                </div>

                <div class="product-detail__meta">
                    <div class="meta-item">
                        <span class="meta-item__label">Shipping</span>
                        <span>Complimentary Standard</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-item__label">Returns</span>
                        <span>30-Day Policy</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-item__label">Composition</span>
                        <span>Fine Wool & Silk Blend</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function RenderRelated(products) {
    Related_Grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='/product/${product.id}'" style="cursor: pointer;">
            <div class="product-card__image-wrapper">
                <img src="${product.img1}" alt="${product.name}" class="product-card__image">
            </div>
            <div class="product-card__details">
                <p class="product-card__category">${product.category}</p>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">${product.price}</p>
            </div>
        </div>
    `).join("");
}

// Cart Logic (Shared with Catalog)
async function AddToCart(id) {
    const existingItem = Cart_Items.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        Cart_Items.push({ ...Current_Product, qty: 1 });
    }

    UpdateCartUI();
    await SyncCart();
    OpenCart();
}

function OpenCart() {
    Cart_Drawer.classList.remove("close_cart");
    Cart_Overlay.classList.remove("cart_blocker_hide");
    document.body.style.overflow = "hidden";
}

function CloseCart() {
    Cart_Drawer.classList.add("close_cart");
    Cart_Overlay.classList.add("cart_blocker_hide");
    document.body.style.overflow = "auto";
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
                    <div style="font-size: 11px; margin-top: 5px;">Quantity: ${item.qty}</div>
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

Init();
