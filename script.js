// Ensure GSAP and ScrollTrigger are loaded in your HTML before this script
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/ScrollTrigger.min.js"></script>

gsap.registerPlugin(ScrollTrigger);

// --- 1. Global Variables & DOM Elements (Only those that are guaranteed to exist or don't need DOMContentLoaded) ---
// These are likely always present from the start
const mainCategoriesSection = document.getElementById('mainCategoriesSection');
const dynamicContentSection = document.getElementById('dynamicContentSection');
const dynamicSectionTitle = document.getElementById('dynamicSectionTitle');
const subCategoryGrid = document.getElementById('subCategoryGrid');
const modelSelectionGrid = document.getElementById('modelSelectionGrid');
const productsGrid = document.getElementById('productsGrid');
const backButtonContainer = document.querySelector('.back-button-container');

// Variables for state management (these don't interact with DOM directly on init)
let currentView = 'categories'; // 'categories', 'subCategories', 'models', 'products'
let currentCategory = null;
let currentModel = null;
let currentProducts = []; // Stores products for the current view
let currentProductImageIndex = 0; // For product image carousel
let currentFullscreenImageIndex = 0; // For fullscreen image viewer

// --- 2. Data (Example data structure, you'll expand this) ---
const catalogueData = {
    "spares": {
        title: "Ather Spares",
        items: [
            { id: "brake-pads", name: "Brake Pads", description: "High-performance brake pads for superior stopping power.", page: "products" },
            { id: "tyres", name: "Tyres", description: "Durable tyres for all-weather grip and stability.", page: "products" },
        ],
        redirectPage: "spares.html" // <--- Specify the HTML file to redirect to
    },
    "accessories-merchandise": {
        title: "Accessories & Merchandise",
        items: [
            { id: "helmets", name: "Helmets", description: "Stylish and safe helmets for Ather riders.", page: "products" },
            { id: "t-shirts", name: "T-Shirts", description: "Official Ather merchandise.", page: "products" },
        ],
        redirectPage: "accessories-merchandise.html" // <--- Specify the HTML file to redirect to
    },
    "charging-infrastructure": {
        title: "Charging Infrastructure",
        items: [
            { id: "home-charger", name: "Home Chargers", description: "Compact and efficient chargers for home use.", page: "products" },
            { id: "ather-grid", name: "Ather Grid Locations", description: "Find public charging points.", page: "locations" }, // Example: link to a map
        ],
        redirectPage: "charging-infrastructure.html" // <--- Specify the HTML file to redirect to
    },

    "product-brake-pads": {
        name: "Ather Performance Brake Pads",
        description: "Optimized for the Ather 450X, these brake pads offer enhanced durability and consistent braking performance in all conditions. Made from a high-grade ceramic compound to reduce wear.",
        partCode: "ATH-BP-001",
        images: ["images/brake_pads_1.jpg", "images/brake_pads_2.jpg", "images/brake_pads_3.jpg"],
        specifications: [
            { key: "Material", value: "Ceramic Composite" },
            { key: "Compatibility", value: "Ather 450X, 450S" },
            { key: "Durability", value: "15,000 km" }
        ]
    },
    "product-tyres": {
        name: "Ather High-Grip Tyres",
        description: "Specifically designed for electric scooter performance, offering superior grip and extended life. Ideal for urban commuting and spirited riding.",
        partCode: "ATH-TY-002",
        images: ["images/tyre_1.jpg", "images/tyre_2.jpg"],
        specifications: [
            { key: "Type", value: "Tubeless" },
            { key: "Material", value: "Dual Compound Rubber" },
            { key: "Compatibility", value: "Ather 450X, 450S" }
        ]
    },
    "product-helmets": {
        name: "Ather Smart Helmet",
        description: "A blend of safety and technology. Features integrated Bluetooth, advanced ventilation, and a lightweight design for maximum comfort and protection.",
        partCode: "ATH-HLM-001",
        images: ["images/helmet_1.jpg", "images/helmet_2.jpg", "images/helmet_3.jpg"],
        specifications: [
            { key: "Size", value: "M, L, XL" },
            { key: "Features", "value": "Bluetooth, Ventilation" },
            { key: "Material", value: "ABS Shell" }
        ]
    },
    "product-t-shirts": {
        name: "Ather Branded T-Shirt",
        description: "Comfortable and stylish t-shirt featuring the iconic Ather logo. Perfect for everyday wear.",
        partCode: "ATH-TS-001",
        images: ["images/tshirt_1.jpg", "images/tshirt_2.jpg"],
        specifications: [
            { key: "Material", value: "100% Cotton" },
            { key: "Sizes", value: "S, M, L, XL" }
        ]
    },
    "product-home-charger": {
        name: "AtherDot Home Charger",
        description: "The intelligent home charging solution for your Ather scooter. Compact, weather-resistant, and easy to install.",
        partCode: "ATH-CHG-001",
        images: ["images/charger_1.jpg", "images/charger_2.jpg"],
        specifications: [
            { key: "Charging Speed", value: "1.2 kW" },
            { key: "Installation", value: "Wall Mount" },
            { key: "Features", value: "Overcharge Protection" }
        ]
    },
    "product-ather-grid": {
        name: "Ather Grid Public Charging Points",
        description: "Access a widespread network of fast-charging points. Locate the nearest Ather Grid for convenient charging on the go.",
        partCode: "ATH-GRID-LOC",
        images: ["images/grid_station_1.jpg", "images/grid_station_2.jpg"],
        specifications: [
            { key: "Type", value: "Fast Charging" },
            { key: "Availability", value: "24/7 (most locations)" }
        ]
    },
    "products-for-ather-450x-model": {
        items: [
            { id: "product-brake-pads", name: "Ather Performance Brake Pads", description: "For 450X.", partCode: "ATH-BP-001", images: ["images/brake_pads_1.jpg"], type: "product" },
            { id: "product-tyres", name: "Ather High-Grip Tyres", description: "For 450X.", partCode: "ATH-TY-002", images: ["images/tyre_1.jpg"], type: "product" }
        ]
    },
};

// --- 3. Animation Functions ---
function animateCardsIn(elements) {
    if (elements.length === 0) return; // Add null/empty check here
    gsap.fromTo(elements,
        { opacity: 0, translateY: 50 },
        {
            opacity: 1,
            translateY: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: elements[0] ? elements[0].closest('section') : 'body',
                start: "top 85%",
                toggleActions: "play none none none"
            }
        }
    );
}

// --- 4. Navigation & Display Logic ---
function showSection(sectionToShow, title, dataItems = []) {
    currentProducts = dataItems; // Store current products for modal/carousel
    dynamicSectionTitle.textContent = title;

    // Hide all dynamic grids
    if (subCategoryGrid) subCategoryGrid.classList.add('hidden');
    if (modelSelectionGrid) modelSelectionGrid.classList.add('hidden');
    if (productsGrid) productsGrid.classList.add('hidden');

    // Clear previous content
    if (subCategoryGrid) subCategoryGrid.innerHTML = '';
    if (modelSelectionGrid) modelSelectionGrid.innerHTML = '';
    if (productsGrid) productsGrid.innerHTML = '';

    // Show the appropriate grid and populate
    let targetGrid;
    if (sectionToShow === 'subCategories') {
        targetGrid = subCategoryGrid;
        populateGrid(subCategoryGrid, dataItems, 'sub-category');
    } else if (sectionToShow === 'models') {
        targetGrid = modelSelectionGrid;
        populateGrid(modelSelectionGrid, dataItems, 'model');
    } else if (sectionToShow === 'products') {
        targetGrid = productsGrid;
        populateGrid(productsGrid, dataItems, 'product');
    }

    if (targetGrid) {
        targetGrid.classList.remove('hidden');
        animateCardsIn(targetGrid.querySelectorAll('.figure-item, .product-card'));
    }

    if (mainCategoriesSection) mainCategoriesSection.classList.add('hidden');
    if (dynamicContentSection) dynamicContentSection.classList.remove('hidden');
    if (backButtonContainer) backButtonContainer.classList.remove('hidden');

    if (dynamicContentSection) {
        gsap.to(window, { duration: 0.5, scrollTo: { y: dynamicContentSection.offsetTop - 100 } });
    }
}

function showCategoryList() {
    currentView = 'categories';
    currentCategory = null;
    currentModel = null;
    currentProducts = [];

    if (mainCategoriesSection) mainCategoriesSection.classList.remove('hidden');
    if (dynamicContentSection) dynamicContentSection.classList.add('hidden');
    if (backButtonContainer) backButtonContainer.classList.add('hidden');

    if (mainCategoriesSection) {
        gsap.to(window, { duration: 0.5, scrollTo: { y: mainCategoriesSection.offsetTop - 100 } });
    }
}

function goBack() {
    if (currentView === 'products' && currentModel) {
        const modelKey = `${currentCategory}-${currentModel}`;
        const modelEntry = catalogueData[currentCategory]?.items.find(item => item.id === currentModel && item.type === 'model');

        if (modelEntry) {
            showSection('models', `${catalogueData[currentCategory].title} Models`, catalogueData[currentCategory].items.filter(item => item.type === 'model'));
            currentView = 'models';
        } else if (catalogueData[currentCategory]?.items) { // Fallback if model not found, go to sub-categories
            showSection('subCategories', catalogueData[currentCategory].title, catalogueData[currentCategory].items);
            currentView = 'subCategories';
        } else {
            showCategoryList(); // Fallback to main categories if no valid previous state
        }
    } else if (currentView === 'products' || currentView === 'models' || currentView === 'subCategories') {
        showCategoryList();
    }
}

// --- 5. Grid Population ---
function populateGrid(gridElement, items, type) {
    if (!gridElement) return; // Ensure gridElement exists
    gridElement.innerHTML = '';

    if (!items || items.length === 0) {
        gridElement.innerHTML = '<p class="no-items-message">No items found here. Please check back later!</p>';
        return;
    }

    items.forEach(item => {
        let itemHtml = '';
        if (type === 'product') {
            itemHtml = `
                <div class="product-card" data-id="${item.id}" data-type="product">
                    <img src="${item.images[0] || 'images/placeholder.png'}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="product-description">${item.description}</p>
                    ${item.partCode ? `<p class="part-code">Part Code: ${item.partCode}</p>` : ''}
                </div>
            `;
        } else {
            itemHtml = `
                <figure class="figure-item" data-id="${item.id}" data-type="${type}">
                    <img src="${item.icon || item.image || 'images/placeholder-icon.png'}" alt="${item.name} Icon">
                    <figcaption>${item.name}</figcaption>
                    <p>${item.description}</p>
                </figure>
            `;
        }
        gridElement.insertAdjacentHTML('beforeend', itemHtml);
    });

    gridElement.querySelectorAll('.figure-item, .product-card').forEach(item => {
        item.addEventListener('click', (event) => {
            const itemId = item.dataset.id;
            const itemType = item.dataset.type;
            handleGridItemClick(itemId, itemType);
        });
    });
}

// --- 6. Grid Item Click Handler ---
function handleGridItemClick(itemId, itemType) {
    if (itemType === 'sub-category') {
        const subCategory = catalogueData[currentCategory]?.items.find(item => item.id === itemId);
        if (!subCategory) {
            console.warn(`Sub-category data not found for ID: ${itemId}`);
            return;
        }

        if (subCategory.page === 'products') {
            const productsForSubCategory = catalogueData[`product-${itemId}`] ? [catalogueData[`product-${itemId}`]] : [];
            showSection('products', subCategory.name, productsForSubCategory);
            currentView = 'products';
        } else if (subCategory.page === 'models') {
            const models = catalogueData[`${currentCategory}`]?.items.filter(item => item.type === 'model') || [];
            if (models.length > 0) {
                showSection('models', `${subCategory.name} Models`, models);
                currentView = 'models';
            } else {
                console.warn(`No models found for ${itemId} within ${currentCategory}`);
                showSection('models', `${subCategory.name} Models`, []);
            }
        } else if (subCategory.page === 'locations') {
            alert(`Redirecting to map for ${subCategory.name}! (Not implemented in this example)`);
        }
    } else if (itemType === 'model') {
        currentModel = itemId;
        const modelProducts = catalogueData[`products-for-${itemId}`]?.items || [];

        if (modelProducts.length > 0) {
            const modelName = catalogueData[currentCategory]?.items.find(item => item.id === itemId)?.name || "Selected Model";
            showSection('products', `${modelName} Products`, modelProducts);
            currentView = 'products';
        } else {
            console.warn(`No products found for model ${itemId}`);
            showSection('products', `${catalogueData[currentCategory]?.items.find(item => item.id === itemId)?.name || "Selected Model"} Products`, []);
        }
    } else if (itemType === 'product') {
        const productId = itemId;
        openProductModal(productId);
    }
}

// --- 7. Main Category Card Event Listener ---
if (mainCategoriesSection) { // Ensure mainCategoriesSection exists before adding listener
    mainCategoriesSection.addEventListener('click', (event) => {
        const card = event.target.closest('.category-card');
        if (card) {
            currentCategory = card.dataset.category;
            const categoryData = catalogueData[currentCategory];

            if (categoryData) {
                if (categoryData.redirectPage) {
                    window.location.href = categoryData.redirectPage;
                    return;
                }
                if (categoryData.items) {
                    showSection('subCategories', categoryData.title, categoryData.items);
                    currentView = 'subCategories';
                } else {
                    console.warn(`No items found for dynamic display in category: ${currentCategory}`);
                }
            } else {
                console.warn(`No data found for category: ${currentCategory}`);
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: ALL DOM element declarations should be inside here ---
    // --- Product Modal related elements ---
    const productModal = document.getElementById('productModal');
    const closeButton = productModal ? productModal.querySelector('.close-button') : null;
    const modalLoading = document.getElementById('modalLoading');
    const modelDetailsContainer = document.getElementById('modelDetailsContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const mainProductImage = document.getElementById('mainProductImage');
    const thumbnailNav = document.getElementById('thumbnailNav');
    const prevImageBtn = document.getElementById('prevImageBtn');
    const nextImageBtn = document.getElementById('nextImageBtn');
    const fullscreenOverlay = document.getElementById('fullscreenOverlay');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const fullscreenClose = document.getElementById('fullscreenClose');
    const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
    const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');
    const modalProductDetails = document.getElementById('modalProductDetails'); // Added this one for specifications

    // --- Add Product Modal related elements (from previous steps) ---
    const addProductModal = document.getElementById('addProductModal');
    const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
    const closeAddProductModal = document.getElementById('closeAddProductModal');
    const productImageInput = document.getElementById('productImage');
    const fileNamesDisplay = document.getElementById('fileNamesDisplay');
    const addProductForm = document.getElementById('addProductForm');


    // Initial animation for main category cards (if already rendered in HTML)
    const categoryCards = mainCategoriesSection ? mainCategoriesSection.querySelectorAll('.category-card') : [];
    if (categoryCards.length > 0) {
        animateCardsIn(categoryCards);
    }

    // --- Add Product Modal Logic ---
    if (openAddProductModalBtn) {
        openAddProductModalBtn.addEventListener('click', () => {
            if (addProductModal) {
                addProductModal.style.display = 'flex'; // Use 'flex' for centering the modal-content
                document.body.style.overflow = 'hidden'; // Prevent scrolling background
            }
        });
    }

    if (closeAddProductModal) {
        closeAddProductModal.addEventListener('click', () => {
            if (addProductModal) {
                addProductModal.style.display = 'none';
                document.body.style.overflow = '';
                if (addProductForm) {
                    addProductForm.reset();
                    if (fileNamesDisplay) fileNamesDisplay.textContent = 'No file(s) chosen';
                }
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === addProductModal && addProductModal) {
            addProductModal.style.display = 'none';
            document.body.style.overflow = '';
            if (addProductForm) {
                addProductForm.reset();
                if (fileNamesDisplay) fileNamesDisplay.textContent = 'No file(s) chosen';
            }
        }
    });

    if (productImageInput) {
        productImageInput.addEventListener('change', () => {
            if (productImageInput.files.length > 0) {
                const fileNames = Array.from(productImageInput.files).map(file => file.name);
                if (fileNamesDisplay) fileNamesDisplay.textContent = fileNames.join(', ');
            } else {
                if (fileNamesDisplay) fileNamesDisplay.textContent = 'No file(s) chosen';
            }
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const partNumber = document.getElementById('partNumber')?.value;
            const partName = document.getElementById('partName')?.value;
            const images = document.getElementById('productImage')?.files;

            console.log('Form Submitted!');
            console.log('Part Number:', partNumber);
            console.log('Part Name:', partName);
            console.log('Images:', images);

            // Close the modal after submission (for now, without actual backend call)
            if (addProductModal) {
                addProductModal.style.display = 'none';
                document.body.style.overflow = '';
                addProductForm.reset();
                if (fileNamesDisplay) fileNamesDisplay.textContent = 'No file(s) chosen';
                alert('Product submission simulated! Check console for data.');
            }
        });
    }

    // --- Product Modal Functions (moved and updated with null checks) ---
    function openProductModal(productId) {
        const product = catalogueData[`product-${productId}`];

        if (!product) {
            console.error("Product data not found for ID:", productId);
            return;
        }

        currentProductImageIndex = 0;
        if (thumbnailNav) thumbnailNav.innerHTML = '';
        if (mainProductImage) {
            mainProductImage.src = '';
            mainProductImage.alt = '';
            mainProductImage.classList.add('hidden');
        }

        if (modalLoading) modalLoading.classList.remove('hidden');
        if (modelDetailsContainer) modelDetailsContainer.classList.add('hidden');
        if (productModal) productModal.style.display = 'flex'; // Use 'flex' for centering
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (modalTitle) modalTitle.textContent = product.name;
            const partCodeHtml = product.partCode ? `<p class="modal-part-code">Part Code: ${product.partCode}</p>` : '';
            if (modalDescription) modalDescription.innerHTML = `${product.description}${partCodeHtml}`;

            if (modalProductDetails) {
                modalProductDetails.innerHTML = '';
                if (product.specifications && product.specifications.length > 0) {
                    let detailsHtml = '<div class="product-specs-grid">';
                    product.specifications.forEach(spec => {
                        detailsHtml += `
                            <div class="spec-item">
                                <strong>${spec.key}:</strong> <span>${spec.value}</span>
                            </div>
                        `;
                    });
                    detailsHtml += '</div>';
                    modalProductDetails.insertAdjacentHTML('beforeend', detailsHtml);
                }
            }

            if (product.images && product.images.length > 0) {
                if (thumbnailNav) {
                    product.images.forEach((imgSrc, index) => {
                        const thumbnail = document.createElement('img');
                        thumbnail.src = imgSrc;
                        thumbnail.alt = `${product.name} Thumbnail ${index + 1}`;
                        thumbnail.dataset.index = index;
                        thumbnail.addEventListener('click', () => showProductImage(index));
                        thumbnailNav.appendChild(thumbnail);
                    });
                }
                showProductImage(0);
                if (prevImageBtn) prevImageBtn.classList.remove('hidden');
                if (nextImageBtn) nextImageBtn.classList.remove('hidden');
                if (thumbnailNav) thumbnailNav.classList.remove('hidden');
                if (mainProductImage) mainProductImage.classList.remove('hidden');
            } else {
                if (prevImageBtn) prevImageBtn.classList.add('hidden');
                if (nextImageBtn) nextImageBtn.classList.add('hidden');
                if (thumbnailNav) thumbnailNav.classList.add('hidden');
                if (mainProductImage) mainProductImage.classList.add('hidden');
            }

            if (modalLoading) modalLoading.classList.add('hidden');
            if (modelDetailsContainer) modelDetailsContainer.classList.remove('hidden');
        }, 500);
    }

    function closeProductModal() {
        if (productModal) productModal.style.display = 'none';
        document.body.style.overflow = '';
        closeFullscreenImage();
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeProductModal);
    }
    if (productModal) {
        productModal.addEventListener('click', (event) => {
            if (event.target === productModal) {
                closeProductModal();
            }
        });
    }

    if (prevImageBtn) {
        prevImageBtn.addEventListener('click', () => {
            const currentProductInModal = Object.values(catalogueData).find(data => modalTitle && data.name === modalTitle.textContent && data.images);
            if (currentProductInModal && currentProductInModal.images) {
                currentProductImageIndex = (currentProductImageIndex - 1 + currentProductInModal.images.length) % currentProductInModal.images.length;
                showProductImage(currentProductImageIndex);
            }
        });
    }

    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', () => {
            const currentProductInModal = Object.values(catalogueData).find(data => modalTitle && data.name === modalTitle.textContent && data.images);
            if (currentProductInModal && currentProductInModal.images) {
                currentProductImageIndex = (currentProductImageIndex + 1) % currentProductInModal.images.length;
                showProductImage(currentProductImageIndex);
            }
        });
    }

    function showProductImage(index) {
        const currentProductInModal = Object.values(catalogueData).find(data => modalTitle && data.name === modalTitle.textContent && data.images);
        if (currentProductInModal && currentProductInModal.images && currentProductInModal.images[index]) {
            if (mainProductImage) {
                mainProductImage.src = currentProductInModal.images[index];
                mainProductImage.alt = `${currentProductInModal.name} Image ${index + 1}`;
            }
            currentProductImageIndex = index;

            if (thumbnailNav) {
                thumbnailNav.querySelectorAll('img').forEach((img, i) => {
                    if (i === index) {
                        img.classList.add('active-thumbnail');
                    } else {
                        img.classList.remove('active-thumbnail');
                    }
                });
            }
        }
    }

    if (mainProductImage) {
        mainProductImage.addEventListener('click', () => {
            const currentProductInModal = Object.values(catalogueData).find(data => modalTitle && data.name === modalTitle.textContent && data.images);
            if (currentProductInModal && currentProductInModal.images && currentProductInModal.images.length > 0) {
                currentFullscreenImageIndex = currentProductImageIndex;
                openFullscreenImage(currentProductInModal.images, currentFullscreenImageIndex);
            }
        });
    }

    function openFullscreenImage(images, startIndex) {
        if (fullscreenImage) fullscreenImage.dataset.images = JSON.stringify(images);
        if (fullscreenOverlay) fullscreenOverlay.style.display = 'flex'; // Use 'flex' for centering
        document.body.style.overflow = 'hidden';
        showFullscreenImage(startIndex);
    }

    function closeFullscreenImage() {
        if (fullscreenOverlay) fullscreenOverlay.style.display = 'none';
        document.body.style.overflow = '';
        if (fullscreenImage) fullscreenImage.removeAttribute('data-images');
    }

    if (fullscreenClose) {
        fullscreenClose.addEventListener('click', closeFullscreenImage);
    }

    if (fullscreenPrevBtn) {
        fullscreenPrevBtn.addEventListener('click', () => {
            const images = JSON.parse(fullscreenImage?.dataset.images || '[]');
            if (images.length > 0) {
                currentFullscreenImageIndex = (currentFullscreenImageIndex - 1 + images.length) % images.length;
                showFullscreenImage(currentFullscreenImageIndex);
            }
        });
    }

    if (fullscreenNextBtn) {
        fullscreenNextBtn.addEventListener('click', () => {
            const images = JSON.parse(fullscreenImage?.dataset.images || '[]');
            if (images.length > 0) {
                currentFullscreenImageIndex = (currentFullscreenImageIndex + 1) % images.length;
                showFullscreenImage(currentFullscreenImageIndex);
            }
        });
    }

    function showFullscreenImage(index) {
        const images = JSON.parse(fullscreenImage?.dataset.images || '[]');
        if (images[index]) {
            if (fullscreenImage) {
                fullscreenImage.src = images[index];
                fullscreenImage.alt = `Full screen image ${index + 1}`;
            }
            currentFullscreenImageIndex = index;
        }
    }

    // Ensure initial view is categories
    showCategoryList();

    // Back button listener
    if (backButtonContainer) {
        backButtonContainer.addEventListener('click', goBack);
    }
});