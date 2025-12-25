// MIS Dashboard Redesign - Interactive Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }
    
    sidebarOverlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
    
    // User Dropdown
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userProfileBtn && userDropdown) {
        userProfileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', function() {
            userDropdown.style.display = 'none';
        });
        
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Update Page Header Based on Section
    const navItems = document.querySelectorAll('.nav-item-new');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            updatePageHeader(section);
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });
    
    // Update page header on initial load
    updatePageHeader('dashboard');
});

function updatePageHeader(sectionName) {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const pageActions = document.getElementById('pageActions');
    
    if (!pageTitle || !pageSubtitle) return;
    
    const headers = {
        dashboard: {
            title: '<i class="bi bi-speedometer2"></i> Dashboard',
            subtitle: 'Welcome back! Here\'s your overview today.',
            actions: ''
        },
        students: {
            title: '<i class="bi bi-people-fill"></i> Students',
            subtitle: 'Manage all student records and information',
            actions: `
                <button class="btn-modern btn-modern-primary" onclick="showAddStudentModal()">
                    <i class="bi bi-plus-circle"></i> Add Student
                </button>
            `
        },
        attendance: {
            title: '<i class="bi bi-calendar-check-fill"></i> Attendance',
            subtitle: 'Update and manage student attendance records',
            actions: ''
        },
        leaves: {
            title: '<i class="bi bi-calendar-x-fill"></i> Leave Management',
            subtitle: 'Review and approve leave applications at Level 2',
            actions: ''
        },
        hostel: {
            title: '<i class="bi bi-house-door-fill"></i> Hostel',
            subtitle: 'View hostel student information and records',
            actions: ''
        },
        canteen: {
            title: '<i class="bi bi-cup-hot-fill"></i> Canteen',
            subtitle: 'View canteen stock and food selection information',
            actions: ''
        }
    };
    
    const header = headers[sectionName] || headers.dashboard;
    
    if (pageTitle) {
        pageTitle.innerHTML = header.title;
    }
    
    if (pageSubtitle) {
        pageSubtitle.textContent = header.subtitle;
    }
    
    if (pageActions) {
        pageActions.innerHTML = header.actions;
    }
}

// Override showSection to update header
const originalShowSection = window.showSection;
if (originalShowSection) {
    window.showSection = function(sectionName) {
        originalShowSection(sectionName);
        updatePageHeader(sectionName);
        
        // Update active nav item
        document.querySelectorAll('.nav-item-new').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });
    };
}

// Update user name in top navbar
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        const userNameTop = document.getElementById('userNameTop');
        if (userNameTop) {
            userNameTop.textContent = currentUser.name || 'MIS';
        }
    }
});


