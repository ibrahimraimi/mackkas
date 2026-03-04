/**
 * Mackkas Global UI Logic
 * Handles shared components like the Cart Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
    const Cart_Drawer = document.getElementById("cartDrawer");
    const Cart_Overlay = document.getElementById("cartOverlay");
    const Open_Cart_Btn = document.getElementById("openCartBtn");
    const Close_Cart_Btn = document.getElementById("closeCartBtn");
    const Continue_Shopping_Btn = document.getElementById("continueShoppingBtn");
    const Cart_Count_Badge = document.getElementById("cartCountBadge");

    // Toggle Cart Drawer
    if (Open_Cart_Btn) {
        Open_Cart_Btn.onclick = () => {
            Cart_Drawer.classList.remove("close_cart");
            Cart_Overlay.classList.remove("cart_blocker_hide");
            document.body.style.overflow = "hidden";
        };
    }

    const CloseCart = () => {
        if (Cart_Drawer) Cart_Drawer.classList.add("close_cart");
        if (Cart_Overlay) Cart_Overlay.classList.add("cart_blocker_hide");
        document.body.style.overflow = "auto";
    };

    if (Close_Cart_Btn) Close_Cart_Btn.onclick = CloseCart;
    if (Cart_Overlay) Cart_Overlay.onclick = CloseCart;
    if (Continue_Shopping_Btn) Continue_Shopping_Btn.onclick = CloseCart;

    // Initial Cart Status Sync (simple badge update)
    async function UpdateGlobalCartBadge() {
        try {
            const response = await fetch('/api/cart');
            const cartItems = await response.json();
            const totalQty = cartItems.reduce((acc, curr) => acc + curr.qty, 0);
            if (Cart_Count_Badge) Cart_Count_Badge.textContent = totalQty;
        } catch (error) {
            console.error("Error syncing global cart:", error);
        }
    }

    UpdateGlobalCartBadge();

    // Mobile Menu Logic
    const Mobile_Menu = document.getElementById("mobileMenu");
    const Mobile_Menu_Overlay = document.getElementById("mobileMenuOverlay");
    const Open_Mobile_Menu_Btn = document.getElementById("openMobileMenu");
    const Close_Mobile_Menu_Btn = document.getElementById("closeMobileMenu");

    const OpenMobileMenu = () => {
        if (Mobile_Menu) Mobile_Menu.classList.add("active");
        if (Mobile_Menu_Overlay) Mobile_Menu_Overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    const CloseMobileMenu = () => {
        if (Mobile_Menu) Mobile_Menu.classList.remove("active");
        if (Mobile_Menu_Overlay) Mobile_Menu_Overlay.classList.remove("active");
        document.body.style.overflow = "auto";
    };

    if (Open_Mobile_Menu_Btn) Open_Mobile_Menu_Btn.onclick = OpenMobileMenu;
    if (Close_Mobile_Menu_Btn) Close_Mobile_Menu_Btn.onclick = CloseMobileMenu;
    if (Mobile_Menu_Overlay) Mobile_Menu_Overlay.onclick = CloseMobileMenu;
});
