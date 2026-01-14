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

    if (!bookingForm || !itemInput) return;

    // ================================
    // STATE
    // ================================
    let multiMode = false;
    let selectedItems = [];

    // ================================
    // MULTI MODE TOGGLE
    // ================================
    multiToggle.addEventListener("change", () => {
        multiMode = multiToggle.checked;
        selectedItems = [];
        updateCart();
        updateButtons();
    });
    // booking navigation for cart list 
    const goToBookingBtn = document.getElementById("goToBooking");

    if (goToBookingBtn) {
        goToBookingBtn.addEventListener("click", () => {
            cartPopup.classList.add("hidden");
            document.getElementById("order")
                .scrollIntoView({ behavior: "smooth" });
        });
    }
    // phone no validation for indian format
    const phoneInput = document.getElementById("phone");

    // Block non-numeric typing
    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    });


    // ================================
    // PRODUCT BUTTON CLICK
    // ================================
    productButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.dataset.item;

            // SINGLE MODE
            if (!multiMode) {
                itemInput.value = item;
                document.getElementById("order")
                    .scrollIntoView({ behavior: "smooth" });
                return;
            }

            // MULTI MODE
            if (!selectedItems.includes(item)) {
                selectedItems.push(item);
                updateCart();
                updateButtons();
            }
        });
    });

    // ================================
    // UPDATE CART UI
    // ================================
    function updateCart() {
        cartItems.innerHTML = "";
        let total = 0;

        selectedItems.forEach((item, index) => {
            const price = Number(item.match(/₹(\d+)/)?.[1] || 0);
            total += price;

            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item}</span>
                <button data-index="${index}">❌</button>
            `;
            cartItems.appendChild(li);
        });

        cartTotal.textContent = total;
        cartCount.textContent = selectedItems.length;
        itemInput.value = selectedItems.join(", ");

        cartBtn.classList.toggle(
            "hidden",
            !multiMode || selectedItems.length === 0
        );

        // REMOVE ITEM
        cartItems.querySelectorAll("button").forEach(btn => {
            btn.onclick = () => {
                selectedItems.splice(btn.dataset.index, 1);
                updateCart();
                updateButtons();
            };
        });
    }

    // ================================
    // UPDATE BUTTON TEXT
    // ================================
    function updateButtons() {
        productButtons.forEach(btn => {
            const item = btn.dataset.item;

            if (!multiMode) {
                btn.textContent = "Book Now";
            } else {
                btn.textContent = selectedItems.includes(item)
                    ? "Added ✓"
                    : "Add Item";
            }
        });
    }

    // ================================
    // CART TOGGLE
    // ================================
    cartBtn.addEventListener("click", () => {
        cartPopup.classList.toggle("hidden");
    });

    window.closeCart = () => {
        cartPopup.classList.add("hidden");
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

        // SEND TO SUPABASE
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify(bookingData),
                }
            );

            if (!response.ok) throw new Error("Insert failed");

            // SUCCESS
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
            selectedItems = [];
            updateCart();
            updateButtons();
            cartPopup.classList.add("hidden");

        } catch (error) {
            console.error(error);
            showPopup(
                "Booking Failed 😔",
                "Something went wrong. Please try again later."
            );
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
    // PROMO SLIDER
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
            dots.forEach(d => d.classList.remove("active"));
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

        track.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });

        track.addEventListener("touchend", e => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) nextBtn.click();
            if (endX - startX > 50) prevBtn.click();
        });

        updateSlider();
    }
});
