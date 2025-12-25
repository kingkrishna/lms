// Dashboard Enhancements - Common functionality for all dashboards

// Dark Mode Toggle
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Create toggle button if it doesn't exist
    if (!themeToggle) {
        // Check if navbar toggle exists
        const navbarToggle = document.querySelector('.theme-toggle-navbar');
        if (navbarToggle) {
            navbarToggle.id = 'themeToggle';
            navbarToggle.addEventListener('click', toggleTheme);
        } else {
            // Fallback: create floating toggle button
            const toggle = document.createElement('button');
            toggle.id = 'themeToggle';
            toggle.className = 'theme-toggle';
            toggle.setAttribute('aria-label', 'Toggle dark mode');
            toggle.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
            document.body.appendChild(toggle);
            toggle.addEventListener('click', toggleTheme);
        }
    } else {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
    
    if (typeof Toast !== 'undefined') {
        Toast.info(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 2000);
    }
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Update icon based on current theme
    if (themeToggle.classList.contains('theme-toggle-navbar')) {
        themeToggle.innerHTML = isDark 
            ? '<i class="bi bi-sun-fill"></i>' 
            : '<i class="bi bi-moon-stars-fill"></i>';
    } else {
        themeToggle.innerHTML = isDark 
            ? '<i class="bi bi-sun-fill"></i>' 
            : '<i class="bi bi-moon-stars-fill"></i>';
    }
}

// Search Functionality
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        const tableId = input.getAttribute('data-table');
        if (!tableId) return;
        
        // Debounce search
        const debouncedSearch = debounce((term) => {
            SearchFilter.filterTable(tableId, term);
        }, 300);
        
        input.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    });
}

// Export Functionality
function initExport() {
    const exportButtons = document.querySelectorAll('.export-btn');
    
    exportButtons.forEach(btn => {
        btn.addEventListener('click', async function() {
            const format = this.getAttribute('data-format') || 'csv';
            const dataType = this.getAttribute('data-type');
            
            if (!dataType) return;
            
            let data = [];
            const table = document.querySelector(`#${dataType}TableBody`);
            
            if (table) {
                const rows = table.querySelectorAll('tr:not([style*="display: none"])');
                const headers = [];
                
                // Get headers from table
                const headerRow = document.querySelector(`#${dataType.replace('TableBody', '')} thead tr`);
                if (headerRow) {
                    headerRow.querySelectorAll('th').forEach(th => {
                        headers.push(th.textContent.trim());
                    });
                }
                
                // Get data from rows
                rows.forEach(row => {
                    const rowData = {};
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, index) => {
                        if (headers[index]) {
                            rowData[headers[index]] = cell.textContent.trim();
                        }
                    });
                    if (Object.keys(rowData).length > 0) {
                        data.push(rowData);
                    }
                });
            }
            
            if (data.length === 0) {
                Toast.warning('No data to export');
                return;
            }
            
            const filename = `${dataType}_${new Date().toISOString().split('T')[0]}.${format}`;
            
            if (format === 'csv') {
                DataExporter.exportToCSV(data, filename);
            } else if (format === 'json') {
                DataExporter.exportToJSON(data, filename);
            }
        });
    });
}

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + D for dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            });
        }
    });
}

// Print Functionality
function initPrint() {
    const printButtons = document.querySelectorAll('.print-btn');
    
    printButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.print();
        });
    });
}

// Copy to Clipboard
function initCopyButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.copy-btn')) {
            const btn = e.target.closest('.copy-btn');
            const text = btn.getAttribute('data-copy') || btn.textContent.trim();
            copyToClipboard(text);
        }
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Wait for utils to load
    if (typeof Toast !== 'undefined') {
        initDarkMode();
        initSearch();
        initExport();
        initKeyboardShortcuts();
        initPrint();
        initCopyButtons();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (typeof Toast !== 'undefined') {
                initDarkMode();
                initSearch();
                initExport();
                initKeyboardShortcuts();
                initPrint();
                initCopyButtons();
            }
        }, 100);
    }
});

// Helper function for debounce (if not in utils)
if (typeof debounce === 'undefined') {
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Helper function for copy to clipboard (if not in utils)
if (typeof copyToClipboard === 'undefined') {
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            if (typeof Toast !== 'undefined') {
                Toast.success('Copied to clipboard');
            }
        } catch (err) {
            if (typeof Toast !== 'undefined') {
                Toast.error('Failed to copy');
            }
        }
    }
}


