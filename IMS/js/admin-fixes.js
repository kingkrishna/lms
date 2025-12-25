// Admin Dashboard Functionality Fixes - Ensure all features work

document.addEventListener('DOMContentLoaded', function() {
    // Wait for all scripts to load
    setTimeout(() => {
        initializeAllFeatures();
    }, 100);
});

function initializeAllFeatures() {
    // 1. Ensure search functionality works
    setupSearchFunctionality();
    
    // 2. Ensure export buttons work
    setupExportButtons();
    
    // 3. Ensure all modals work
    setupModals();
    
    // 4. Ensure table actions work
    setupTableActions();
    
    // 5. Ensure navigation works
    ensureNavigation();
    
    // 6. Ensure quick actions work
    setupQuickActions();
}

// Search Functionality
function setupSearchFunctionality() {
    // Student search
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const table = document.getElementById('studentsTable');
            if (table) {
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    let visibleCount = 0;
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            row.style.display = '';
                            visibleCount++;
                        } else {
                            row.style.display = 'none';
                        }
                    });
                    
                    // Show message if no results
                    if (visibleCount === 0 && searchTerm) {
                        if (!tbody.querySelector('.no-results-message')) {
                            const msg = document.createElement('tr');
                            msg.className = 'no-results-message';
                            msg.innerHTML = `<td colspan="7" class="text-center text-muted py-4">No students found matching "${searchTerm}"</td>`;
                            tbody.appendChild(msg);
                        }
                    } else {
                        const msg = tbody.querySelector('.no-results-message');
                        if (msg) msg.remove();
                    }
                }
            }
        });
    }
    
    // Attendance search is handled in admin.js
}

// Export Functionality
function setupExportButtons() {
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-type');
            const format = this.getAttribute('data-format') || 'csv';
            
            if (type === 'students') {
                exportStudents(format);
            } else {
                if (typeof Toast !== 'undefined') {
                    Toast.info('Export functionality for ' + type + ' coming soon');
                }
            }
        });
    });
}

function exportStudents(format) {
    const students = typeof getStudents === 'function' ? getStudents() : [];
    if (students.length === 0) {
        if (typeof Toast !== 'undefined') {
            Toast.warning('No students to export');
        }
        return;
    }
    
    if (format === 'csv') {
        // Create CSV content
        const headers = ['Student ID', 'Name', 'Mobile', 'Parent Number', 'Batch', 'Hostel Status', 'Location'];
        const rows = students.map(s => [
            s.id || '',
            s.name || '',
            s.mobile || '',
            s.parentNumber || '',
            s.currentBatch || '',
            s.hostelStatus || '',
            s.location || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof Toast !== 'undefined') {
            Toast.success('Students exported successfully');
        }
    }
}

// Modal Setup
function setupModals() {
    // Ensure all modals can be closed
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        });
    });
}

// Table Actions
function setupTableActions() {
    // Use event delegation for dynamically added buttons
    document.addEventListener('click', function(e) {
        // View Student
        if (e.target.closest('.btn') && e.target.closest('.btn').onclick && 
            e.target.closest('.btn').onclick.toString().includes('viewStudent')) {
            const btn = e.target.closest('.btn');
            const onclick = btn.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/viewStudent\('([^']+)'\)/);
                if (match && typeof viewStudent === 'function') {
                    viewStudent(match[1]);
                }
            }
        }
        
        // Edit Student
        if (e.target.closest('.btn') && e.target.closest('.btn').onclick && 
            e.target.closest('.btn').onclick.toString().includes('editStudent')) {
            const btn = e.target.closest('.btn');
            const onclick = btn.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/editStudent\('([^']+)'\)/);
                if (match && typeof editStudent === 'function') {
                    editStudent(match[1]);
                }
            }
        }
        
        // Delete Student
        if (e.target.closest('.btn') && e.target.closest('.btn').onclick && 
            e.target.closest('.btn').onclick.toString().includes('deleteStudentConfirm')) {
            const btn = e.target.closest('.btn');
            const onclick = btn.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/deleteStudentConfirm\('([^']+)'\)/);
                if (match && typeof deleteStudentConfirm === 'function') {
                    deleteStudentConfirm(match[1]);
                }
            }
        }
        
        // Edit Class
        if (e.target.closest('.btn') && e.target.closest('.btn').onclick && 
            e.target.closest('.btn').onclick.toString().includes('editClass')) {
            const btn = e.target.closest('.btn');
            const onclick = btn.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/editClass\('([^']+)'\)/);
                if (match && typeof editClass === 'function') {
                    editClass(match[1]);
                }
            }
        }
        
        // Delete Class
        if (e.target.closest('.btn') && e.target.closest('.btn').onclick && 
            e.target.closest('.btn').onclick.toString().includes('deleteClass')) {
            const btn = e.target.closest('.btn');
            const onclick = btn.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/deleteClass\('([^']+)'\)/);
                if (match && typeof deleteClass === 'function') {
                    deleteClass(match[1]);
                }
            }
        }
    });
}

// Navigation
function ensureNavigation() {
    // Make sure all nav items work
    document.querySelectorAll('[data-section]').forEach(item => {
        if (!item.hasAttribute('data-listener-attached')) {
            item.setAttribute('data-listener-attached', 'true');
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                if (section && typeof showSection === 'function') {
                    showSection(section);
                }
            });
        }
    });
}

// Quick Actions
function setupQuickActions() {
    // Quick action buttons should work via onclick, but ensure they're accessible
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // onclick handlers should work, but ensure click is not prevented
            if (this.onclick) {
                this.onclick(e);
            }
        });
    });
}

// Re-initialize when sections are shown
const originalShowSection = window.showSection;
if (originalShowSection) {
    window.showSection = function(sectionName) {
        originalShowSection(sectionName);
        
        // Re-setup features for the newly shown section
        setTimeout(() => {
            setupSearchFunctionality();
            setupTableActions();
        }, 100);
    };
}

// Make functions globally available
window.setupSearchFunctionality = setupSearchFunctionality;
window.setupExportButtons = setupExportButtons;
window.exportStudents = exportStudents;


