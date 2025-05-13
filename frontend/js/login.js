async function login() {
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const statusDiv = document.getElementById("loginStatus");
  
    const url = `http://localhost:3000/api/${role}/login`;
  
    const credentials = {
      email: email,
      password: password
    };
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
  
      const result = await response.json();
  
      if (response.ok && result.token) {
        // Save token to localStorage
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", role);
  
        statusDiv.classList.remove("text-danger");
        statusDiv.classList.add("text-success");
        statusDiv.innerText = "Login successful! Redirecting...";
  
        // Redirect to role-specific dashboard (you can change later)
        setTimeout(() => {
          window.location.href = `${role}.html`;
        }, 1500);
      } else {
        statusDiv.classList.remove("text-success");
        statusDiv.classList.add("text-danger");
        statusDiv.innerText = result.message || "Invalid login credentials.";
      }
    } catch (error) {
      statusDiv.classList.remove("text-success");
      statusDiv.classList.add("text-danger");
      statusDiv.innerText = "Login failed. Check console.";
      console.error("Login Error:", error);
    }
  }
  