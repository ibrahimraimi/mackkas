function showToast(message, type = 'success') {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    
    toast.innerHTML = `
        <div class="toast__content">${message}</div>
        <div class="toast__timer"></div>
    `;
    
    container.appendChild(toast);
    
    // Animate timer bar
    const timerBar = toast.querySelector(".toast__timer");
    timerBar.animate([
        { transform: 'scaleX(1)' },
        { transform: 'scaleX(0)' }
    ], {
        duration: 4000,
        easing: 'linear'
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.add("toast--closing");
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

const User_Name_Display = document.getElementById("userName");
const User_Email_Display = document.getElementById("userEmail");
const Nav_Links = document.querySelectorAll(".profile__nav-link[data-section]");
const Sections = document.querySelectorAll(".profile-section");

const Activity_Feed = document.getElementById("activityFeed");
const Orders_List = document.getElementById("ordersList");
const Addresses_Grid = document.getElementById("addressesGrid");
const Payments_List = document.getElementById("paymentsList");

async function Init() {
    SetupTabNavigation();
    await FetchUserProfile();
    await FetchActivity(); // Load initial activity
}

function SetupTabNavigation() {
    Nav_Links.forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionTarget = e.currentTarget.getAttribute('data-section');
            
            // Update Active Link
            Nav_Links.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Switch Sections
            Sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `section-${sectionTarget}`) {
                    section.classList.add('active');
                }
            });

            // Fetch data for targeted section
            LoadSectionData(sectionTarget);
        });
    });
}

async function LoadSectionData(section) {
    switch(section) {
        case 'orders': await FetchOrders(); break;
        case 'addresses': await FetchAddresses(); break;
        case 'payments': await FetchPayments(); break;
        case 'settings': await RenderSettings(); break;
        case 'info': await FetchActivity(); break;
    }
}

async function RenderSettings() {
    try {
        const response = await fetch('/api/user/profile');
        const user = await response.json();
        
        document.getElementById("settingsUsername").value = user.username;
        document.getElementById("settingsEmail").value = user.email;

        SetupSettingsForms();
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

function SetupSettingsForms() {
    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");

    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = profileForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Saving...";

        const payload = {
            username: document.getElementById("settingsUsername").value,
            email: document.getElementById("settingsEmail").value
        };

        try {
            const response = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (response.ok) {
                showToast(result.message, 'success');
                // Update displays
                User_Name_Display.textContent = result.user.username;
                User_Email_Display.textContent = result.user.email;
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("An error occurred while saving profile", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Save Changes";
        }
    };

    passwordForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = passwordForm.querySelector('button[type="submit"]');
        
        const payload = {
            currentPassword: document.getElementById("currentPassword").value,
            newPassword: document.getElementById("newPassword").value,
            confirmPassword: document.getElementById("confirmPassword").value
        };

        if (payload.newPassword !== payload.confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Updating...";

        try {
            const response = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (response.ok) {
                showToast(result.message, 'success');
                passwordForm.reset();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("An error occurred while changing password", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Update Password";
        }
    };
}

async function FetchUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
            const user = await response.json();
            User_Name_Display.textContent = user.username;
            User_Email_Display.textContent = user.email;
            
            if (user.is_admin) {
                const statusEl = document.getElementById("accountStatus");
                if (statusEl) {
                    statusEl.innerHTML = 'Verified Member <span style="background: #000; color: #fff; font-size: 8px; padding: 2px 6px; text-transform: uppercase; margin-left: 10px; font-weight: 600; letter-spacing: 0.1em;">Admin</span>';
                }
                const adminLink = document.getElementById("adminLink");
                if (adminLink) {
                    adminLink.style.display = 'block';
                }
            }
        } else {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

async function FetchActivity() {
    try {
        const response = await fetch('/api/user/activity');
        const data = await response.json();
        Activity_Feed.innerHTML = data.map(item => `
            <div class="activity-item">
                <div class="activity-item__dot"></div>
                <div class="activity-item__content">
                    <p class="activity-item__desc">${item.desc}</p>
                    <span class="activity-item__time">${item.time}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        Activity_Feed.innerHTML = '<p class="error-text">Failed to load activity</p>';
    }
}

async function FetchOrders() {
    try {
        const response = await fetch('/api/user/orders');
        const data = await response.json();
        Orders_List.innerHTML = data.length ? data.map(order => `
            <div class="order-card">
                <div class="order-card__info">
                    <h4>Order ${order.id}</h4>
                    <span class="order-card__date">${order.date} — ${order.items} items</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 500; margin-bottom: 5px;">${order.total}</div>
                    <span class="order-card__status status--${order.status.toLowerCase()}">${order.status}</span>
                </div>
            </div>
        `).join('') : '<p class="empty-text">No orders found.</p>';
    } catch (error) {
        Orders_List.innerHTML = '<p class="error-text">Failed to load orders</p>';
    }
}

async function FetchAddresses() {
    try {
        const response = await fetch('/api/user/addresses');
        const data = await response.json();
        Addresses_Grid.innerHTML = data.map(addr => `
            <div class="address-card">
                <div class="address-card__header">
                    <span class="address-card__tag">${addr.type} Address</span>
                    ${addr.default ? '<span class="address-card__default">Default</span>' : ''}
                </div>
                <p class="address-card__name">${addr.name}</p>
                <p class="address-card__details">${addr.street}<br>${addr.city}, ${addr.postal}</p>
                <div class="address-card__actions">
                    <button class="text-link">Edit</button>
                    <button class="text-link">Remove</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        Addresses_Grid.innerHTML = '<p class="error-text">Failed to load addresses</p>';
    }
}

async function FetchPayments() {
    try {
        const response = await fetch('/api/user/payments');
        const data = await response.json();
        Payments_List.innerHTML = data.map(pm => `
            <div class="payment-method-item">
                <div class="pm-info">
                    <iconify-icon icon="lucide:credit-card" class="pm-icon"></iconify-icon>
                    <div>
                        <p class="pm-name">${pm.brand} ending in ${pm.last4}</p>
                        <p class="pm-expiry">Expires ${pm.expiry}</p>
                    </div>
                </div>
                ${pm.default ? '<span class="pm-badge">Preferred</span>' : '<button class="text-link">Set Default</button>'}
            </div>
        `).join('');
    } catch (error) {
        Payments_List.innerHTML = '<p class="error-text">Failed to load payment methods</p>';
    }
}

Init();
