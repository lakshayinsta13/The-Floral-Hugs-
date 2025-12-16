function whatsappOrder(product) {
    const phone = "919875543210"; // your WhatsApp number
    const message = `Hello 🌸 I want to order:\n\n${product}\n\nPlease share delivery details.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
}

