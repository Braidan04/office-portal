
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const profileButton = document.getElementById("profileButton");
const profileMenu = document.getElementById("profileMenu");

function getInitials(name, email) {
    if (name && name.trim()) {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();
    }

    return email ? email[0].toUpperCase() : "U";
}

function showProfile(user, approvedData = {}) {
    if (!profileButton || !profileMenu) return;

    const name =
        approvedData.fullName ||
        user.displayName ||
        "Office Portal User";

    const email = user.email || approvedData.email || "";

    profileButton.textContent = getInitials(name, email);
    profileButton.setAttribute(
        "aria-label",
        "Open profile menu for " + name
    );

    profileMenu.replaceChildren();

    const title = document.createElement("p");
    title.className = "profile-menu-title";
    title.textContent = name;

    const emailText = document.createElement("p");
    emailText.className = "profile-menu-note";
    emailText.textContent = email;

    const signOutButton = document.createElement("button");
    signOutButton.type = "button";
    signOutButton.textContent = "Sign out";
    signOutButton.className = "profile-signout";

    signOutButton.addEventListener("click", async () => {
        signOutButton.disabled = true;
        signOutButton.textContent = "Signing out...";

        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            console.error("Sign-out failed:", error);
            alert("Could not sign out. Please try again.");
            signOutButton.disabled = false;
            signOutButton.textContent = "Sign out";
        }
    });

    profileMenu.append(title, emailText, signOutButton);
}

if (profileButton && profileMenu) {
    profileButton.addEventListener("click", () => {
        const isOpening = profileMenu.hidden;

        profileMenu.hidden = !isOpening;
        profileButton.setAttribute(
            "aria-expanded",
            String(isOpening)
        );
    });

    document.addEventListener("click", event => {
        if (
            !profileMenu.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {
            profileMenu.hidden = true;
            profileButton.setAttribute("aria-expanded", "false");
        }
    });
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // Send the administrator to the admin dashboard.
    if (user.uid === "fSdAynS5qHce8o4LsDbmoJRyK0x1") {
        window.location.replace("admin.html");
        return;
    }

    try {
        const approvalDoc = await getDoc(
            doc(db, "approvedUsers", user.uid)
        );

        if (
            !approvalDoc.exists() ||
            approvalDoc.data().approved !== true
        ) {
            await signOut(auth);
            window.location.replace("pending.html");
            return;
        }

        showProfile(user, approvalDoc.data());
        const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeMessage = document.getElementById("welcomeMessage");

const fullName =
    approvalDoc.data().fullName ||
    user.displayName ||
    "there";

if (welcomeTitle) {
    welcomeTitle.textContent = `Welcome, ${fullName}`;
}

if (welcomeMessage) {
    welcomeMessage.textContent =
        "Your workspace is ready. Choose an application below to get started.";
}
        console.log("Approved user signed in.");
    } catch (error) {
        console.error("Could not verify user approval:", error);
        alert("We couldn't verify your access. Please try again.");

        await signOut(auth);
        window.location.replace("login.html");
    }
});
