// handleLogin.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const API_BASE_URL = 'http://localhost:3000/api';

    console.log(`Attempting login for user: ${username}`);

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            console.log("Login successful:", data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            alert("Login successful!"); // Keeping alert for direct user feedback here
            window.location.href = "index.html";
        } else {
            console.error("Login failed from server:", data.message);
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Login API request error:", error);
        alert("Login failed: " + error.message); // Display error message to user
    }
});