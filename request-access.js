
import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const form = document.getElementById("accessRequestForm");
const message = document.getElementById("requestMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("requestEmail").value.trim();
    const password = document.getElementById("requestPassword").value;
    const reason = document.getElementById("reason").value.trim();
    const button = form.querySelector('button[type="submit"]');

    if (!fullName || !email || password.length < 6) {
        showMessage(
            "Enter your name, a valid email and a password of at least 6 characters.",
            "error"
        );
        return;
    }

    button.disabled = true;
    showMessage("Creating your account and submitting your request...", "");

    let accountCreated = false;

    try {
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = credential.user;
        accountCreated = true;

        await setDoc(doc(db, "accessRequests", user.uid), {
            uid: user.uid,
            fullName,
            email: user.email,
            reason,
            status: "pending",
            createdAt: serverTimestamp()
        });

        await signOut(auth);

        window.location.replace("pending.html");
    } catch (error) {
        console.error("Registration failed:", error);

        if (accountCreated && auth.currentUser) {
            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error("Sign-out failed:", signOutError);
            }
        }

        if (error.code === "auth/email-already-in-use") {
            showMessage(
                "This email already has an account. Please sign in instead.",
                "error"
            );
        } else if (error.code === "auth/weak-password") {
            showMessage("Choose a stronger password.", "error");
        } else if (error.code === "permission-denied") {
            showMessage(
                "The account may have been created, but Firebase denied saving your request. Contact the administrator before trying again.",
                "error"
            );
        } else {
            showMessage(
                "Registration failed: " + (error.code || error.message),
                "error"
            );
        }
    } finally {
        button.disabled = false;
    }
});

function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
}
