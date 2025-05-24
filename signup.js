// signup.js
document.getElementById('signupForm').addEventListener('submit', async (e) => { // Use ID for form
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/signup', { // Corrected API endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role: 'user' }) // 'user' role is default
    });

    const data = await res.json(); // Always parse response to check for messages

    if (res.ok) {
      alert("Signup successful! You can now log in.");
      window.location.href = "login.html"; // Redirect to login page
    } else {
      alert("Signup failed: " + data.message); // Show error message from server
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
});