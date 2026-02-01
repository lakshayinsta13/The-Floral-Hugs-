// ================================
// SUPABASE CONFIG
// ================================
const SUPABASE_URL = "https://muciyuapxwklchdvkimt.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y2l5dWFweHdrbGNoZHZraW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDcxNTEsImV4cCI6MjA4MTUyMzE1MX0.uh0UWRzpfqzUAB_xKnny-Zp_ncHevH10w4vLDNDEEDU";

const TABLE_NAME = "bookings";

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", () => {
    // ================================
    // ELEMENTS
    // ================================
    const bookingForm = document.getElementById("bookingForm");
    const itemInput = document.getElementById("item");

    const productButtons = document.querySelectorAll(".product-btn");
    const multiToggle = document.getElementById("multiMode");

    const cartBtn = document.getElementById("cartButton");
    const cartPopup = document.getElementById("cartPopup");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");

    const qtyRows = document.querySelectorAll(".qty-row");

    if (!bookingForm || !itemInput || !multiToggle) return;

    // ================================
    // STATE
    // ================================
    let multiMode = false;

    /**
     * cart = {
     *   "Red Rose Bouquet": { key, name, price, qty, isCake, unitLabel }
     * }
     */
    let cart = {};

    // ================================
    // FORCE MULTI MODE OFF ON LOAD
    // (fix browser caching checked state)
    // ================================
    function resetMultiModeHard() {
        multiToggle.checked = false;
        multiMode = false;
        cart = {};
        if (cartPopup) cartPopup.classList.add("hidden");
        updateCartUI();
        updateButtons();
    }

    // on first load
    resetMultiModeHard();

    // on back/forward cache restore
    window.addEventListener("pageshow", () => {
        resetMultiModeHard();
    });

    // ================================
    // HELPERS (QTY UI)
    // ================================
    function ensureQtyDefault(row) {
        const qtyEl = row.querySelector(".qty-value");
        if (!qtyEl) return;

        const val = Number(qtyEl.textContent || "0");
        if (!val || val < 1) qtyEl.textContent = "1";

        // If cake title has unit-count, keep it in sync on load
        const card = row.closest(".card");
        const unitCount = card?.querySelector(".unit-count");
        if (unitCount) unitCount.textContent = qtyEl.textContent;
    }

    function getQtyFromRow(row) {
        const qtyEl = row.querySelector(".qty-value");
        const q = Number(qtyEl?.textContent || "1");
        return Math.max(1, q);
    }

    function setQtyToRow(row, qty) {
        const q = Math.max(1, qty);
        const qtyEl = row.querySelector(".qty-value");
        if (qtyEl) qtyEl.textContent = String(q);

        // cake dynamic title update
        const card = row.closest(".card");
        const unitCount = card?.querySelector(".unit-count");
        if (unitCount) unitCount.textContent = String(q);
    }

    // detect cake by presence of .unit-count OR product-title with data-unit
    function getCardMetaFromRow(row) {
        const card = row.closest(".card");
        const titleEl = card?.querySelector(".product-title");

        const hasCakeUnit = !!card?.querySelector(".unit-count");
        const unitLabel = titleEl?.dataset?.unit || (hasCakeUnit ? "Kg" : null);

        const baseNameFromTitle = titleEl?.dataset?.base || null;
        const isCake = !!unitLabel && (hasCakeUnit || !!titleEl?.dataset?.unit);

        return {
            isCake,
            unitLabel: isCake ? unitLabel : null,
            baseNameFromTitle,
        };
    }

    // ================================
    // HELPERS (CART)
    // ================================
    function getTotalQty() {
        return Object.values(cart).reduce((sum, it) => sum + it.qty, 0);
    }

    function getTotalPrice() {
        return Object.values(cart).reduce((sum, it) => sum + it.price * it.qty, 0);
    }

    function buildBookingString() {
        const items = Object.values(cart);
        if (!items.length) return "";

        return items
            .map((it) => {
                if (it.isCake) {
                    return `${it.name} (${it.qty} ${it.unitLabel}) - ₹${it.price * it.qty}`;
                }
                return `${it.name} x${it.qty} - ₹${it.price * it.qty}`;
            })
            .join(", ");
    }

    function updateCartUI() {
        if (!cartItems || !cartTotal || !cartCount || !cartBtn) return;

        cartItems.innerHTML = "";
        const items = Object.values(cart);

        items.forEach((it) => {
            const lineTotal = it.price * it.qty;
            const label = it.isCake
                ? `${it.name} (${it.qty} ${it.unitLabel})`
                : `${it.name} x${it.qty}`;

            const li = document.createElement("li");
            li.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
          <span>${label}</span>
          <span>₹${lineTotal}</span>
        </div>
      `;
            cartItems.appendChild(li);
        });

        cartTotal.textContent = getTotalPrice();
        cartCount.textContent = getTotalQty();
        itemInput.value = buildBookingString();

        // show cart button only in multiMode and if items exist
        cartBtn.classList.toggle("hidden", !multiMode || items.length === 0);
    }

    function updateButtons() {
        productButtons.forEach((btn) => {
            const key = btn.dataset.name || "";
            if (!multiMode) {
                btn.textContent = "Book Now";
            } else {
                btn.textContent = cart[key] ? "Added ✓ (Update Qty)" : "Add Item";
            }
        });
    }

    // ================================
    // MULTI MODE TOGGLE (FIXED)
    // ================================
    multiToggle.addEventListener("change", () => {
        multiMode = multiToggle.checked;

        if (!multiMode) {
            // turning OFF -> clear everything
            cart = {};
            if (cartPopup) cartPopup.classList.add("hidden");
            updateCartUI();
            updateButtons();
        } else {
            // turning ON -> just update button states
            updateButtons();
            updateCartUI();
        }
    });

    // ================================
    // Proceed to booking
    // ================================
    const goToBookingBtn = document.getElementById("goToBooking");
    if (goToBookingBtn) {
        goToBookingBtn.addEventListener("click", () => {
            if (cartPopup) cartPopup.classList.add("hidden");
            document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
        });
    }

    // ================================
    // phone validation
    // ================================
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        });
    }

    // ================================
    // QTY BUTTONS (+ / -)
    // - Only changes UI qty
    // - Does NOT add to cart automatically
    // ================================
    qtyRows.forEach((row) => {
        ensureQtyDefault(row);

        const plus = row.querySelector(".plus");
        const minus = row.querySelector(".minus");

        plus?.addEventListener("click", () => {
            const current = getQtyFromRow(row);
            setQtyToRow(row, current + 1);
        });

        minus?.addEventListener("click", () => {
            const current = getQtyFromRow(row);
            setQtyToRow(row, current - 1); // min 1
        });
    });

    // ================================
    // PRODUCT BUTTON CLICK
    // - reads qty from UI
    // - single mode: goes to booking
    // - multi mode: add/update cart
    // ================================
    productButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".card");
            const row = card?.querySelector(".qty-row");

            const key = btn.dataset.name || "";
            const price = Number(btn.dataset.price || 0);
            const qty = row ? getQtyFromRow(row) : 1;

            const meta = row
                ? getCardMetaFromRow(row)
                : { isCake: false, unitLabel: null, baseNameFromTitle: null };

            const cleanName = meta.isCake ? (meta.baseNameFromTitle || key) : key;

            const itemObj = {
                key,
                name: cleanName,
                price,
                qty,
                isCake: meta.isCake,
                unitLabel: meta.unitLabel,
            };

            if (!multiMode) {
                cart = {};
                cart[key] = itemObj;

                updateCartUI();
                updateButtons();

                // scroll only in single mode
                document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
                return;
            }

            // multi mode
            cart[key] = itemObj;
            updateCartUI();
            updateButtons();
        });
    });

    // ================================
    // CART TOGGLE (FIXED)
    // ================================
    if (cartBtn && cartPopup) {
        cartBtn.addEventListener("click", () => {
            // 🚫 do nothing if multiMode OFF
            if (!multiMode) return;
            cartPopup.classList.toggle("hidden");
        });
    }

    window.closeCart = () => {
        if (cartPopup) cartPopup.classList.add("hidden");
    };

    // ================================
    // FORM SUBMISSION
    // ================================
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const bookingData = {
            name: bookingForm.name.value.trim(),
            location: bookingForm.location.value.trim(),
            event_type: bookingForm.eventType.value.trim(),
            phone_no: bookingForm.phone.value.trim(),
            event_date: bookingForm.eventDate.value,
            item: bookingForm.item.value.trim(),
        };

        // VALIDATION
        for (const key in bookingData) {
            if (!bookingData[key]) {
                showPopup(
                    "Form Incomplete",
                    "Please fill all required fields before submitting."
                );
                return;
            }
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) throw new Error("Insert failed");

            showPopup(
                "Booking Confirmed 🌸",
                `
          Thank you <strong>${bookingData.name}</strong>!<br><br>
          Please take a screenshot of this screen as proof of order.<br><br>
          📲 We will contact you shortly on WhatsApp.
        `
            );

            // RESET EVERYTHING
            bookingForm.reset();
            cart = {};
            itemInput.value = "";
            if (cartPopup) cartPopup.classList.add("hidden");
            updateCartUI();
            updateButtons();

            // reset UI qty back to 1
            qtyRows.forEach((row) => setQtyToRow(row, 1));

            // also reset multi mode OFF (optional but recommended)
            resetMultiModeHard();
        } catch (error) {
            console.error(error);
            showPopup("Booking Failed 😔", "Something went wrong. Please try again later.");
        }
    });

    // ================================
    // POPUP HELPER
    // ================================
    function showPopup(title, message) {
        const popup = document.createElement("div");
        popup.className = "booking-popup";

        popup.innerHTML = `
      <div class="popup-content">
        <span class="close">&times;</span>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;

        document.body.appendChild(popup);

        popup.querySelector(".close").onclick = () => popup.remove();
        setTimeout(() => popup.remove(), 8000);
    }

    // ================================
    // PROMO SLIDER (your same code)
    // ================================
    const track = document.querySelector(".slider-track");
    const slides = document.querySelectorAll(".slide");
    const nextBtn = document.querySelector(".slider-btn.next");
    const prevBtn = document.querySelector(".slider-btn.prev");
    const dotsContainer = document.querySelector(".slider-dots");

    if (track && slides.length) {
        let index = 0;
        let startX = 0;

        dotsContainer.innerHTML = "";
        slides.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.onclick = () => moveTo(i);
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll("span");

        function updateSlider() {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d) => d.classList.remove("active"));
            dots[index].classList.add("active");
        }

        function moveTo(i) {
            index = i;
            updateSlider();
        }

        nextBtn.onclick = () => {
            index = (index + 1) % slides.length;
            updateSlider();
        };

        prevBtn.onclick = () => {
            index = (index - 1 + slides.length) % slides.length;
            updateSlider();
        };

        setInterval(() => {
            index = (index + 1) % slides.length;
            updateSlider();
        }, 4000);

        track.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        track.addEventListener("touchend", (e) => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) nextBtn.click();
            if (endX - startX > 50) prevBtn.click();
        });

        updateSlider();
    }

    // INIT
    updateButtons();
    updateCartUI();
});
