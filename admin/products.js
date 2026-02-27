
// very similar configuration as admin.js
const SUPABASE_URL = "https://muciyuapxwklchdvkimt.supabase.co";
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y2l5dWFweHdrbGNoZHZraW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDcxNTEsImV4cCI6MjA4MTUyMzE1MX0.uh0UWRzpfqzUAB_xKnny-Zp_ncHevH10w4vLDNDEEDU";

const PRODUCTS_TABLE = "products";
let allProducts = [];
let isEditMode = false; // Global flag for edit mode

// escape helper for safe insertion into HTML
function escapeHtml(input) {
    if (input === null || input === undefined) return "";
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


async function loadAllProducts() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}?order=id.asc`, {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
            },
        });
        const data = await res.json();
        allProducts = data;
        renderProductsTable();
    } catch (err) {
        console.error("failed to load products", err);
    }
}

// attach logout handler if button present
function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.adminLogout) window.adminLogout();
            else location.href = 'login.html';
        });
    }
}

function renderProductsTable() {
    // cache DOM elements
    const pubBody = document.querySelector('#publishedTable tbody');
    const unpubBody = document.querySelector('#unpublishedTable tbody');
    const singleBody = document.querySelector('#productsTable tbody');

    if (!allProducts.length) {
        const empty = '<tr><td colspan="8" align="center">No products</td></tr>';
        if (pubBody) pubBody.innerHTML = empty;
        if (unpubBody) unpubBody.innerHTML = empty;
        if (singleBody) singleBody.innerHTML = empty;
        return;
    }

    const useSingle = !pubBody && !unpubBody && !!singleBody;
    let pubHtml = '';
    let unpubHtml = '';
    let singleHtml = '';

    allProducts.forEach(p => {
        const imgCell = p.image_url ? (p.image_url.startsWith('data:') || p.image_url.match(/^https?:\/\//) ? `<img src="${p.image_url}" style="max-width:80px; max-height:80px; object-fit:cover;"/>` : `<a href="${p.image_url}" target="_blank">view</a>`) : '';
        const publishedChecked = (p.publish_status === 'Published' || p.published) ? 'checked' : '';
        const qtyType = p.quantity_type || '';
        const rowHtml = `
            <tr>
                <td data-label="Name">${escapeHtml(p.name)}</td>
                <td data-label="Qty Type">${escapeHtml(qtyType)}</td>
                <td data-label="Price">${escapeHtml(p.price)}</td>
                <td data-label="Discount">${escapeHtml(p.discount || 0)}</td>
                <td data-label="Details">${escapeHtml(p.details || "")}</td>
                <td data-label="Image">${imgCell}</td>
                <td data-label="Published" style="text-align:center;"><input type="checkbox" class="publish-toggle" data-id="${p.id}" ${publishedChecked}></td>
                <td data-label="Actions">
                    <button class="edit-product" data-id="${p.id}">Edit</button>
                    <button class="delete-product" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `;
        if (useSingle) {
            singleHtml += rowHtml;
        } else {
            if ((p.publish_status === 'Published') || p.published) {
                pubHtml += rowHtml;
            } else {
                unpubHtml += rowHtml;
            }
        }
    });

    if (useSingle && singleBody) singleBody.innerHTML = singleHtml;
    if (!useSingle) {
        if (pubBody) pubBody.innerHTML = pubHtml;
        if (unpubBody) unpubBody.innerHTML = unpubHtml;
    }
}

async function updateProduct(id, fields) {
    await fetch(`${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}?id=eq.${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(fields),
    });
}

async function addProduct(prod) {
    await fetch(`${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(prod),
    });
}

async function deleteProduct(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}?id=eq.${id}`, {
        method: "DELETE",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
    });
    loadAllProducts();
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllProducts();
    initLogoutButton();

    const productForm = document.getElementById("productForm");
    const prodFileInput = document.getElementById('prodFile');
    const prodPreview = document.getElementById('prodPreview');
    const prodImgHidden = document.getElementById('prodImg');
    const prodIdHidden = document.getElementById('prodId');
    const prodPublished = document.getElementById('prodPublished');
    const prodQtyType = document.getElementById('prodQtyType');
    const productSubmitBtn = document.getElementById('productSubmitBtn');
    const cancelEditBtn = document.getElementById('cancelEdit');

    if (prodFileInput) {
        prodFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) {
                if (prodPreview) prodPreview.style.display = 'none';
                if (prodImgHidden) prodImgHidden.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please choose an image file.');
                prodFileInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (prodPreview) {
                    prodPreview.src = reader.result;
                    prodPreview.style.display = 'block';
                }
                if (prodImgHidden) prodImgHidden.value = reader.result; // DataURL
            };
            reader.readAsDataURL(file);
        });
    }

    if (productForm) {
        productForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("prodName").value.trim();
            const qtyType = document.getElementById("prodQtyType").value.trim();
            const price = parseFloat(document.getElementById("prodPrice").value);
            const discount = parseFloat(document.getElementById("prodDiscount").value) || 0;
            const details = document.getElementById("prodDetails").value.trim();
            const image_url = document.getElementById("prodImg").value.trim();
            const published = prodPublished && prodPublished.checked;

            if (!name || isNaN(price)) {
                alert("Name and price are required.");
                return;
            }

            const existingId = prodIdHidden?.value ? String(prodIdHidden.value).trim() : '';
            console.log('Form submission - Edit mode:', isEditMode, 'Existing ID:', existingId);

            try {
                if (isEditMode && existingId) {
                    // UPDATE existing product
                    console.log('Updating product ID:', existingId);
                    await updateProduct(existingId, { name, quantity_type: qtyType || null, price, discount, details: details || null, image_url: image_url || null, publish_status: published ? 'Published' : 'Not Published' });
                    alert('Product updated successfully!');
                } else {
                    // CREATE new product
                    console.log('Creating new product');
                    await addProduct({ name, quantity_type: qtyType || null, price, discount, details: details || null, image_url: image_url || null, publish_status: published ? 'Published' : 'Not Published' });
                    alert('Product added successfully!');
                }
            } catch (err) {
                console.error('Error saving product:', err);
                alert('Error saving product. Check console.');
                return;
            }

            // reset form and exit edit mode
            productForm.reset();
            isEditMode = false;
            if (prodPreview) {
                prodPreview.style.display = 'none';
                prodPreview.src = '';
            }
            if (prodFileInput) prodFileInput.value = '';
            if (prodImgHidden) prodImgHidden.value = '';
            if (prodIdHidden) prodIdHidden.value = '';
            if (productSubmitBtn) productSubmitBtn.textContent = 'Add Product';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';

            loadAllProducts();
        });
    }

    // cancel edit
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            isEditMode = false;
            if (productForm) productForm.reset();
            if (prodPreview) {
                prodPreview.style.display = 'none';
                prodPreview.src = '';
            }
            if (prodFileInput) prodFileInput.value = '';
            if (prodImgHidden) prodImgHidden.value = '';
            if (prodIdHidden) prodIdHidden.value = '';
            if (productSubmitBtn) productSubmitBtn.textContent = 'Add Product';
            cancelEditBtn.style.display = 'none';
        });
    }
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-product")) {
        const id = e.target.dataset.id;
        if (confirm("Remove this product?")) {
            deleteProduct(id);
        }
    }
    if (e.target.classList.contains('edit-product')) {
        const id = e.target.dataset.id;
        const prod = allProducts.find(x => String(x.id) === String(id));
        if (!prod) {
            alert('Product not found');
            return;
        }

        // Set global edit mode flag
        isEditMode = true;
        console.log('Edit mode ON for product ID:', id);

        // populate form for editing
        document.getElementById('prodName').value = prod.name || '';
        document.getElementById('prodPrice').value = prod.price || '';
        document.getElementById('prodDiscount').value = prod.discount || '';
        document.getElementById('prodDetails').value = prod.details || '';
        const prodImgHidden = document.getElementById('prodImg');
        const prodIdHidden = document.getElementById('prodId');
        const prodPreview = document.getElementById('prodPreview');
        const prodPublished = document.getElementById('prodPublished');
        const prodQtyType = document.getElementById('prodQtyType');
        const productSubmitBtn = document.getElementById('productSubmitBtn');
        const cancelEditBtn = document.getElementById('cancelEdit');

        if (prodImgHidden) prodImgHidden.value = prod.image_url || '';
        if (prodPreview) {
            if (prod.image_url) {
                prodPreview.src = prod.image_url;
                prodPreview.style.display = 'block';
            } else {
                prodPreview.style.display = 'none';
                prodPreview.src = '';
            }
        }
        if (prodPublished) prodPublished.checked = (prod.publish_status === 'Published');
        if (prodQtyType) prodQtyType.value = prod.quantity_type || '';
        if (prodIdHidden) {
            prodIdHidden.value = String(prod.id);
            console.log('Set product ID for edit:', prodIdHidden.value);
        }
        if (productSubmitBtn) productSubmitBtn.textContent = 'Update Product';
        if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// delegated change handler for publish toggles
document.addEventListener('change', async (e) => {
    if (e.target.classList && e.target.classList.contains('publish-toggle')) {
        const id = e.target.dataset.id;
        const checked = !!e.target.checked;
        if (checked) {
            if (!confirm('Publish this product now?')) {
                // revert toggle
                e.target.checked = false;
                return;
            }
        }
        await updateProduct(id, { publish_status: checked ? 'Published' : 'Not Published' });
        loadAllProducts();
    }
});
