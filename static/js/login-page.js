/* Mackkas Login Logic */

const Login_Form = document.getElementById("loginform");
const Success_Toast = document.getElementById("successToast");
const Error_Toast = document.getElementById("errorToast");

Login_Form.onsubmit = async function(e) {
    e.preventDefault();
    
    // Reset toasts
    Success_Toast.className = "successful_hide";
    Error_Toast.className = "validate_hide";
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    const submitBtn = document.getElementById("btnform");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Signing In...";
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // Save currently logged-in user info in sessionStorage for frontend display
            sessionStorage.setItem("currentUser", JSON.stringify({ Name: result.user.username }));

            Success_Toast.className = "successful";
            
            setTimeout(() => {
                window.location.href = "/mackkas";
            }, 1500);
        } else {
            Error_Toast.querySelector("h3").textContent = result.message || "Invalid credentials";
            Error_Toast.className = "validate";
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error("Login error:", error);
        Error_Toast.querySelector("h3").textContent = "An error occurred. Please try again.";
        Error_Toast.className = "validate";
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
};
