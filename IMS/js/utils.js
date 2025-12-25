// Utility Functions for High-End CMS
// Toast Notification System
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi ${icon}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
            <button class="toast-close" aria-label="Close">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        const autoRemove = setTimeout(() => {
            this.remove(toast);
        }, duration);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.remove(toast);
        });
        
        return toast;
    }
    
    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    static remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
    
    static getIcon(type) {
        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        return icons[type] || icons.info;
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    static success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Loading Spinner
class LoadingSpinner {
    static show(target = null) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        if (target) {
            target.style.position = 'relative';
            target.appendChild(spinner);
        } else {
            spinner.classList.add('global-spinner');
            document.body.appendChild(spinner);
        }
        
        return spinner;
    }
    
    static hide(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    }
}

// Confirmation Dialog
class ConfirmDialog {
    static async show(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal-overlay';
            modal.innerHTML = `
                <div class="confirm-modal">
                    <div class="confirm-header">
                        <h5>${this.escapeHtml(title)}</h5>
                    </div>
                    <div class="confirm-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-secondary confirm-cancel">Cancel</button>
                        <button class="btn btn-primary confirm-ok">OK</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const handleConfirm = (result) => {
                modal.remove();
                resolve(result);
            };
            
            modal.querySelector('.confirm-ok').addEventListener('click', () => handleConfirm(true));
            modal.querySelector('.confirm-cancel').addEventListener('click', () => handleConfirm(false));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleConfirm(false);
            });
        });
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Form Validation
class FormValidator {
    static validate(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    static validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        let errorMessage = '';
        
        // Remove previous error
        this.removeError(field);
        
        // Required validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required`;
        }
        
        // Type-specific validation
        if (value && type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        if (value && type === 'tel') {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid 10-digit phone number';
            }
        }
        
        if (value && field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                isValid = false;
                errorMessage = `Minimum ${minLength} characters required`;
            }
        }
        
        if (!isValid) {
            this.showError(field, errorMessage);
        }
        
        return isValid;
    }
    
    static showError(field, message) {
        field.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
    
    static removeError(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    static getFieldLabel(field) {
        const label = field.parentNode.querySelector('label');
        return label ? label.textContent : field.name || 'This field';
    }
}

// Data Export
class DataExporter {
    static exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) {
            Toast.error('No data to export');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        Toast.success('Data exported successfully');
    }
    
    static exportToJSON(data, filename = 'export.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        Toast.success('Data exported successfully');
    }
}

// Search and Filter
class SearchFilter {
    static filterTable(tableId, searchTerm, columns = null) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        const term = searchTerm.toLowerCase().trim();
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let match = false;
            
            if (columns) {
                columns.forEach(colIndex => {
                    if (cells[colIndex] && cells[colIndex].textContent.toLowerCase().includes(term)) {
                        match = true;
                    }
                });
            } else {
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(term)) {
                        match = true;
                    }
                });
            }
            
            row.style.display = match ? '' : 'none';
        });
    }
    
    static highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Debounce function
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

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.success('Copied to clipboard');
    } catch (err) {
        Toast.error('Failed to copy');
    }
}

// Export for use in other files
window.Toast = Toast;
window.LoadingSpinner = LoadingSpinner;
window.ConfirmDialog = ConfirmDialog;
window.FormValidator = FormValidator;
window.DataExporter = DataExporter;
window.SearchFilter = SearchFilter;


