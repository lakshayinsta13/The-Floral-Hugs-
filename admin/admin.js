
// ================================
// SUPABASE CONFIG
// ================================
const SUPABASE_URL = "https://muciyuapxwklchdvkimt.supabase.co";
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y2l5dWFweHdrbGNoZHZraW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDcxNTEsImV4cCI6MjA4MTUyMzE1MX0.uh0UWRzpfqzUAB_xKnny-Zp_ncHevH10w4vLDNDEEDU";

const TABLE = "bookings";

// ================================
// STATE
// ================================
let allBookings = [];

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
    loadAllBookings();
    setInterval(refreshPendingBookings, 10000);

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportToExcel);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.adminLogout) window.adminLogout();
            else location.href = 'login.html';
        });
    }
});

// ================================
// GLOBAL BUTTON HANDLER
// ================================
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("accept")) {
        handleAction(e.target.dataset.id, "accepted");
    }

    if (e.target.classList.contains("reject")) {
        handleAction(e.target.dataset.id, "rejected");
    }
});

// ================================
// LOAD BOOKINGS
// ================================
async function loadAllBookings() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?order=created_at.desc`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
            },
        }
    );

    const data = await res.json();

    allBookings = data.map(b => ({
        ...b,
        status: b.status || "pending",
    }));

    renderAll();
}
// ================================
// REFRESH ONLY PENDING BOOKINGS
// ================================
async function refreshPendingBookings() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE}?status=eq.pending&order=created_at.desc`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                },
            }
        );

        if (!res.ok) return;

        const pendingData = await res.json();

        // Keep accepted & rejected as-is
        const nonPending = allBookings.filter(b => b.status !== "pending");

        // Merge updated pending bookings
        allBookings = [
            ...pendingData.map(b => ({ ...b, status: "pending" })),
            ...nonPending
        ];

        // Re-render ONLY pending table
        renderTable("pending", "pendingList", true);

    } catch (err) {
        console.error("Pending refresh failed:", err);
    }
}


// ================================
// RENDER TABLES
// ================================
function renderAll() {
    renderTable("pending", "pendingList", true);
    renderTable("accepted", "acceptedList");
    renderTable("rejected", "rejectedList");
}

function renderTable(status, tbodyId, showActions = false) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";

    const rows = allBookings.filter(b => b.status === status);

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="${showActions ? 6 : 5}" align="center">No bookings</td></tr>`;
        return;
    }

    rows.forEach(b => {
        tbody.innerHTML += `
      <tr>
        <td>${b.name}</td>
        <td>${b.item}</td>
        <td>${b.event_type}</td>
        <td>${b.event_date}</td>
        <td>${b.phone_no}</td>
        ${showActions
                ? `<td>
                <button class="accept" data-id="${b.id}">Accept</button>
                <button class="reject" data-id="${b.id}">Reject</button>
              </td>`
                : ""
            }
      </tr>
    `;
    });
}

// ================================
// HANDLE ACCEPT / REJECT
// ================================
async function handleAction(id, status) {
    const booking = allBookings.find(b => b.id == id);
    if (!booking) return;

    const toggle = document.getElementById("whatsappToggle");
    const whatsappEnabled = toggle ? toggle.checked : false;

    // WhatsApp message text
    let message = "";

    if (status === "accepted") {
        message = `Hello ${booking.name} 🌸

Your booking for *${booking.item}* has been successfully accepted ✅.

Please share your complete delivery location so we can proceed.

Thank you for choosing Aavi Decor 💐`;
    }

    if (status === "rejected") {
        message = `Hello ${booking.name} 🌸

Thank you for contacting Aavi Decor.

We regret to inform you that we are currently unable to serve your location 😔.

We truly hope to serve you in the future.

Thank you for your understanding 💐`;
    }

    // ================================
    // IF WHATSAPP IS ON
    // ================================
    if (whatsappEnabled) {
        openWhatsApp(booking.phone_no, message);

        const confirmSend = confirm(
            "After sending the WhatsApp message, click OK to update booking status."
        );

        if (!confirmSend) return;
    }

    // ================================
    // UPDATE STATUS
    // ================================
    await updateStatus(id, status);
}

// ================================
// UPDATE STATUS IN DB
// ================================
async function updateStatus(id, status) {
    await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ status }),
        }
    );

    loadAllBookings();
}

// ================================
// WHATSAPP HELPER (CUSTOMER NUMBER)
// ================================
function openWhatsApp(phone, text) {
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.startsWith("91")) cleaned = "91" + cleaned;

    window.open(
        `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`,
        "_blank"
    );
}
function exportToExcel() {
    if (!allBookings || allBookings.length === 0) {
        alert("No bookings to export");
        return;
    }

    let csv = "Name,Item,Event,Date,Phone,Status\n";

    allBookings.forEach(b => {
        csv += `${b.name},${b.item},${b.event_type},${b.event_date},${b.phone_no},${b.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "bookings.csv";
    link.click();
}

