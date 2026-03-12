// ===== KONFIGURASI =====
const PORTAL_NAME = "PORTAL WEB USAHA";
const SHEET_ID = "1f6CvFnZoUvqt8m_8tPQc4vSkakZL56i2P-4XQpzMqoY";

// ===== DOM ELEMENTS =====
document.getElementById("portalName").innerText = PORTAL_NAME;
document.getElementById("portalSubname").innerText = "webusaha.shop";

const PORTAL_URL = `https://opensheet.elk.sh/${SHEET_ID}/portal`;
const TAUTAN_URL = `https://opensheet.elk.sh/${SHEET_ID}/tautan`;
const grid = document.getElementById("portalGrid");
const searchInput = document.getElementById("searchInput");
const statsContainer = document.getElementById("statsContainer");

// ===== GLOBAL VARIABLES =====
let allData = [];

// ===== UTILITY FUNCTIONS =====
const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

const showLoading = () => {
    grid.innerHTML = `
        <div class="col-12">
            <div class="loading">
                <div class="loading-spinner"></div>
                <p class="text-muted">Memuat data...</p>
            </div>
        </div>
    `;
};

const showError = (message = "Gagal memuat data. Silakan refresh halaman.") => {
    grid.innerHTML = `
        <div class="col-12">
            <div class="no-results">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <p class="text-muted">${message}</p>
            </div>
        </div>
    `;
};

const showNoResults = (keyword = "") => {
    const message = keyword 
        ? `Tidak ditemukan hasil untuk "${keyword}"`
        : "Tidak ada data yang ditemukan.";
    
    grid.innerHTML = `
        <div class="col-12">
            <div class="no-results">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">${message}</p>
            </div>
        </div>
    `;
};

// ===== STATS RENDERING =====
const renderStats = (data) => {
    const regularItems = data.filter(item => item.category !== "Tautan");
    const tautanItem = data.find(item => item.category === "Tautan");
    
    const totalCategories = new Set(regularItems.map(item => item.title)).size;
    const totalItems = regularItems.reduce((acc, item) => acc + (item.url ? 1 : 0), 0);
    const totalLinks = tautanItem?.links?.length || 0;

    statsContainer.innerHTML = `
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="stat-value">${formatNumber(totalCategories)}</div>
                <div class="stat-label">Kategori</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-globe"></i>
                </div>
                <div class="stat-value">${formatNumber(totalItems)}</div>
                <div class="stat-label">Website</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-link"></i>
                </div>
                <div class="stat-value">${formatNumber(totalLinks)}</div>
                <div class="stat-label">Tautan</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-value">${formatNumber(data.length)}</div>
                <div class="stat-label">Total Entri</div>
            </div>
        </div>
    `;
};

// ===== MAIN DATA LOADING =====
async function loadData() {
    showLoading();
    
    try {
        const [portalRes, tautanRes] = await Promise.all([
            fetch(PORTAL_URL),
            fetch(TAUTAN_URL)
        ]);

        if (!portalRes.ok || !tautanRes.ok) {
            throw new Error('Network response was not ok');
        }

        const portalData = await portalRes.json();
        const tautanData = await tautanRes.json();

        const publishedPortal = portalData
            .filter(item => item.status?.toLowerCase() === "publish")
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

        const publishedTautan = tautanData
            .filter(item => item.status?.toLowerCase() === "publish" && item.group?.toLowerCase() === "utama")
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

        allData = [
            ...publishedPortal,
            {
                title: "TAUTAN TERKAIT",
                description: "Akses cepat ke situs populer & rujukan usaha",
                category: "Tautan",
                links: publishedTautan.map(t => ({
                    name: t.name || t.title || "Tautan",
                    url: t.url
                }))
            }
        ];

        renderStats(allData);
        renderGroupedItems(allData);

    } catch (err) {
        console.error('Error loading data:', err);
        showError("Gagal memuat data. Periksa koneksi internet Anda.");
    }
}

// ===== GROUPING AND RENDERING =====
function renderGroupedItems(data) {
    if (!data || data.length === 0) {
        showNoResults();
        return;
    }

    const regularItems = data.filter(item => item.category !== "Tautan");
    const tautanItem = data.find(item => item.category === "Tautan");

    // Group items by title and category
    const groupedMap = new Map();
    
    regularItems.forEach(item => {
        const key = `${item.title.toLowerCase()}|${item.category.toLowerCase()}`;
        
        if (!groupedMap.has(key)) {
            groupedMap.set(key, {
                displayTitle: item.title,
                displayCategory: item.category,
                description: item.description,
                items: []
            });
        }
        
        groupedMap.get(key).items.push({
            url: item.url,
            description: item.description
        });
    });

    const groupedItems = Array.from(groupedMap.values());
    
    // Build HTML with Bootstrap grid
    let html = '<div class="row g-4">';
    
    groupedItems.forEach(group => {
        html += '<div class="col-lg-4 col-md-6">';
        html += renderSingleCard(group);
        html += '</div>';
    });
    
    if (tautanItem && tautanItem.links && tautanItem.links.length > 0) {
        html += '<div class="col-12 mt-4">';
        html += renderTautanCard(tautanItem);
        html += '</div>';
    }
    
    html += '</div>';
    
    grid.innerHTML = html;
}

function renderSingleCard(group) {
    const itemCount = group.items.length;
    let itemsList = "";

    group.items.forEach((item, index) => {
        const itemDescription = item.description || group.description || "Deskripsi tidak tersedia";
        const itemNumber = itemCount > 1 ? ` #${index + 1}` : "";
        
        itemsList += `
            <li class="group-item list-unstyled">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="item-title">
                        <i class="fas fa-cube me-1"></i>
                        ${group.displayTitle}${itemNumber}
                    </span>
                    <span class="item-badge">${group.displayCategory}</span>
                </div>
                <p class="item-description">${itemDescription}</p>
                <a href="${item.url}" target="_blank" class="item-btn" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> 
                    Kunjungi Website
                </a>
            </li>
        `;
    });

    return `
        <div class="category-card">
            <div class="card-header">
                <h3 class="card-title">${group.displayTitle}</h3>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="category-badge">${group.displayCategory}</span>
                    <span class="text-white-50">
                        <i class="fas fa-list me-1"></i>${itemCount}
                    </span>
                </div>
            </div>
            <div class="card-body p-3">
                <ul class="list-unstyled mb-0">
                    ${itemsList}
                </ul>
            </div>
        </div>
    `;
}

function renderTautanCard(item) {
    const links = item.links || [];
    
    return `
        <div class="tautan-card">
            <div class="tautan-header">
                <h3 class="h4 mb-2">
                    <i class="fas fa-link me-2"></i>
                    ${item.title}
                </h3>
                <p class="mb-0 opacity-75">${item.description || 'Kumpulan tautan bermanfaat'}</p>
            </div>
            <div class="tautan-body">
                ${links.map(link => `
                    <a href="${link.url}" target="_blank" class="tautan-link" rel="noopener noreferrer">
                        <i class="fas fa-chevron-right"></i>
                        <span>${link.name}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

// ===== SEARCH FUNCTIONALITY =====
searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    
    if (!keyword) {
        renderGroupedItems(allData);
        return;
    }
    
    const filtered = allData.filter(item => {
        if (item.category === "Tautan") {
            const titleMatch = item.title?.toLowerCase().includes(keyword) || false;
            const descMatch = item.description?.toLowerCase().includes(keyword) || false;
            const linkMatch = item.links?.some(link => 
                link.name?.toLowerCase().includes(keyword) || false
            ) || false;
            return titleMatch || descMatch || linkMatch;
        } else {
            const titleMatch = item.title?.toLowerCase().includes(keyword) || false;
            const descMatch = item.description?.toLowerCase().includes(keyword) || false;
            const categoryMatch = item.category?.toLowerCase().includes(keyword) || false;
            return titleMatch || descMatch || categoryMatch;
        }
    });

    if (filtered.length === 0) {
        showNoResults(keyword);
    } else {
        renderGroupedItems(filtered);
    }
});

// ===== CLICK HEADER TO SCROLL TOP =====
document.addEventListener("DOMContentLoaded", function() {
    const portalElements = document.querySelectorAll("#portalName");
    portalElements.forEach(el => {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    });
});

// ===== INITIAL LOAD =====
loadData();