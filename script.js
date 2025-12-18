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
    const bookingForm = document.getElementById("bookingForm");
    const itemInput = document.getElementById("item");

    if (!bookingForm) return;

    // ================================
    // BOOK NOW BUTTON (FROM UI CARDS)
    // ================================
    window.bookNow = function (itemName) {
        if (itemInput) itemInput.value = itemName;
        document
            .getElementById("order")
            .scrollIntoView({ behavior: "smooth" });
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

        // ================================
        // VALIDATION
        // ================================
        for (const field in bookingData) {
            if (!bookingData[field]) {
                showPopup(
                    "Form Incomplete",
                    "Please fill all required fields before submitting your booking."
                );
                return;
            }
        }

        // ================================
        // SEND TO SUPABASE
        // ================================
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

            // Supabase returns empty body → do NOT parse JSON
            if (!response.ok) {
                throw new Error("Supabase insert failed");
            }

            // ================================
            // SUCCESS
            // ================================
            showPopup(
                "Booking Confirmed 🌸",
                `
        Thank you <strong>${bookingData.name}</strong>!<br><br>
        Your booking request has been sent successfully.<br>
        We will contact you shortly on <strong>WhatsApp</strong> to confirm details.
        `
            );

            bookingForm.reset();

        } catch (err) {
            console.error("Booking error:", err);

            showPopup(
                "Booking Failed 😔",
                `
        Something went wrong while sending your booking.<br><br>
        Please try again later or contact us on WhatsApp.
        `
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
    // PROMO SLIDER (NO EARLY RESET)
    // ================================
    const track = document.querySelector(".slider-track");
    const slides = document.querySelectorAll(".slide");
    const nextBtn = document.querySelector(".slider-btn.next");
    const prevBtn = document.querySelector(".slider-btn.prev");
    const dotsContainer = document.querySelector(".slider-dots");

    if (track && slides.length > 0) {
        let index = 0;
        let startX = 0;
        const total = slides.length;

        // Dots
        dotsContainer.innerHTML = "";
        for (let i = 0; i < total; i++) {
            const dot = document.createElement("span");
            dot.onclick = () => moveTo(i);
            dotsContainer.appendChild(dot);
        }
        const dots = dotsContainer.querySelectorAll("span");

        function update() {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach(d => d.classList.remove("active"));
            dots[index].classList.add("active");
        }

        function moveTo(i) {
            index = i;
            update();
        }

        nextBtn.onclick = () => {
            index++;
            if (index === total) index = 0;
            update();
        };

        prevBtn.onclick = () => {
            index--;
            if (index < 0) index = total - 1;
            update();
        };

        // Auto slide
        setInterval(() => {
            index++;
            if (index === total) index = 0;
            update();
        }, 4000);

        // Swipe support
        track.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });

        track.addEventListener("touchend", e => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) nextBtn.click();
            if (endX - startX > 50) prevBtn.click();
        });

        update();
    }
});