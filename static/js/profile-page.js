const User_Name_Display = document.getElementById("userName");
const User_Email_Display = document.getElementById("userEmail");

async function Init() {
    await FetchUserProfile();
}

async function FetchUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
            const user = await response.json();
            User_Name_Display.textContent = user.username;
            User_Email_Display.textContent = user.email;
        } else {
            // Redirect to login if unauthorized
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

Init();
