
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const ADMIN_UID = "fSdAynS5qHce8o4LsDbmoJRyK0x1";

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

togglePassword.addEventListener("click", function () {
    const showingPassword = passwordInput.type === "text";
    passwordInput.type = showingPassword ? "password" : "text";
    togglePassword.textContent = showingPassword ? "Show" : "Hide";
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "Signing in...";

    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);

        loginMessage.textContent = "Login successful!";

        if (credential.user.uid === ADMIN_UID) {
            window.location.replace("admin.html");
        } else {
            window.location.replace("index.html");
        }
    } catch (error) {
        console.error("Login failed:", error);
        loginMessage.textContent =
            "Login failed. Check your email and password, then try again.";
    }
});
