// Ensure GSAP and ScrollTrigger are loaded before this script runs
document.addEventListener('DOMContentLoaded', () => {

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // --- DOM Elements ---
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-form');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const backButton = document.getElementById('backButton');

    const productsSection = document.getElementById('productsSection');
    const productsSectionTitle = document.getElementById('productsSectionTitle');
    const productsGrid = document.getElementById('productsGrid');
    const noProductsMessage = document.getElementById('noProductsMessage');

    const mainModal = document.getElementById('mainModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalLoading = document.getElementById('modalLoading');

    const productDetailContainer = document.getElementById('productDetailContainer');
    const productDetailName = document.getElementById('productDetailName');
    const productDetailPartCode = document.getElementById('productDetailPartCode');
    const mainProductImage = document.getElementById('mainProductImage');
    const thumbnailNav = document.getElementById('thumbnailNav');
    const prevImageBtn = document.getElementById('prevImageBtn');
    const nextImageBtn = document.getElementById('nextImageBtn');
    const productDetailDescription = document.getElementById('productDetailDescription');
    const backToProductListBtn = document.getElementById('backToProductListBtn');

    const fullscreenOverlay = document.getElementById('fullscreenOverlay');
    const closeFullscreen = document.getElementById('closeFullscreen');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
    const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');

    // --- Global State Variables ---
    let productsData = []; // Will be populated dynamically
    let currentMainCategory = ''; // e.g., 'accessories-merchandise', 'spares', 'charging-infrastructure'
    let currentState = 'categories'; // 'categories', 'sub-categories', 'models', 'products', 'product-detail'
    let currentSubCategory = null;
    let currentModel = null;
    let currentImages = [];
    let currentImageIndex = 0;

    // --- Get Index URL from Meta Tag ---
    const indexUrlMeta = document.querySelector('meta[name="index-url"]');
    const indexUrl = indexUrlMeta ? indexUrlMeta.content : '/'; // Fallback to '/' if not found

    // Function to get current main category from URL
    function getCurrentMainCategory() {
        const path = window.location.pathname;
        if (path.includes('accessories-merchandise.html')) return 'accessories-merchandise';
        if (path.includes('spares.html')) return 'spares';
        if (path.includes('charging-infrastructure.html')) return 'charging-infrastructure';
        return '';
    }

    currentMainCategory = getCurrentMainCategory();

    // --- Product Data Loading ---
    async function loadProductsData() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            productsData = await response.json();
            console.log("Products data loaded:", productsData); // For debugging

            // After data is loaded, proceed with initial display
            if (currentMainCategory === 'accessories-merchandise') {
                displayProducts('anm-all');
                // The back button for 'anm-all' will now be handled by the central event listener
                const allBtn = document.querySelector('.filter-btn[data-filter="anm-all"]');
                if(allBtn) {
                    allBtn.classList.add('active');
                }
            } else if (currentMainCategory === 'spares' || currentMainCategory === 'charging-infrastructure') {
                renderSubCategories();
            }

        } catch (error) {
            console.error("Failed to load products data:", error);
            // Optionally display an error message to the user
            noProductsMessage.textContent = "Failed to load products. Please try again later.";
            noProductsMessage.classList.remove('hidden');
        }
    }

    // --- Product Display Logic ---
    function displayProducts(categoryId, modelId = null) {
        currentState = 'products'; // Ensure state is always set here
        currentSubCategory = categoryId;
        currentModel = modelId;

        if (!productsGrid || !productsSectionTitle || !noProductsMessage) {
            console.warn("Product display elements not found. Cannot display products.");
            return;
        }

        productsGrid.innerHTML = '';
        const filteredProducts = productsData.filter(product => {
            let matchesCategory = false;
            if (categoryId === 'anm-all' && currentMainCategory === 'accessories-merchandise') {
                matchesCategory = product.categoryId.startsWith('anm-');
            } else {
                matchesCategory = product.categoryId === categoryId;
            }

            const matchesModel = modelId ? product.modelId === modelId || product.modelId === 'all' : true;
            return matchesCategory && matchesModel;
        });

        if (filteredProducts.length > 0) {
            productsSectionTitle.textContent = getCategoryTitle(categoryId, modelId);
            productsSectionTitle.classList.remove('hidden');
            noProductsMessage.classList.add('hidden');

            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.dataset.productId = product.id;

                // Use the first image URL from the dynamically loaded data
                const imageSrc = product.images && product.images.length > 0 ? product.images[0] : 'static/images/placeholder.webp';

                productCard.innerHTML = `
                    <img src="${imageSrc}" alt="${product.name}" class="product-image">
                    <h3>${product.name}</h3>
                    <p class="product-part-code">${product.partCode}</p>
                `;
                productCard.addEventListener('click', () => {
                    displayProductDetail(product.id);
                });
                productsGrid.appendChild(productCard);
            });
        } else {
            productsSectionTitle.textContent = getCategoryTitle(categoryId, modelId);
            noProductsMessage.textContent = `No products available for "${getCategoryTitle(categoryId, modelId)}".`;
            productsSectionTitle.classList.remove('hidden');
            noProductsMessage.classList.remove('hidden');
        }
        // Removed backButton.onclick assignments from here
    }


    // --- Other Display Functions ---

    function renderSubCategories() {
        productsSectionTitle.textContent = "Browse Categories";
        productsGrid.innerHTML = '';
        productsSection.classList.remove('hidden');
        noProductsMessage.classList.add('hidden');

        const uniqueSubCategories = new Set();
        productsData.forEach(product => {
            if (currentMainCategory === 'spares' && product.categoryId.startsWith('spares-')) {
                    uniqueSubCategories.add(product.categoryId);
            } else if (currentMainCategory === 'charging-infrastructure' && product.categoryId.startsWith('ci-')) {
                uniqueSubCategories.add(product.categoryId);
            }
        });

        if (uniqueSubCategories.size > 0) {
            uniqueSubCategories.forEach(categoryId => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.innerHTML = `<h3>${getCategoryTitle(categoryId)}</h3>`;
                categoryCard.addEventListener('click', () => {
                    displayProducts(categoryId);
                    currentState = 'products';
                });
                productsGrid.appendChild(categoryCard);
            });
        } else {
            noProductsMessage.textContent = "No categories available.";
            noProductsMessage.classList.remove('hidden');
        }

        currentState = 'sub-categories'; // Ensure state is always set here
        // Removed backButton.onclick assignment from here
    }


    function renderModelSelection(categoryId) {
        productsSectionTitle.textContent = "Select Model";
        productsGrid.innerHTML = '';
        productsSection.classList.remove('hidden');
        noProductsMessage.classList.add('hidden');

        currentSubCategory = categoryId;

        const uniqueModels = new Set();
        productsData.forEach(product => {
            if (product.categoryId === categoryId && product.modelId) {
                uniqueModels.add(product.modelId);
            }
        });

        if (uniqueModels.size > 0) {
            const allModelsCard = document.createElement('div');
            allModelsCard.className = 'category-card';
            allModelsCard.innerHTML = `<h3>ALL MODELS</h3>`;
            allModelsCard.addEventListener('click', () => {
                displayProducts(categoryId, 'all');
                currentState = 'products';
            });
            productsGrid.appendChild(allModelsCard);

            uniqueModels.forEach(modelId => {
                const modelCard = document.createElement('div');
                modelCard.className = 'category-card';
                modelCard.innerHTML = `<h3>${getModelTitle(modelId)}</h3>`;
                modelCard.addEventListener('click', () => {
                    displayProducts(categoryId, modelId);
                    currentState = 'products';
                });
                productsGrid.appendChild(modelCard);
            });
        } else {
            noProductsMessage.textContent = "No models available for this category.";
            noProductsMessage.classList.remove('hidden');
        }

        currentState = 'models'; // Ensure state is always set here
        // Removed backButton.onclick assignment from here
    }


    function getCategoryTitle(categoryId, modelId = null) {
        const categoryMap = {
            'anm-all': 'All Accessories & Merchandise',
            'anm-accessories': 'Accessories',
            'anm-others': 'Merchandise',
            'anm-helmet': 'Helmets',
            'anm-storage': 'Storage',
            'spares-battery': 'Battery Spares',
            'spares-motor': 'Motor Spares',
            'ci-homecharger': 'Home Chargers',
            'ci-fastcharger': 'Fast Chargers',
        };

        let title = categoryMap[categoryId] || categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (modelId && modelId !== 'all') {
            title += ` for ${getModelTitle(modelId)}`;
        } else if (modelId === 'all' && currentMainCategory !== 'accessories-merchandise') {
            title += " (All Models)";
        }
        return title;
    }

    function getModelTitle(modelId) {
        const modelMap = {
            'model-450x': '450X',
            'model-450s': '450S',
            'model-apex': 'Apex',
            'all': 'All Models',
            '450': '450 Series',
            'rizta': 'Rizta'
        };
        return modelMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // --- Search Functionality (UNCHANGED) ---
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        performSearch(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 2) {
            performSearch(searchInput.value);
        } else {
            searchResultsContainer.classList.add('hidden');
        }
    });

    function performSearch(query) {
        const lowerCaseQuery = query.toLowerCase();
        const searchResults = productsData.filter(product => {
            const productPartCodeLower = product.partCode.toLowerCase();
            return product.name.toLowerCase().includes(lowerCaseQuery) ||
                   productPartCodeLower.includes(lowerCaseQuery) ||
                   product.description.toLowerCase().includes(lowerCaseQuery) ||
                   getCategoryTitle(product.categoryId).toLowerCase().includes(lowerCaseQuery) ||
                   getModelTitle(product.modelId).toLowerCase().includes(lowerCaseQuery) ||
                   (lowerCaseQuery.length === 2 && productPartCodeLower.endsWith(lowerCaseQuery)) ||
                   (lowerCaseQuery.length === 3 && productPartCodeLower.endsWith(lowerCaseQuery)) ||
                   (lowerCaseQuery.length === 4 && productPartCodeLower.endsWith(lowerCaseQuery));
        });


        searchResultsGrid.innerHTML = '';
        if (searchResults.length > 0) {
            searchResults.forEach(product => {
                const searchCard = document.createElement('div');
                searchCard.className = 'search-result-card';
                searchCard.dataset.productId = product.id;

                const imageSrc = product.images && product.images.length > 0 ? product.images[0] : 'static/images/placeholder.webp';

                searchCard.innerHTML = `
                    <img src="${imageSrc}" alt="${product.name}" class="search-product-image">
                    <h4>${product.name}</h4>
                    <p>${product.partCode}</p>
                `;
                searchCard.addEventListener('click', () => {
                    displayProductDetail(product.id);
                    searchResultsContainer.classList.add('hidden');
                    searchInput.value = '';
                });
                searchResultsGrid.appendChild(searchCard);
            });
            searchResultsContainer.classList.remove('hidden');
            noResultsMessage.classList.add('hidden');
        } else {
            searchResultsContainer.classList.remove('hidden');
            noResultsMessage.classList.remove('hidden');
        }
    }


    // --- Modal and Image Gallery ---
    function displayProductDetail(productId) {
        const product = productsData.find(p => p.id === productId);
        if (!product) {
            console.error("Product not found:", productId);
            return;
        }

        currentState = 'product-detail'; // Ensure state is always set here
        modalLoading.classList.add('hidden');
        productDetailContainer.classList.remove('hidden');

        productDetailName.textContent = product.name;
        productDetailPartCode.textContent = `Part Code: ${product.partCode}`;
        productDetailDescription.textContent = product.description || "No description available.";

        currentImages = product.images || [];
        currentImageIndex = 0;
        updateProductImage();
        renderThumbnails();

        mainModal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    closeModalButton.addEventListener('click', () => {
        mainModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        // This logic is now handled by the central backButton listener when state reverts
        if (currentMainCategory === 'accessories-merchandise') {
            displayProducts(currentSubCategory || 'anm-all');
        } else if (currentSubCategory) {
            displayProducts(currentSubCategory, currentModel);
        } else {
            renderSubCategories();
        }
        currentState = 'products'; // Revert state after closing modal
    });

    mainModal.addEventListener('click', (event) => {
        if (event.target === mainModal) {
            mainModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            // This logic is now handled by the central backButton listener when state reverts
            if (currentMainCategory === 'accessories-merchandise') {
                displayProducts(currentSubCategory || 'anm-all');
            } else if (currentSubCategory) {
                displayProducts(currentSubCategory, currentModel);
            } else {
                renderSubCategories();
            }
            currentState = 'products'; // Revert state after closing modal
        }
    });

    backToProductListBtn.addEventListener('click', () => {
        mainModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        // This logic is now handled by the central backButton listener when state reverts
        if (currentMainCategory === 'accessories-merchandise') {
            displayProducts(currentSubCategory || 'anm-all');
        } else if (currentSubCategory) {
            displayProducts(currentSubCategory, currentModel);
        } else {
            renderSubCategories();
        }
        currentState = 'products'; // Revert state after closing modal
    });


    function updateProductImage() {
        if (currentImages.length > 0) {
            mainProductImage.src = currentImages[currentImageIndex];
            mainProductImage.alt = `Product Image ${currentImageIndex + 1}`;
        } else {
            mainProductImage.src = 'static/images/placeholder.webp';
            mainProductImage.alt = 'No image available';
        }
    }

    function renderThumbnails() {
        thumbnailNav.innerHTML = '';
        currentImages.forEach((imageSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imageSrc;
            thumb.alt = `Thumbnail ${index + 1}`;
            thumb.classList.add('thumbnail');
            if (index === currentImageIndex) {
                thumb.classList.add('active');
            }
            thumb.addEventListener('click', () => {
                currentImageIndex = index;
                updateProductImage();
                updateThumbnailsActiveState();
            });
            thumbnailNav.appendChild(thumb);
        });
    }

    function updateThumbnailsActiveState() {
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            if (index === currentImageIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    prevImageBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateProductImage();
        updateThumbnailsActiveState();
    });

    nextImageBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateProductImage();
        updateThumbnailsActiveState();
    });

    // Image fullscreen functionality
    mainProductImage.addEventListener('click', () => {
        if (currentImages.length > 0) {
            fullscreenImage.src = currentImages[currentImageIndex];
            fullscreenOverlay.classList.add('show');
        }
    });

    closeFullscreen.addEventListener('click', () => {
        fullscreenOverlay.classList.remove('show');
    });

    fullscreenPrevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        fullscreenImage.src = currentImages[currentImageIndex];
    });

    fullscreenNextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        fullscreenImage.src = currentImages[currentImageIndex];
    });

    // --- Back Button Handling ---
    if (backButton) {
        backButton.addEventListener('click', () => {
            // If the modal is open (product detail view)
            if (mainModal.classList.contains('show')) {
                mainModal.classList.remove('show');
                document.body.classList.remove('modal-open');
                // After closing modal, revert to the previous product list state
                if (currentMainCategory === 'accessories-merchandise') {
                    // For ANM, after modal, return to the 'all' products or the specific category that was open
                    displayProducts(currentSubCategory || 'anm-all');
                } else if (currentSubCategory) {
                    // For Spares/CI, return to the specific product list (model filtered or just category filtered)
                    displayProducts(currentSubCategory, currentModel);
                } else {
                    // Fallback for cases where subCategory/model wasn't set (e.g., if directly opened modal from search on Spares/CI landing)
                    renderSubCategories();
                }
                currentState = 'products'; // Set state after returning from product detail
            }
            // If not in product detail (i.e., navigating back through the main page states)
            else {
                if (currentState === 'products') {
                    // If currently viewing a list of products
                    if (currentMainCategory === 'accessories-merchandise') {
                        // On ANM page, back from any product list (all or filtered) goes to index.html
                        window.location.href = indexUrl; // Use the dynamically fetched index URL
                    } else if (currentMainCategory === 'spares' || currentMainCategory === 'charging-infrastructure') {
                        // On Spares/CI, go back up one level in the hierarchy
                        if (currentModel && currentSubCategory) {
                            renderModelSelection(currentSubCategory); // Go back to model selection
                        } else if (currentSubCategory) {
                            renderSubCategories(); // Go back to sub-categories
                        } else {
                            // Fallback if somehow no sub-category or model was set before products (shouldn't happen with correct flow)
                            window.location.href = indexUrl; // Use the dynamically fetched index URL
                        }
                    } else {
                        // General fallback for unknown main category in products state
                        window.location.href = indexUrl; // Use the dynamically fetched index URL
                    }
                } else if (currentState === 'models') {
                    // If currently viewing model selection (Spares/CI), go back to sub-categories
                    renderSubCategories();
                } else if (currentState === 'sub-categories') {
                    // If currently viewing sub-categories (Spares/CI), go back to index.html (home page)
                    window.location.href = indexUrl; // Use the dynamically fetched index URL
                } else {
                    // Default fallback for any other unexpected state, or initial state
                    window.location.href = indexUrl; // Always go to index.html as a last resort
                }
            }
        });
    }


    // --- Initial Load Logic ---
    loadProductsData(); // Call this function to load data on page load


    // --- Filter Button Event Listener ---
    const filterButtons = document.querySelectorAll('.product-filters .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterCategory = button.dataset.filter;
            displayProducts(filterCategory);

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
});