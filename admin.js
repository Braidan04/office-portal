
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const ADMIN_UID = "fSdAynS5qHce8o4LsDbmoJRyK0x1";

const tableBody = document.getElementById("requestTableBody");
const statusFilter = document.getElementById("statusFilter");
const requestSearch = document.getElementById("requestSearch");
const emptyMessage = document.getElementById("emptyMessage");
const adminStatus = document.getElementById("adminStatus");
const adminLogoutButton = document.getElementById("adminLogoutButton");

let requests = [];

function setAdminStatus(message) {
    if (adminStatus) {
        adminStatus.textContent = message;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    if (user.uid !== ADMIN_UID) {
        alert("Administrator access required.");
        window.location.replace("index.html");
        return;
    }

    setAdminStatus("CONNECTING TO FIREBASE...");

    try {
        await loadRequests();
        setAdminStatus("FIREBASE CONNECTED");
    } catch (error) {
        console.error("Loading requests failed:", error);

        setAdminStatus(
            "CONNECTION ERROR: " + (error.code || error.message)
        );

        alert(
            "Could not load access requests.\n\n" +
            "Error: " + (error.code || "unknown") +
            "\n" + error.message
        );
    }
});

async function loadRequests() {
    const snapshot = await getDocs(collection(db, "accessRequests"));

    requests = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    }));

    renderRequests();
}

function updateSummary() {
    const pendingCount = document.getElementById("pendingCount");
    const approvedCount = document.getElementById("approvedCount");
    const rejectedCount = document.getElementById("rejectedCount");

    if (pendingCount) {
        pendingCount.textContent = requests.filter(
            item => (item.status || "pending") === "pending"
        ).length;
    }

    if (approvedCount) {
        approvedCount.textContent = requests.filter(
            item => item.status === "approved"
        ).length;
    }

    if (rejectedCount) {
        rejectedCount.textContent = requests.filter(
            item => item.status === "rejected"
        ).length;
    }
}

function renderRequests() {
    if (!tableBody || !statusFilter || !requestSearch || !emptyMessage) {
        console.error("An admin dashboard element is missing from admin.html.");
        setAdminStatus("DASHBOARD ELEMENT MISSING");
        return;
    }

    const filter = statusFilter.value;
    const search = requestSearch.value.trim().toLowerCase();

    const filtered = requests.filter(item => {
        const name = item.fullName || item.name || "";
        const email = item.email || "";
        const status = item.status || "pending";

        return (
            (filter === "all" || status === filter) &&
            (
                name.toLowerCase().includes(search) ||
                email.toLowerCase().includes(search)
            )
        );
    });

    tableBody.replaceChildren();

    filtered.forEach(item => {
        const name = item.fullName || item.name || "Unnamed user";
        const email = item.email || "No email";
        const status = item.status || "pending";

        const date = item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString()
            : item.date || "—";

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .map(part => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        const initialsElement = document.createElement("span");
        initialsElement.className = "admin-user-initial";
        initialsElement.textContent = initials;

        const nameElement = document.createElement("span");
        nameElement.className = "admin-user-name";
        nameElement.textContent = name;

        nameCell.append(initialsElement, nameElement);

        const emailCell = document.createElement("td");
        emailCell.className = "admin-email";
        emailCell.textContent = email;

        const dateCell = document.createElement("td");
        dateCell.textContent = date;

        const statusCell = document.createElement("td");
        const statusElement = document.createElement("span");

        statusElement.className = `admin-status ${status}`;
        statusElement.textContent = status;
        statusCell.appendChild(statusElement);

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "admin-actions";

        ["approved", "rejected"].forEach(action => {
            const button = document.createElement("button");

            button.type = "button";
            button.className =
                action === "approved"
                    ? "admin-approve"
                    : "admin-reject";

            button.dataset.action = action;
            button.dataset.id = item.id;
            button.textContent =
                action === "approved" ? "Approve" : "Reject";

            button.disabled = status !== "pending";

            actions.appendChild(button);
        });

        actionsCell.appendChild(actions);
        row.append(nameCell, emailCell, dateCell, statusCell, actionsCell);
        tableBody.appendChild(row);
    });

    emptyMessage.hidden = filtered.length !== 0;
    updateSummary();
}

// Approve or reject an access request.
if (tableBody) {
    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button || button.disabled) return;

        const item = requests.find(
            request => request.id === button.dataset.id
        );

        if (!item || (item.status || "pending") !== "pending") return;

        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert("Administrator access required.");
            window.location.replace("login.html");
            return;
        }

        const newStatus = button.dataset.action;
        const name = item.fullName || item.name || "this user";
        const actionText =
            newStatus === "approved" ? "approve" : "reject";

        if (!confirm(
            `Are you sure you want to ${actionText} ${name}'s request?`
        )) {
            return;
        }

        button.disabled = true;
        setAdminStatus("SAVING CHANGES...");

        try {
            const batch = writeBatch(db);

            batch.update(doc(db, "accessRequests", item.id), {
                status: newStatus,
                reviewedAt: serverTimestamp(),
                reviewedBy: auth.currentUser.uid
            });

            batch.set(doc(db, "approvedUsers", item.id), {
                approved: newStatus === "approved",
                email: item.email || "",
                fullName: item.fullName || item.name || "",
                reviewedAt: serverTimestamp(),
                reviewedBy: auth.currentUser.uid
            });

            await batch.commit();
            await loadRequests();

            setAdminStatus("FIREBASE CONNECTED");
        } catch (error) {
            console.error("Updating request failed:", error);

            setAdminStatus(
                "ERROR: " + (error.code || "unknown")
            );

            alert(
                "Firebase error: " + (error.code || "unknown") +
                "\n" + error.message
            );

            button.disabled = false;
        }
    });
}

// Admin logout works independently of the request buttons.
if (adminLogoutButton) {
    adminLogoutButton.addEventListener("click", async () => {
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            window.location.replace("login.html");
            return;
        }

        if (!confirm("Are you sure you want to log out?")) {
            return;
        }

        adminLogoutButton.disabled = true;
        adminLogoutButton.textContent = "Logging out...";

        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            console.error("Admin logout failed:", error);

            alert("Could not log out. Please try again.");

            adminLogoutButton.disabled = false;
            adminLogoutButton.textContent = "Log out";
        }
    });
}

if (statusFilter) {
    statusFilter.addEventListener("change", renderRequests);
}

if (requestSearch) {
    requestSearch.addEventListener("input", renderRequests);
}
