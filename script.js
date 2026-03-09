// ================================
// SUPABASE CONFIG
// ================================
const SUPABASE_URL = "https://muciyuapxwklchdvkimt.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y2l5dWFweHdrbGNoZHZraW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDcxNTEsImV4cCI6MjA4MTUyMzE1MX0.uh0UWRzpfqzUAB_xKnny-Zp_ncHevH10w4vLDNDEEDU";

const TABLE_NAME = "bookings";
const PRODUCTS_TABLE = "products";

let products = []; // dynamic list coming from DB

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", () => {
    // ================================
    // ELEMENTS
    // ================================
    const bookingForm = document.getElementById("bookingForm");
    const itemInput = document.getElementById("item");
    // ✅ Terms checkbox + submit button
    const agreeTerms = document.getElementById("agreeTerms");
    const submitBookingBtn = document.getElementById("submitBookingBtn");
    // ✅ RECEIPT ELEMENTS
    const receiptModal = document.getElementById("receiptModal");
    const closeReceipt = document.getElementById("closeReceipt");
    const printReceipt = document.getElementById("printReceipt");

    const rId = document.getElementById("rId");
    const rTime = document.getElementById("rTime");
    const rName = document.getElementById("rName");
    const rPhone = document.getElementById("rPhone");
    const rLocation = document.getElementById("rLocation");
    const rOccasion = document.getElementById("rOccasion");
    const rEventDate = document.getElementById("rEventDate");
    const rItems = document.getElementById("rItems");
    const rTotal = document.getElementById("rTotal");



    const multiToggle = document.getElementById("multiMode");

    const cartBtn = document.getElementById("cartButton");
    const cartPopup = document.getElementById("cartPopup");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");

    const qtyRows = document.querySelectorAll(".qty-row");

    if (!bookingForm || !itemInput || !multiToggle) return;

    // load product catalogue from backend
    loadProducts();
    // ================================
    // TERMS CHECKBOX -> ENABLE SUBMIT
    // ================================
    if (agreeTerms && submitBookingBtn) {
        // Always start disabled on page load
        submitBookingBtn.disabled = !agreeTerms.checked;

        agreeTerms.addEventListener("change", () => {
            submitBookingBtn.disabled = !agreeTerms.checked;
        });
    }


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
        const btns = document.querySelectorAll(".product-btn");
        btns.forEach((btn) => {
            const key = btn.dataset.name || "";
            if (!multiMode) {
                btn.textContent = "Order Now";
            } else {
                btn.textContent = cart[key] ? "Added ✓ (Update Qty)" : "Add Item";
            }
        });
    }

    // ================================
    // PRODUCT FETCH / RENDER
    // ================================
    async function loadProducts() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
        try {
            const baseUrl = `${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}`;
            // Fetch all products and filter publish state client-side to avoid schema mismatch errors.
            const res = await fetch(`${baseUrl}?order=id.asc`, {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
            });
            const json = await res.json();

            if (Array.isArray(json)) {
                products = json.filter((p) => {
                    if (typeof p.publish_status === 'string') return p.publish_status === 'Published';
                    if (typeof p.published === 'boolean') return p.published;
                    return true;
                });
            } else {
                console.error('unexpected products response', json);
                products = [];
            }

            renderProducts();
        } catch (err) {
            console.error("Failed to load products", err);
        } finally {
            if (overlay) overlay.style.display = 'none';
        }
    }

    function renderProducts() {
        const grid = document.getElementById("productsGrid");
        if (!grid) return;
        grid.innerHTML = "";

        if (!Array.isArray(products)) {
            console.warn('renderProducts called with non-array', products);
            products = [];
        }

        products.forEach((p) => {
            grid.insertAdjacentHTML("beforeend", createCardHTML(p));
        });
        setupProductListeners();
        updateButtons();
    }

    function createCardHTML(p) {
        const originalPrice = (p.price || 0) + (p.discount || 0);
        const showPriceHTML = p.discount && p.discount > 0 ? `<span class="show-price">₹${originalPrice}</span>` : "";
        const offerHTML = p.details ? `<div class="offer">${p.details}</div>` : "";
        const imgHTML = p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : "";
        const qtyType = p.quantity_type || '';
        const titleAttrs = `data-base="${p.name}" data-unit="${qtyType}"`;
        const titleText = p.name;
        const qtyTitlePart = qtyType ? ` (<span class="unit-count">1</span> ${qtyType})` : '';

        const discountBadge = p.discount && p.discount > 0 ? `<div class="discount-badge">-₹${p.discount}</div>` : "";
        return `
        <div class="card">
            ${discountBadge}
            ${imgHTML}
            <h3 class="product-title" ${titleAttrs}>${titleText}${qtyTitlePart}</h3>
            <p class="price">
                ₹${p.price}
                ${showPriceHTML}
            </p>
            ${offerHTML}
            <div class="qty-row" data-name="${p.name}" data-price="${p.price}">
                <button type="button" class="qty-btn minus">−</button>
                <span class="qty-value">1</span>
                <button type="button" class="qty-btn plus">+</button>
            </div>
            <button type="button" class="product-btn" data-name="${p.name}" data-price="${p.price}">
                Order Now
            </button>
        </div>
        `;
    }

    function setupProductListeners() {
        const rows = document.querySelectorAll(".qty-row");
        rows.forEach((row) => {
            ensureQtyDefault(row);
            const plus = row.querySelector(".plus");
            const minus = row.querySelector(".minus");
            plus?.addEventListener("click", () => {
                const current = getQtyFromRow(row);
                setQtyToRow(row, current + 1);
            });
            minus?.addEventListener("click", () => {
                const current = getQtyFromRow(row);
                setQtyToRow(row, current - 1);
            });
        });

        const btns = document.querySelectorAll(".product-btn");
        btns.forEach((btn) => {
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

                    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
                    return;
                }

                cart[key] = itemObj;
                updateCartUI();
                updateButtons();
            });
        });
    }

    // ================================
    // MULTI MODE TOGGLE ()
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
    // Proceed to checkout
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

    // product button handling is attached after products render


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
        // ✅ stop submit if terms not accepted
        if (agreeTerms && !agreeTerms.checked) {
            showPopup("Terms Required", "Please accept Terms & Conditions to place your order request.");
            return;
        }


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
                "Order Request Sent Successfully  🌸",
                `
      Thank you <strong>${bookingData.name}</strong>!<br><br>
    ✅ Your order request has been saved.<br>
      📲 We will contact you shortly on WhatsApp for confirmation.<br><br>

      <button id="viewReceiptBtn" style="margin-top:10px; padding:10px 14px; border:none; border-radius:10px; cursor:pointer;">
        View Receipt 🧾
      </button>
    `
            );
            // ✅ Build receipt data from current cart BEFORE reset
            const receiptId = "AC-" + Date.now();
            const now = new Date();
            const timeStr = now.toLocaleString("en-IN");

            const itemsArray = Object.values(cart).map((it) => {
                const amount = it.price * it.qty;
                const label = it.isCake
                    ? `${it.name} (${it.qty} ${it.unitLabel})`
                    : `${it.name} x${it.qty}`;
                return { label, amount };
            });

            const receiptData = {
                id: receiptId,
                time: timeStr,
                name: bookingData.name,
                phone: bookingData.phone_no,
                location: bookingData.location,
                occasion: bookingData.event_type,
                eventDate: bookingData.event_date,
                items: itemsArray,
                total: getTotalPrice(),
            };

            // ✅ connect popup button click -> open receipt
            setTimeout(() => {
                const btn = document.getElementById("viewReceiptBtn");
                if (btn) btn.onclick = () => openReceipt(receiptData);
            }, 0);



            // RESET EVERYTHING
            bookingForm.reset();
            // ✅ reset terms checkbox + disable button again
            if (agreeTerms) agreeTerms.checked = false;
            if (submitBookingBtn) submitBookingBtn.disabled = true;

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
            showPopup("Order Submission Failed 😔", "Something went wrong. Please try again later.");
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
    // RECEIPT MODAL HELPERS
    // ================================
    function openReceipt(receiptData) {
        if (!receiptModal) return;

        rId.textContent = receiptData.id;
        rTime.textContent = receiptData.time;
        rName.textContent = receiptData.name;
        rPhone.textContent = receiptData.phone;
        rLocation.textContent = receiptData.location;
        rOccasion.textContent = receiptData.occasion;
        rEventDate.textContent = receiptData.eventDate;

        // Items
        rItems.innerHTML = "";
        receiptData.items.forEach((it) => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${it.label}</span><span>₹${it.amount}</span>`;
            rItems.appendChild(li);
        });

        rTotal.textContent = receiptData.total;

        receiptModal.classList.remove("hidden");
    }

    function closeReceiptModal() {
        receiptModal?.classList.add("hidden");
    }

    closeReceipt?.addEventListener("click", closeReceiptModal);

    // click outside to close
    receiptModal?.addEventListener("click", (e) => {
        if (e.target === receiptModal) closeReceiptModal();
    });

    // print receipt
    printReceipt?.addEventListener("click", () => {
        window.print();
    });


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
