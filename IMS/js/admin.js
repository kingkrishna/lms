// Admin Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user name (both old and new structure)
    const userNameElements = document.querySelectorAll('#userName, #userNameTop');
    userNameElements.forEach(el => {
        if (el) el.textContent = currentUser.name;
    });
    
    // Navigation (both old and new structure)
    document.querySelectorAll('.nav-link, .nav-item-new').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
            
            // Update active state
            document.querySelectorAll('.nav-link, .nav-item-new').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load dashboard
    loadDashboard();
    loadStudents();
    loadClasses();
    loadCanteen();
    loadHostel();
    // Don't load leaves/attendance on initial page load - they're hidden, load when section is shown
    
    // Setup tab change listener for leaves
    const leaveTabs = document.querySelectorAll('#leaveTabs button[data-bs-toggle="tab"]');
    leaveTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            if (document.getElementById('leaves-section') && !document.getElementById('leaves-section').classList.contains('d-none')) {
                loadLeaves();
            }
        });
    });
    
    // Setup attendance search
    const attendanceSearch = document.getElementById('attendanceSearch');
    if (attendanceSearch) {
        attendanceSearch.addEventListener('input', function() {
            if (document.getElementById('attendance-section') && !document.getElementById('attendance-section').classList.contains('d-none')) {
                loadAttendance();
            }
        });
    }
    
    // Setup student search
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const table = document.getElementById('studentsTable');
            if (table) {
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    });
                }
            }
        });
    }
    
    // Setup student search
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const table = document.getElementById('studentsTable');
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }
        });
    }
    
    // Setup export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const format = this.getAttribute('data-format') || 'csv';
            if (typeof exportData !== 'undefined') {
                exportData(type, format);
            } else {
                if (typeof Toast !== 'undefined') {
                    Toast.info('Export functionality will be available soon');
                }
            }
        });
    });
    
    // Initialize dashboard enhancements
    if (typeof initDarkMode === 'function') {
        initDarkMode();
    }
    
    if (typeof initSearch === 'function') {
        initSearch();
    }
});

function showSection(sectionName) {
    // Hide all content sections first
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionName + '-section');
    if (!targetSection) {
        console.error('Section not found:', sectionName + '-section');
        return;
    }
    
    targetSection.classList.remove('d-none');
    
    // Update active nav item (both old and new navigation)
    document.querySelectorAll('.nav-link, .nav-item-new').forEach(item => {
        item.classList.remove('active');
        const dataSection = item.getAttribute('data-section');
        if (dataSection === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Update page header if function exists
    if (typeof updatePageHeader === 'function') {
        updatePageHeader(sectionName);
    }
    
    // Load section-specific data and dashboard
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        switch(sectionName) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
                break;
            case 'students':
                if (typeof loadStudentsDashboard === 'function') {
                    loadStudentsDashboard();
                }
                if (typeof loadStudents === 'function') {
                    loadStudents();
                }
                break;
            case 'trainers':
                if (typeof loadTrainersDashboard === 'function') {
                    loadTrainersDashboard();
                }
                if (typeof loadTrainers === 'function') {
                    loadTrainers();
                }
                break;
            case 'users':
                if (typeof loadUsers === 'function') {
                    loadUsers();
                }
                break;
            case 'attendance':
                if (typeof loadAttendanceDashboard === 'function') {
                    loadAttendanceDashboard();
                }
                if (typeof loadAttendance === 'function') {
                    loadAttendance();
                }
                break;
            case 'leaves':
                if (typeof loadLeavesDashboard === 'function') {
                    loadLeavesDashboard();
                }
                if (typeof loadLeaves === 'function') {
                    loadLeaves();
                }
                break;
            case 'canteen':
                if (typeof loadCanteenDashboard === 'function') {
                    loadCanteenDashboard();
                }
                if (typeof loadCanteen === 'function') {
                    loadCanteen();
                }
                break;
            case 'hostel':
                if (typeof loadHostelDashboard === 'function') {
                    loadHostelDashboard();
                }
                if (typeof loadHostel === 'function') {
                    loadHostel();
                }
                break;
            case 'reports':
                // Reports are generated on demand
                break;
            case 'analytics':
                if (typeof loadAnalytics === 'function') {
                    loadAnalytics();
                }
                break;
            case 'audit':
                if (typeof loadAuditLogs === 'function') {
                    loadAuditLogs();
                }
                break;
            case 'exports':
                // Exports are handled by buttons
                break;
            case 'connections':
                // Load connection status
                loadSystemConnections();
                break;
        }
    }, 50);
}

function loadDashboard() {
    const students = getStudents();
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    
    // System-wide KPIs
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalTrainersEl = document.getElementById('totalTrainers');
    const attendanceRateEl = document.getElementById('attendanceRate');
    const hostelOccupancyEl = document.getElementById('hostelOccupancy');
    const pendingLeavesEl = document.getElementById('pendingLeaves');
    const foodSelectionsEl = document.getElementById('foodSelections');
    
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
    if (totalTrainersEl) totalTrainersEl.textContent = trainers.length;
    
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes').length;
    if (hostelOccupancyEl) hostelOccupancyEl.textContent = hostelStudents;
    
    const completedAttendance = students.filter(s => 
        s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived
    ).length;
    const attendanceRate = students.length > 0 ? Math.round((completedAttendance / students.length) * 100) : 0;
    if (attendanceRateEl) attendanceRateEl.textContent = attendanceRate + '%';
    
    // Leave Status Cards
    const allStudentLeaves = getStudentLeaves();
    const allTrainerLeaves = getTrainerLeaves();
    const allLeaves = [...allStudentLeaves, ...allTrainerLeaves];
    
    const pendingLeaves = allLeaves.filter(l => 
        l.approvalStatus !== 'Approved' && 
        l.approvalStatus !== 'Final Approved' && 
        l.approvalStatus !== 'Rejected'
    );
    const approvedLeaves = allLeaves.filter(l => 
        l.approvalLevel === 2 || l.approvalLevel === 3 || 
        l.approvalStatus === 'Approved' || 
        l.approvalStatus === 'Final Approved'
    );
    const rejectedLeaves = allLeaves.filter(l => l.approvalStatus === 'Rejected');
    
    const pendingLeavesCountEl = document.getElementById('pendingLeavesCount');
    const approvedLeavesCountEl = document.getElementById('approvedLeavesCount');
    const rejectedLeavesCountEl = document.getElementById('rejectedLeavesCount');
    
    if (pendingLeavesCountEl) pendingLeavesCountEl.textContent = pendingLeaves.length;
    if (approvedLeavesCountEl) approvedLeavesCountEl.textContent = approvedLeaves.length;
    if (rejectedLeavesCountEl) rejectedLeavesCountEl.textContent = rejectedLeaves.length;
    if (pendingLeavesEl) pendingLeavesEl.textContent = pendingLeaves.length;
    
    // Food selections
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    if (foodSelectionsEl) foodSelectionsEl.textContent = menu.morning.selectedCount + menu.night.selectedCount;
    
    // Update badges
    const studentsBadge = document.getElementById('studentsBadge');
    const trainersBadge = document.getElementById('trainersBadge');
    const leavesBadge = document.getElementById('leavesBadge');
    
    if (studentsBadge) studentsBadge.textContent = students.length;
    if (trainersBadge) trainersBadge.textContent = trainers.length;
    if (leavesBadge) leavesBadge.textContent = pendingLeaves.length;
    
    // System Activity
    const systemActivityEl = document.getElementById('systemActivity');
    if (systemActivityEl) {
        systemActivityEl.innerHTML = `
            <div class="activity-item">
                <i class="bi bi-circle-fill text-success"></i> System operational
            </div>
            <div class="activity-item">
                <i class="bi bi-people"></i> ${students.length} students registered
            </div>
            <div class="activity-item">
                <i class="bi bi-person-badge"></i> ${trainers.length} trainers active
            </div>
            <div class="activity-item">
                <i class="bi bi-calendar-check"></i> ${attendanceRate}% attendance rate
            </div>
        `;
    }
    
    // Recent Notifications
    const recentNotificationsEl = document.getElementById('recentNotifications');
    if (recentNotificationsEl) {
        if (pendingLeaves.length > 0) {
            recentNotificationsEl.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> ${pendingLeaves.length} leave requests pending approval
                </div>
            `;
        } else {
            recentNotificationsEl.innerHTML = '<p class="text-muted">No recent notifications</p>';
        }
    }
    
    // Attendance Summary (if element exists)
    const attendanceSummaryEl = document.getElementById('attendanceSummary');
    if (attendanceSummaryEl) {
        const totalStudents = students.length;
        const onlineCompleted = students.filter(s => s.attendance && s.attendance.onlineClassCompleted).length;
        const offlineReceived = students.filter(s => s.attendance && s.attendance.offlineRecordsReceived).length;
        const bothCompleted = completedAttendance;
        
        const attendanceSummaryHtml = `
        <div class="row">
            <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                    <div class="h4 text-primary">${onlineCompleted}</div>
                    <div class="text-muted">Online Class Completed</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                    <div class="h4 text-success">${offlineReceived}</div>
                    <div class="text-muted">Offline Records Received</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                    <div class="h4 text-info">${bothCompleted}</div>
                    <div class="text-muted">Fully Completed</div>
                </div>
            </div>
        </div>
        <div class="mt-3">
            <div class="progress" style="height: 25px;">
                <div class="progress-bar" role="progressbar" style="width: ${attendanceRate}%">${attendanceRate}%</div>
            </div>
        </div>
    `;
    const attendanceSummaryEl = document.getElementById('attendanceSummary');
    if (attendanceSummaryEl) {
        attendanceSummaryEl.innerHTML = attendanceSummaryHtml;
    }
    
    // Canteen Consumption Summary
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const canteenSummaryHtml = `
        <div class="row">
            <div class="col-md-6">
                <div class="p-3 bg-light rounded mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><i class="bi bi-sunrise text-warning"></i> <strong>Morning Selections:</strong></div>
                        <span class="badge bg-warning text-dark fs-6">${menu.morning.selectedCount}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><i class="bi bi-moon text-info"></i> <strong>Night Selections:</strong></div>
                        <span class="badge bg-info text-white fs-6">${menu.night.selectedCount}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-info mb-0">
            <small><i class="bi bi-info-circle"></i> Total selections include both students and trainers for food preparation planning.</small>
        </div>
    `;
    const canteenSummaryEl = document.getElementById('canteenSummary');
    if (canteenSummaryEl) {
        canteenSummaryEl.innerHTML = canteenSummaryHtml;
    }
    
    // Load food menu
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    
    let menuHtml = '<div class="row">';
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card morning">';
    menuHtml += '<h6><i class="bi bi-sunrise"></i> Morning Menu (Tiffin)</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.morning.items.length > 0) {
        menu.morning.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '<div class="mt-3 p-3 bg-light rounded border">';
    menuHtml += '<div class="d-flex align-items-center justify-content-between">';
    menuHtml += '<div><i class="bi bi-people-fill text-primary"></i> <strong>Tiffin Selection Count:</strong></div>';
    menuHtml += '<span class="badge bg-primary fs-6 px-3 py-2">' + menu.morning.selectedCount + ' Selections</span>';
    menuHtml += '</div></div>';
    menuHtml += '</div></div></div>';
    
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card night">';
    menuHtml += '<h6><i class="bi bi-moon"></i> Night Menu (Dinner)</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.night.items.length > 0) {
        menu.night.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '<div class="mt-3 p-3 bg-light rounded border">';
    menuHtml += '<div class="d-flex align-items-center justify-content-between">';
    menuHtml += '<div><i class="bi bi-people-fill text-primary"></i> <strong>Dinner Selection Count:</strong></div>';
    menuHtml += '<span class="badge bg-primary fs-6 px-3 py-2">' + menu.night.selectedCount + ' Selections</span>';
    menuHtml += '</div></div>';
    menuHtml += '</div></div></div>';
    menuHtml += '</div>';
    
    // Display food menu
    const foodMenuDisplayEl = document.getElementById('foodMenuDisplay');
    if (foodMenuDisplayEl) {
        foodMenuDisplayEl.innerHTML = menuHtml;
    } else {
        console.warn('Food menu display element not found');
    }
}

function loadStudents() {
    const students = getStudents();
    const tbody = document.getElementById('studentsTableBody');
    
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.mobile}</td>
            <td>
                ${student.parentNumber ? `<a href="tel:${student.parentNumber}" class="btn btn-sm btn-success"><i class="bi bi-telephone"></i> ${student.parentNumber}</a>` : 'N/A'}
            </td>
            <td>${student.currentBatch}</td>
            <td><span class="badge ${student.hostelStatus === 'Yes' ? 'bg-success' : 'bg-secondary'}">${student.hostelStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudent('${student.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="editStudent('${student.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudentConfirm('${student.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddStudentModal() {
    const form = document.getElementById('addStudentForm');
    if (form) {
        form.reset();
        // Clear any validation errors
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
    }
    
    // Clear edit mode
    const studentIdField = document.getElementById('studentId');
    if (studentIdField) {
        studentIdField.disabled = false;
    }
    
    const modalElement = document.getElementById('addStudentModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function saveStudent() {
    // Validate form
    const form = document.getElementById('addStudentForm');
    if (form && typeof FormValidator !== 'undefined' && !FormValidator.validate(form)) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please fill all required fields correctly');
        }
        return;
    }
    
    // Get form values with null checks
    const studentIdEl = document.getElementById('studentId');
    const studentNameEl = document.getElementById('studentName');
    const studentMobileEl = document.getElementById('studentMobile');
    const parentNumberEl = document.getElementById('parentNumber');
    const batchNumberEl = document.getElementById('batchNumber');
    const currentBatchEl = document.getElementById('currentBatch');
    const hostelStatusEl = document.getElementById('hostelStatus');
    const locationEl = document.getElementById('location');
    
    if (!studentIdEl || !studentNameEl || !studentMobileEl || !batchNumberEl || !currentBatchEl || !hostelStatusEl) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please fill all required fields');
        } else {
            alert('Please fill all required fields');
        }
        return;
    }
    
    const student = {
        id: studentIdEl.value.trim(),
        name: studentNameEl.value.trim(),
        mobile: studentMobileEl.value.trim(),
        parentNumber: parentNumberEl ? parentNumberEl.value.trim() : '',
        batchNumber: batchNumberEl.value.trim(),
        currentBatch: currentBatchEl.value.trim(),
        currentBatchId: batchNumberEl.value.trim(),
        hostelStatus: hostelStatusEl.value,
        location: locationEl ? locationEl.value.trim() : '',
        attendance: {
            onlineClassCompleted: false,
            offlineRecordsReceived: false
        },
        leave: {
            approvalStatus: 'Pending',
            leaveLetterReceived: false
        },
        hostel: {
            inTime: '',
            outTime: '',
            movementHistory: []
        },
        foodSelection: {}
    };
    
    saveStudentData(student);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
    if (modal) {
        modal.hide();
    }
    
    // Reset form
    if (form) {
        form.reset();
    }
    
    loadStudents();
    loadDashboard();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Student saved successfully');
    }
}

function saveStudentData(student) {
    const students = getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
        students[index] = { ...students[index], ...student };
    } else {
        students.push(student);
    }
    localStorage.setItem('students', JSON.stringify(students));
}

function loadClasses() {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const tbody = document.getElementById('classesTableBody');
    
    if (!tbody) return;
    
    if (allClasses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No classes found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allClasses.map(cls => `
        <tr>
            <td>${cls.name}</td>
            <td>${cls.schedule}</td>
            <td>${cls.batch}</td>
            <td>${cls.trainerId || 'Not Assigned'}</td>
            <td><span class="badge bg-success">Active</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editClass('${cls.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteClass('${cls.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddClassModal() {
    const form = document.getElementById('addClassForm');
    if (form) {
        form.reset();
        const classIdField = document.getElementById('classId');
        if (classIdField) {
            classIdField.value = '';
        }
        // Clear any validation errors
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
    }
    
    const modalElement = document.getElementById('addClassModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function saveClass() {
    // Validate form
    const form = document.getElementById('addClassForm');
    if (form && typeof FormValidator !== 'undefined' && !FormValidator.validate(form)) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please fill all required fields correctly');
        }
        return;
    }
    
    const classIdEl = document.getElementById('classId');
    const classNameEl = document.getElementById('className');
    const scheduleEl = document.getElementById('classSchedule');
    const batchEl = document.getElementById('classBatch');
    const trainerIdEl = document.getElementById('classTrainerId');
    
    if (!classNameEl || !scheduleEl || !batchEl) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please fill all required fields');
        } else {
            alert('Please fill all required fields');
        }
        return;
    }
    
    const classId = classIdEl ? classIdEl.value : '';
    const className = classNameEl.value.trim();
    const schedule = scheduleEl.value.trim();
    const batch = batchEl.value.trim();
    const trainerId = trainerIdEl ? trainerIdEl.value.trim() : '';
    
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    
    if (classId) {
        // Edit existing
        const index = allClasses.findIndex(c => c.id === classId);
        if (index >= 0) {
            allClasses[index] = {
                id: classId,
                name: className,
                schedule: schedule,
                batch: batch,
                trainerId: trainerId
            };
        }
    } else {
        // Add new
        const newClass = {
            id: 'CLASS' + Date.now(),
            name: className,
            schedule: schedule,
            batch: batch,
            trainerId: trainerId
        };
        allClasses.push(newClass);
    }
    
    localStorage.setItem('allClasses', JSON.stringify(allClasses));
    
    const modalElement = document.getElementById('addClassModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    
    // Reset form
    if (form) {
        form.reset();
        document.getElementById('classId').value = '';
    }
    
    loadClasses();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Class saved successfully');
    }
}

function editClass(id) {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const cls = allClasses.find(c => c.id === id);
    if (!cls) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Class not found');
        }
        return;
    }
    
    const classIdEl = document.getElementById('classId');
    const classNameEl = document.getElementById('className');
    const scheduleEl = document.getElementById('classSchedule');
    const batchEl = document.getElementById('classBatch');
    const trainerIdEl = document.getElementById('classTrainerId');
    const modalEl = document.getElementById('addClassModal');
    
    if (!classIdEl || !classNameEl || !scheduleEl || !batchEl || !modalEl) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Class form elements not found');
        }
        return;
    }
    
    classIdEl.value = cls.id;
    classNameEl.value = cls.name || '';
    scheduleEl.value = cls.schedule || '';
    batchEl.value = cls.batch || '';
    if (trainerIdEl) trainerIdEl.value = cls.trainerId || '';
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function deleteClass(id) {
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to delete this class?', 'Confirm Delete')
        : confirm('Are you sure you want to delete this class?');
    
    if (confirmed) {
        const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
        const filtered = allClasses.filter(c => c.id !== id);
        localStorage.setItem('allClasses', JSON.stringify(filtered));
        loadClasses();
        if (typeof Toast !== 'undefined') {
            Toast.success('Class deleted successfully');
        }
    }
}

function loadCanteen() {
    const stock = getCanteenStock();
    const stockHtml = stock.map(item => `
        <div class="mb-2 p-2 bg-light rounded">
            <strong>${item.item}:</strong> <span class="badge bg-success">${item.quantity} ${item.unit}</span>
        </div>
    `).join('');
    document.getElementById('stockDisplay').innerHTML = stockHtml || '<p class="text-muted">No stock data</p>';
    
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const countHtml = `
        <div class="food-count-card mb-3 p-3 bg-gradient-primary text-white rounded">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <i class="bi bi-sunrise-fill"></i> <strong>Tiffin (Morning)</strong>
                </div>
                <span class="badge bg-light text-dark fs-5 px-3 py-2">${menu.morning.selectedCount} Selections</span>
            </div>
        </div>
        <div class="food-count-card mb-3 p-3 bg-gradient-info text-white rounded">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <i class="bi bi-moon-fill"></i> <strong>Dinner (Night)</strong>
                </div>
                <span class="badge bg-light text-dark fs-5 px-3 py-2">${menu.night.selectedCount} Selections</span>
            </div>
        </div>
        <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle"></i> <small>These counts include both student and trainer selections for food preparation planning.</small>
        </div>
    `;
    document.getElementById('foodCountDisplay').innerHTML = countHtml;
}

function loadHostel() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const countHtml = `
        <div class="food-count-card mb-3 p-3 bg-gradient-primary text-white rounded">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <i class="bi bi-sunrise-fill"></i> <strong>Tiffin (Morning)</strong>
                </div>
                <span class="badge bg-light text-dark fs-5 px-3 py-2">${menu.morning.selectedCount} Selections</span>
            </div>
        </div>
        <div class="food-count-card mb-3 p-3 bg-gradient-info text-white rounded">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <i class="bi bi-moon-fill"></i> <strong>Dinner (Night)</strong>
                </div>
                <span class="badge bg-light text-dark fs-5 px-3 py-2">${menu.night.selectedCount} Selections</span>
            </div>
        </div>
        <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle"></i> <small>These counts include both student and trainer selections for food preparation planning.</small>
        </div>
    `;
    document.getElementById('hostelFoodCountDisplay').innerHTML = countHtml;
}

function loadLeaves() {
    // Get all leaves (student and trainer)
    const studentLeaves = getStudentLeaves();
    const trainerLeaves = getTrainerLeaves();
    
    // Combine and categorize
    const allLeaves = [
        ...studentLeaves.map(l => ({...l, userType: 'Student'})),
        ...trainerLeaves.map(l => ({...l, userType: 'Trainer'}))
    ];
    
    // Separate into categories
    const pendingLeaves = allLeaves.filter(l => 
        l.approvalStatus !== 'Approved' && 
        l.approvalStatus !== 'Final Approved' && 
        l.approvalStatus !== 'Rejected'
    );
    const approvedLeaves = allLeaves.filter(l => 
        l.approvalLevel === 2 || l.approvalLevel === 3 || 
        l.approvalStatus === 'Approved' || 
        l.approvalStatus === 'Final Approved'
    );
    const rejectedLeaves = allLeaves.filter(l => l.approvalStatus === 'Rejected');
    
    // Update badge counts
    document.getElementById('pendingBadge').textContent = pendingLeaves.length;
    document.getElementById('approvedBadge').textContent = approvedLeaves.length;
    document.getElementById('rejectedBadge').textContent = rejectedLeaves.length;
    
    // Render Pending Tab
    const pendingTbody = document.getElementById('pendingLeavesTableBody');
    if (pendingTbody) {
        if (pendingLeaves.length === 0) {
            pendingTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No pending leaves</td></tr>';
        } else {
            pendingTbody.innerHTML = pendingLeaves.map(leave => {
                const userName = leave.userType === 'Student' 
                    ? (getStudentById(leave.studentId)?.name || leave.studentName || leave.studentId)
                    : (leave.trainerName || leave.trainerId || 'N/A');
                const userId = leave.userType === 'Student' ? leave.studentId : leave.trainerId;
                
                // Determine current stage
                let currentStage = '';
                let stageBadge = '';
                if (leave.approvalLevel === 0 || !leave.approvalLevel) {
                    currentStage = 'Waiting for Trainer';
                    stageBadge = 'bg-secondary';
                } else if (leave.approvalLevel === 1) {
                    currentStage = 'Waiting for MIS';
                    stageBadge = 'bg-info';
                } else if (leave.approvalLevel === 2) {
                    currentStage = 'Waiting for Admin';
                    stageBadge = 'bg-warning';
                } else {
                    currentStage = 'Processing';
                    stageBadge = 'bg-primary';
                }
                
                return `
                    <tr>
                        <td><span class="badge bg-primary">${leave.userType}</span></td>
                        <td>${userId || 'N/A'}<br><small class="text-muted">${userName}</small></td>
                        <td>${leave.fromDate || 'N/A'}</td>
                        <td>${leave.toDate || 'N/A'}</td>
                        <td>${leave.reason || 'N/A'}</td>
                        <td><span class="badge ${stageBadge}">${currentStage}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="showLeaveDetails('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-success" onclick="approveLeaveLevel3('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-check-circle"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-x-circle"></i> Reject
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="showLeaveOverride('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-shield-exclamation"></i> Override
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // Render Approved Tab
    const approvedTbody = document.getElementById('approvedLeavesTableBody');
    if (approvedTbody) {
        if (approvedLeaves.length === 0) {
            approvedTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No approved leaves</td></tr>';
        } else {
            approvedTbody.innerHTML = approvedLeaves.map(leave => {
                const userName = leave.userType === 'Student' 
                    ? (getStudentById(leave.studentId)?.name || leave.studentName || leave.studentId)
                    : (leave.trainerName || leave.trainerId || 'N/A');
                const userId = leave.userType === 'Student' ? leave.studentId : leave.trainerId;
                const approvedBy = leave.adminApprovedBy || leave.misApprovedBy || leave.trainerApprovedBy || 'System';
                const approvedDate = leave.adminApprovedDate || leave.misApprovedDate || leave.trainerApprovedDate || 'N/A';
                
                return `
                    <tr>
                        <td><span class="badge bg-primary">${leave.userType}</span></td>
                        <td>${userId || 'N/A'}<br><small class="text-muted">${userName}</small></td>
                        <td>${leave.fromDate || 'N/A'}</td>
                        <td>${leave.toDate || 'N/A'}</td>
                        <td>${leave.reason || 'N/A'}</td>
                        <td>${approvedBy}</td>
                        <td>${approvedDate}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="showLeaveDetails('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // Render Rejected Tab
    const rejectedTbody = document.getElementById('rejectedLeavesTableBody');
    if (rejectedTbody) {
        if (rejectedLeaves.length === 0) {
            rejectedTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No rejected leaves</td></tr>';
        } else {
            rejectedTbody.innerHTML = rejectedLeaves.map(leave => {
                const userName = leave.userType === 'Student' 
                    ? (getStudentById(leave.studentId)?.name || leave.studentName || leave.studentId)
                    : (leave.trainerName || leave.trainerId || 'N/A');
                const userId = leave.userType === 'Student' ? leave.studentId : leave.trainerId;
                const rejectedBy = leave.rejectedBy || 'System';
                const rejectedDate = leave.rejectedDate || 'N/A';
                
                // Determine rejection stage
                let rejectionStage = 'Unknown';
                if (leave.approvalLevel === 0 || !leave.approvalLevel) {
                    rejectionStage = 'At Trainer Level';
                } else if (leave.approvalLevel === 1) {
                    rejectionStage = 'At MIS Level';
                } else if (leave.approvalLevel === 2) {
                    rejectionStage = 'At Admin Level';
                }
                
                return `
                    <tr>
                        <td><span class="badge bg-primary">${leave.userType}</span></td>
                        <td>${userId || 'N/A'}<br><small class="text-muted">${userName}</small></td>
                        <td>${leave.fromDate || 'N/A'}</td>
                        <td>${leave.toDate || 'N/A'}</td>
                        <td>${leave.reason || 'N/A'}</td>
                        <td>${rejectedBy}</td>
                        <td>${rejectedDate}</td>
                        <td><span class="badge bg-danger">${rejectionStage}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="showLeaveDetails('${leave.id}', '${leave.userType}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function showLeaveDetails(leaveId, userType) {
    let leave = null;
    if (userType === 'Student') {
        const leaves = getStudentLeaves();
        leave = leaves.find(l => l.id === leaveId);
    } else {
        const leaves = getTrainerLeaves();
        leave = leaves.find(l => l.id === leaveId);
    }
    
    if (!leave) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Leave not found');
        }
        return;
    }
    
    const userName = userType === 'Student' 
        ? (getStudentById(leave.studentId)?.name || leave.studentName || leave.studentId)
        : (leave.trainerName || leave.trainerId || 'N/A');
    const userId = userType === 'Student' ? leave.studentId : leave.trainerId;
    
    let detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="bi bi-info-circle"></i> Leave Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>User Type:</strong></td><td><span class="badge bg-primary">${userType}</span></td></tr>
                    <tr><td><strong>ID:</strong></td><td>${userId || 'N/A'}</td></tr>
                    <tr><td><strong>Name:</strong></td><td>${userName}</td></tr>
                    <tr><td><strong>From Date:</strong></td><td>${leave.fromDate || 'N/A'}</td></tr>
                    <tr><td><strong>To Date:</strong></td><td>${leave.toDate || 'N/A'}</td></tr>
                    <tr><td><strong>Reason:</strong></td><td>${leave.reason || 'N/A'}</td></tr>
                    <tr><td><strong>Applied Date:</strong></td><td>${leave.appliedDate || 'N/A'}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge ${leave.approvalStatus === 'Approved' || leave.approvalStatus === 'Final Approved' ? 'bg-success' : leave.approvalStatus === 'Rejected' ? 'bg-danger' : 'bg-warning'}">${leave.approvalStatus || 'Pending'}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6><i class="bi bi-clock-history"></i> Approval History</h6>
                <div class="timeline">
    `;
    
    if (leave.trainerApproved) {
        detailsHtml += `
            <div class="timeline-item">
                <div class="timeline-marker bg-success"></div>
                <div class="timeline-content">
                    <strong>Level 1: Trainer Approved</strong><br>
                    Approved by: ${leave.trainerApprovedBy || 'N/A'}<br>
                    Date: ${leave.trainerApprovedDate || 'N/A'}
                </div>
            </div>
        `;
    }
    
    if (leave.misApproved) {
        detailsHtml += `
            <div class="timeline-item">
                <div class="timeline-marker bg-info"></div>
                <div class="timeline-content">
                    <strong>Level 2: MIS Approved</strong><br>
                    Approved by: ${leave.misApprovedBy || 'N/A'}<br>
                    Date: ${leave.misApprovedDate || 'N/A'}<br>
                    Parent Contacted: ${leave.parentContacted ? 'Yes' : 'No'}
                </div>
            </div>
        `;
    }
    
    if (leave.adminApproved) {
        detailsHtml += `
            <div class="timeline-item">
                <div class="timeline-marker bg-primary"></div>
                <div class="timeline-content">
                    <strong>Level 3: Admin Approved (Final)</strong><br>
                    Approved by: ${leave.adminApprovedBy || 'N/A'}<br>
                    Date: ${leave.adminApprovedDate || 'N/A'}
                </div>
            </div>
        `;
    }
    
    if (leave.rejectedDate) {
        detailsHtml += `
            <div class="timeline-item">
                <div class="timeline-marker bg-danger"></div>
                <div class="timeline-content">
                    <strong>Rejected</strong><br>
                    Rejected by: ${leave.rejectedBy || 'N/A'}<br>
                    Date: ${leave.rejectedDate || 'N/A'}
                </div>
            </div>
        `;
    }
    
    if (leave.internalRemarks) {
        detailsHtml += `
            <div class="mt-3">
                <h6><i class="bi bi-chat-left-text"></i> Internal Remarks</h6>
                <div class="alert alert-info">${leave.internalRemarks}</div>
            </div>
        `;
    }
    
    detailsHtml += `
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('leaveDetailsContent').innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewLeaveModal'));
    modal.show();
}

async function approveLeaveLevel3(leaveId, userType) {
    const confirmed = typeof ConfirmDialog !== 'undefined' 
        ? await ConfirmDialog.show('Approve this leave at Level 3 (Final Approval)? This will complete the approval process.', 'Confirm Approval')
        : confirm('Approve this leave at Level 3 (Final Approval)? This will complete the approval process.');
    
    if (!confirmed) {
        return;
    }
    
    let leaves, storageKey;
    if (userType === 'Student') {
        leaves = getStudentLeaves();
        storageKey = 'studentLeaves';
    } else {
        leaves = getTrainerLeaves();
        storageKey = 'trainerLeaves';
    }
    
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Leave not found');
        }
        return;
    }
    
    leave.approvalLevel = 3;
    leave.adminApproved = true;
    leave.adminApprovedBy = currentUser.name;
    leave.adminApprovedDate = new Date().toISOString().split('T')[0];
    leave.approvalStatus = 'Final Approved';
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem(storageKey, JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    if (typeof Toast !== 'undefined') {
        Toast.success('Leave approved at Level 3 (Final). The leave application is now fully approved.');
    } else {
        alert('Leave approved at Level 3 (Final). The leave application is now fully approved.');
    }
}

async function rejectLeave(leaveId, userType) {
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Reject this leave application? This will reject it at all levels.', 'Confirm Rejection')
        : confirm('Reject this leave application? This will reject it at all levels.');
    
    if (!confirmed) {
        return;
    }
    
    let leaves, storageKey;
    if (userType === 'Student') {
        leaves = getStudentLeaves();
        storageKey = 'studentLeaves';
    } else {
        leaves = getTrainerLeaves();
        storageKey = 'trainerLeaves';
    }
    
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Leave not found');
        }
        return;
    }
    
    leave.approvalStatus = 'Rejected';
    leave.approvalLevel = -1;
    leave.rejectedBy = currentUser.name;
    leave.rejectedDate = new Date().toISOString().split('T')[0];
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem(storageKey, JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    if (typeof Toast !== 'undefined') {
        Toast.warning('Leave application rejected.');
    } else {
        alert('Leave application rejected.');
    }
}

function showLeaveOverride(leaveId, userType) {
    document.getElementById('overrideLeaveId').value = leaveId;
    document.getElementById('overrideLeaveId').setAttribute('data-user-type', userType);
    document.getElementById('overrideAction').value = '';
    document.getElementById('overrideRemarks').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('leaveOverrideModal'));
    modal.show();
}

async function saveLeaveOverride() {
    const leaveId = document.getElementById('overrideLeaveId').value;
    const userType = document.getElementById('overrideLeaveId').getAttribute('data-user-type');
    const action = document.getElementById('overrideAction').value;
    const remarks = document.getElementById('overrideRemarks').value;
    
    if (!action) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please select an action');
        } else {
            alert('Please select an action');
        }
        return;
    }
    
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to override the normal approval workflow? This action cannot be easily undone.', 'Confirm Override')
        : confirm('Are you sure you want to override the normal approval workflow? This action cannot be easily undone.');
    
    if (!confirmed) {
        return;
    }
    
    let leaves, storageKey;
    if (userType === 'Student') {
        leaves = getStudentLeaves();
        storageKey = 'studentLeaves';
    } else {
        leaves = getTrainerLeaves();
        storageKey = 'trainerLeaves';
    }
    
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Leave not found');
        }
        return;
    }
    
    if (action === 'approve') {
        leave.approvalLevel = 3; // Admin final approval
        leave.adminApproved = true;
        leave.adminApprovedBy = currentUser.name;
        leave.adminApprovedDate = new Date().toISOString().split('T')[0];
        leave.approvalStatus = 'Final Approved';
        leave.overrideApproved = true;
    } else if (action === 'reject') {
        leave.approvalStatus = 'Rejected';
        leave.approvalLevel = -1;
        leave.rejectedBy = currentUser.name;
        leave.rejectedDate = new Date().toISOString().split('T')[0];
        leave.overrideRejected = true;
    }
    
    if (remarks) {
        leave.internalRemarks = (leave.internalRemarks || '') + '\n[Admin Override - ' + new Date().toLocaleString() + ']: ' + remarks;
    }
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem(storageKey, JSON.stringify(leaves));
    
    const modalElement = document.getElementById('leaveOverrideModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    loadLeaves();
    loadDashboard();
    if (typeof Toast !== 'undefined') {
        Toast.success('Leave override applied successfully.');
    } else {
        alert('Leave override applied successfully.');
    }
}

function exportLeaveReport() {
    const studentLeaves = getStudentLeaves();
    const trainerLeaves = getTrainerLeaves();
    const allLeaves = [
        ...studentLeaves.map(l => ({...l, userType: 'Student'})),
        ...trainerLeaves.map(l => ({...l, userType: 'Trainer'}))
    ];
    
    if (allLeaves.length === 0) {
        if (typeof Toast !== 'undefined') {
            Toast.info('No leave data to export');
        } else {
            alert('No leave data to export');
        }
        return;
    }
    
    // Create CSV content
    let csv = 'User Type,ID,Name,From Date,To Date,Reason,Status,Approval Level,Applied Date,Approved By,Approved Date\n';
    
    allLeaves.forEach(leave => {
        const userName = leave.userType === 'Student' 
            ? (getStudentById(leave.studentId)?.name || leave.studentName || leave.studentId)
            : (leave.trainerName || leave.trainerId || 'N/A');
        const userId = leave.userType === 'Student' ? leave.studentId : leave.trainerId;
        const approvedBy = leave.adminApprovedBy || leave.misApprovedBy || leave.trainerApprovedBy || '';
        const approvedDate = leave.adminApprovedDate || leave.misApprovedDate || leave.trainerApprovedDate || '';
        
        csv += `"${leave.userType}","${userId}","${userName}","${leave.fromDate || ''}","${leave.toDate || ''}","${(leave.reason || '').replace(/"/g, '""')}","${leave.approvalStatus || 'Pending'}","${leave.approvalLevel || 0}","${leave.appliedDate || ''}","${approvedBy}","${approvedDate}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Leave report exported successfully');
    } else {
        alert('Leave report exported successfully');
    }
}

function viewStudent(id) {
    const student = getStudentById(id);
    if (!student) return;
    
    let details = `Student Details:\n\nID: ${student.id}\nName: ${student.name}\nMobile: ${student.mobile}\n`;
    if (student.parentNumber) {
        details += `Parent Number: ${student.parentNumber}\n`;
    }
    details += `Batch: ${student.currentBatch}\nHostel: ${student.hostelStatus}`;
    if (typeof Toast !== 'undefined') {
        Toast.info(details, 5000);
    } else {
        alert(details);
    }
}

function editStudent(id) {
    const student = getStudentById(id);
    if (!student) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Student not found');
        }
        return;
    }
    
    const studentIdEl = document.getElementById('studentId');
    const studentNameEl = document.getElementById('studentName');
    const studentMobileEl = document.getElementById('studentMobile');
    const parentNumberEl = document.getElementById('parentNumber');
    const batchNumberEl = document.getElementById('batchNumber');
    const currentBatchEl = document.getElementById('currentBatch');
    const hostelStatusEl = document.getElementById('hostelStatus');
    const locationEl = document.getElementById('location');
    const studentIdInputEl = document.getElementById('studentIdInput');
    const modalEl = document.getElementById('addStudentModal');
    
    if (!studentIdEl || !studentNameEl || !studentMobileEl || !batchNumberEl || !currentBatchEl || !hostelStatusEl || !modalEl) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Student form elements not found');
        }
        return;
    }
    
    studentIdEl.value = student.id;
    if (studentIdInputEl) studentIdInputEl.value = student.id;
    studentNameEl.value = student.name;
    studentMobileEl.value = student.mobile;
    if (parentNumberEl) parentNumberEl.value = student.parentNumber || '';
    batchNumberEl.value = student.batchNumber;
    currentBatchEl.value = student.currentBatch;
    hostelStatusEl.value = student.hostelStatus;
    if (locationEl) locationEl.value = student.location || '';
    
    // Disable student ID field in edit mode
    studentIdEl.disabled = true;
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function deleteStudentConfirm(id) {
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to delete this student?', 'Confirm Delete')
        : confirm('Are you sure you want to delete this student?');
    
    if (confirmed) {
        deleteStudent(id);
        loadStudents();
        loadDashboard();
    }
}

function loadAttendance() {
    const students = getStudents();
    const tbody = document.getElementById('attendanceTableBody');
    
    if (!tbody) return;
    
    // Filter students if search is active
    const searchInput = document.getElementById('attendanceSearch');
    let filteredStudents = students;
    
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filteredStudents = students.filter(student => 
            student.name.toLowerCase().includes(searchTerm) ||
            student.id.toLowerCase().includes(searchTerm) ||
            (student.currentBatch && student.currentBatch.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredStudents.map(student => {
        const onlineStatus = student.attendance && student.attendance.onlineClassCompleted;
        const offlineStatus = student.attendance && student.attendance.offlineRecordsReceived;
        
        return `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.currentBatch || 'N/A'}</td>
                <td>
                    <span class="badge ${onlineStatus ? 'bg-success' : 'bg-danger'}">
                        ${onlineStatus ? 'Completed' : 'Pending'}
                    </span>
                </td>
                <td>
                    <span class="badge ${offlineStatus ? 'bg-success' : 'bg-danger'}">
                        ${offlineStatus ? 'Received' : 'Pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showUpdateAttendance('${student.id}')">
                        <i class="bi bi-pencil"></i> Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showUpdateAttendance(studentId) {
    const student = getStudentById(studentId);
    if (!student) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Student not found');
        }
        return;
    }
    
    // Create or show update modal
    let modal = document.getElementById('updateAttendanceModal');
    if (!modal) {
        // Create modal dynamically
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'updateAttendanceModal';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Attendance - ${student.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="updateAttendanceForm">
                            <input type="hidden" id="attendanceStudentId" value="${student.id}">
                            <div class="mb-3">
                                <label class="form-label">Online Class Completed</label>
                                <select class="form-select" id="updateOnlineClass">
                                    <option value="false" ${!student.attendance?.onlineClassCompleted ? 'selected' : ''}>Pending</option>
                                    <option value="true" ${student.attendance?.onlineClassCompleted ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Offline Records Received</label>
                                <select class="form-select" id="updateOfflineRecords">
                                    <option value="false" ${!student.attendance?.offlineRecordsReceived ? 'selected' : ''}>Pending</option>
                                    <option value="true" ${student.attendance?.offlineRecordsReceived ? 'selected' : ''}>Received</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAttendanceUpdate()">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Update existing modal
        modal.querySelector('#attendanceStudentId').value = student.id;
        modal.querySelector('.modal-title').textContent = `Update Attendance - ${student.name}`;
        modal.querySelector('#updateOnlineClass').value = student.attendance?.onlineClassCompleted ? 'true' : 'false';
        modal.querySelector('#updateOfflineRecords').value = student.attendance?.offlineRecordsReceived ? 'true' : 'false';
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function saveAttendanceUpdate() {
    const studentId = document.getElementById('attendanceStudentId').value;
    const onlineClass = document.getElementById('updateOnlineClass').value === 'true';
    const offlineRecords = document.getElementById('updateOfflineRecords').value === 'true';
    
    const students = getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Student not found');
        }
        return;
    }
    
    if (!student.attendance) {
        student.attendance = {};
    }
    
    student.attendance.onlineClassCompleted = onlineClass;
    student.attendance.offlineRecordsReceived = offlineRecords;
    
    const index = students.findIndex(s => s.id === studentId);
    if (index >= 0) {
        students[index] = student;
    }
    
    localStorage.setItem('students', JSON.stringify(students));
    
    const modalElement = document.getElementById('updateAttendanceModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    
    loadAttendance();
    loadDashboard();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Attendance updated successfully');
    }
}

// ==================== TRAINER MANAGEMENT ====================

function loadTrainers() {
    let trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    const tbody = document.getElementById('trainersTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('trainerSearch')?.value.toLowerCase() || '';
    trainers = trainers.filter(t => 
        !searchTerm || 
        (t.name && t.name.toLowerCase().includes(searchTerm)) ||
        (t.username && t.username.toLowerCase().includes(searchTerm)) ||
        (t.email && t.email.toLowerCase().includes(searchTerm))
    );
    
    if (trainers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No trainers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = trainers.map(trainer => `
        <tr>
            <td>${trainer.id || 'N/A'}</td>
            <td>${trainer.name || 'N/A'}</td>
            <td>${trainer.username || 'N/A'}</td>
            <td>${trainer.email || 'N/A'}</td>
            <td>${trainer.mobile || 'N/A'}</td>
            <td><span class="badge bg-success">Active</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTrainer('${trainer.id || trainer.username}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTrainerConfirm('${trainer.id || trainer.username}')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update badge
    const trainersBadge = document.getElementById('trainersBadge');
    if (trainersBadge) {
        trainersBadge.textContent = trainers.length;
    }
}

function showAddTrainerModal() {
    document.getElementById('addTrainerForm').reset();
    document.getElementById('trainerId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('addTrainerModal'));
    modal.show();
}

function saveTrainer() {
    const trainerId = document.getElementById('trainerId').value;
    const name = document.getElementById('trainerName').value;
    const username = document.getElementById('trainerUsername').value;
    const email = document.getElementById('trainerEmail').value;
    const mobile = document.getElementById('trainerMobile').value;
    
    if (!name || !username) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Name and username are required');
        }
        return;
    }
    
    let trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    
    if (trainerId) {
        // Edit existing
        const index = trainers.findIndex(t => t.id === trainerId || t.username === trainerId);
        if (index >= 0) {
            trainers[index] = {...trainers[index], name, username, email, mobile};
        }
    } else {
        // Add new
        const newTrainer = {
            id: 'TRAINER' + Date.now(),
            name,
            username,
            email,
            mobile,
            createdAt: new Date().toISOString()
        };
        trainers.push(newTrainer);
    }
    
    localStorage.setItem('trainers', JSON.stringify(trainers));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTrainerModal'));
    if (modal) modal.hide();
    
    loadTrainers();
    loadDashboard();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Trainer saved successfully');
    }
}

function editTrainer(id) {
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    const trainer = trainers.find(t => t.id === id || t.username === id);
    if (!trainer) return;
    
    document.getElementById('trainerId').value = trainer.id || trainer.username;
    document.getElementById('trainerName').value = trainer.name || '';
    document.getElementById('trainerUsername').value = trainer.username || '';
    document.getElementById('trainerEmail').value = trainer.email || '';
    document.getElementById('trainerMobile').value = trainer.mobile || '';
    
    const modal = new bootstrap.Modal(document.getElementById('addTrainerModal'));
    modal.show();
}

async function deleteTrainerConfirm(id) {
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to delete this trainer?', 'Confirm Delete')
        : confirm('Are you sure you want to delete this trainer?');
    
    if (confirmed) {
        const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
        const filtered = trainers.filter(t => t.id !== id && t.username !== id);
        localStorage.setItem('trainers', JSON.stringify(filtered));
        loadTrainers();
        loadDashboard();
        if (typeof Toast !== 'undefined') {
            Toast.success('Trainer deleted successfully');
        }
    }
}

// ==================== USER & ROLE MANAGEMENT ====================

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const isActive = user.isActive !== false; // Default to true if not set
        const statusBadge = isActive ? 'bg-success' : 'bg-secondary';
        const statusText = isActive ? 'Active' : 'Inactive';
        
        return `
        <tr>
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td><span class="badge bg-primary">${user.role}</span></td>
            <td>
                <div class="form-check form-switch d-inline-block">
                    <input class="form-check-input" type="checkbox" role="switch" 
                           id="userActiveSwitch_${user.username}" 
                           ${isActive ? 'checked' : ''} 
                           onchange="toggleUserStatus('${user.username}', this.checked)">
                    <label class="form-check-label ms-2" for="userActiveSwitch_${user.username}">
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </label>
                </div>
            </td>
            <td>${user.lastLogin || 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser('${user.username}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUserConfirm('${user.username}')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    // Load roles
    loadRoles();
}

function loadRoles() {
    const roles = [
        { role: 'admin', description: 'Full system control', permissions: 'All', users: 1 },
        { role: 'trainer', description: 'Academic management', permissions: 'Students, Classes, Attendance', users: 0 },
        { role: 'mis', description: 'Student record management', permissions: 'Students, Attendance, Leaves', users: 0 },
        { role: 'student', description: 'Student access', permissions: 'Own data, Leave application', users: 0 }
    ];
    
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = roles.map(r => `
        <tr>
            <td><strong>${r.role}</strong></td>
            <td>${r.description}</td>
            <td>${r.permissions}</td>
            <td>${r.users}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewRolePermissions('${r.role}')">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    document.getElementById('addUserForm').reset();
    document.getElementById('userId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

function saveUser() {
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value;
    const name = document.getElementById('userName').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    
    if (!username || !name || !password || !role) {
        if (typeof Toast !== 'undefined') {
            Toast.error('All fields are required');
        }
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    if (userId) {
        // Edit existing
        const index = users.findIndex(u => u.username === userId);
        if (index >= 0) {
            users[index] = {...users[index], username, name, password, role};
        }
    } else {
        // Add new
        const newUser = {
            username,
            name,
            password,
            role,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        users.push(newUser);
    }
    
    localStorage.setItem('systemUsers', JSON.stringify(users));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    if (modal) modal.hide();
    
    loadUsers();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('User saved successfully');
    }
}

function editUser(username) {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const user = users.find(u => u.username === username);
    if (!user) return;
    
    document.getElementById('userId').value = user.username;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userName').value = user.name;
    document.getElementById('userPassword').value = user.password;
    document.getElementById('userRole').value = user.role;
    
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

async function deleteUserConfirm(username) {
    if (username === 'admin') {
        if (typeof Toast !== 'undefined') {
            Toast.error('Cannot delete admin user');
        }
        return;
    }
    
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to delete this user?', 'Confirm Delete')
        : confirm('Are you sure you want to delete this user?');
    
    if (confirmed) {
        const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const filtered = users.filter(u => u.username !== username);
        localStorage.setItem('systemUsers', JSON.stringify(filtered));
        loadUsers();
        if (typeof Toast !== 'undefined') {
            Toast.success('User deleted successfully');
        }
        
        // Log action
        if (typeof logAction !== 'undefined') {
            logAction('user_deleted', { username: username });
        }
    }
}

function toggleUserStatus(username, isActive) {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex >= 0) {
        users[userIndex].isActive = isActive;
        localStorage.setItem('systemUsers', JSON.stringify(users));
        
        // Log action
        if (typeof logAction !== 'undefined') {
            logAction(isActive ? 'user_activated' : 'user_deactivated', { 
                username: username,
                role: users[userIndex].role
            });
        }
        
        if (typeof Toast !== 'undefined') {
            Toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        
        // Reload users to update UI
        loadUsers();
    }
}

function viewRolePermissions(role) {
    const permissions = {
        admin: 'Full system access - Can view, add, edit, delete all data',
        trainer: 'Can manage classes, view students, approve leaves (Level 1)',
        mis: 'Can manage student records, update attendance, approve leaves (Level 2)',
        student: 'Can view own data, apply for leaves'
    };
    
    if (typeof Toast !== 'undefined') {
        Toast.info(`${role.toUpperCase()}: ${permissions[role] || 'No permissions defined'}`, 5000);
    } else {
        alert(`${role.toUpperCase()}: ${permissions[role] || 'No permissions defined'}`);
    }
}

// ==================== AUDIT LOGS MANAGEMENT ====================

function loadAuditLogs() {
    const actionFilter = document.getElementById('auditActionFilter')?.value || '';
    const userFilter = document.getElementById('auditUserFilter')?.value || '';
    const roleFilter = document.getElementById('auditRoleFilter')?.value || '';
    const dateFilter = document.getElementById('auditDateFilter')?.value || '';
    
    let logs = [];
    if (typeof getAuditLogs === 'function') {
        logs = getAuditLogs();
    } else {
        logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    }
    
    // Apply filters
    if (actionFilter) {
        logs = logs.filter(log => log.action && log.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    if (userFilter) {
        logs = logs.filter(log => log.user && log.user.toLowerCase().includes(userFilter.toLowerCase()));
    }
    if (roleFilter) {
        logs = logs.filter(log => log.role && log.role.toLowerCase() === roleFilter.toLowerCase());
    }
    if (dateFilter) {
        logs = logs.filter(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            return logDate === dateFilter;
        });
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody) return;
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No audit logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '') : 'N/A';
        const actionBadge = getActionBadgeClass(log.action);
        
        return `
            <tr>
                <td>${timestamp}</td>
                <td>${log.user || 'N/A'}</td>
                <td><span class="badge bg-secondary">${log.role || log.userRole || 'N/A'}</span></td>
                <td><span class="badge ${actionBadge}">${log.action || 'N/A'}</span></td>
                <td><small class="text-muted">${details}</small></td>
            </tr>
        `;
    }).join('');
}

function getActionBadgeClass(action) {
    if (!action) return 'bg-secondary';
    
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return 'bg-success';
    if (actionLower.includes('logout')) return 'bg-info';
    if (actionLower.includes('approval') || actionLower.includes('approved')) return 'bg-success';
    if (actionLower.includes('rejection') || actionLower.includes('rejected')) return 'bg-danger';
    if (actionLower.includes('create') || actionLower.includes('created')) return 'bg-primary';
    if (actionLower.includes('update') || actionLower.includes('updated')) return 'bg-warning';
    if (actionLower.includes('delete') || actionLower.includes('deleted')) return 'bg-danger';
    if (actionLower.includes('activate')) return 'bg-success';
    if (actionLower.includes('deactivate')) return 'bg-secondary';
    
    return 'bg-secondary';
}

function exportAuditLogs() {
    let logs = [];
    if (typeof getAuditLogs === 'function') {
        logs = getAuditLogs();
    } else {
        logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    }
    
    if (logs.length === 0) {
        if (typeof Toast !== 'undefined') {
            Toast.warning('No audit logs to export');
        }
        return;
    }
    
    // Convert to CSV
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Details'];
    const rows = logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user || '',
        log.role || log.userRole || '',
        log.action || '',
        log.details ? JSON.stringify(log.details) : ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Audit logs exported successfully');
    }
    
    // Log export action
    if (typeof logAction !== 'undefined') {
        logAction('audit_logs_exported', { count: logs.length });
    }
}

async function clearAuditLogs() {
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to clear all audit logs? This action cannot be undone.', 'Confirm Clear Logs')
        : confirm('Are you sure you want to clear all audit logs? This action cannot be undone.');
    
    if (!confirmed) return;
    
    // Get count before clearing for logging
    let logs = [];
    if (typeof getAuditLogs === 'function') {
        logs = getAuditLogs();
    } else {
        logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    }
    const logCount = logs.length;
    
    // Clear all logs
    localStorage.removeItem('auditLogs');
    
    // Log the clear action (this will be the only log entry after clearing)
    if (typeof logAction !== 'undefined') {
        logAction('audit_logs_cleared', { count: logCount });
    } else if (typeof saveAuditLog === 'function') {
        saveAuditLog({
            timestamp: new Date().toISOString(),
            user: currentUser?.username || 'system',
            role: currentUser?.role || 'admin',
            action: 'audit_logs_cleared',
            details: { count: logCount }
        });
    }
    
    loadAuditLogs();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Audit logs cleared successfully');
    }
}

// ==================== EXPORT FUNCTIONS ====================

function exportData(type, format) {
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'students':
            data = getStudents();
            filename = 'students_export';
            break;
        case 'trainers':
            data = JSON.parse(localStorage.getItem('trainers') || '[]');
            filename = 'trainers_export';
            break;
        case 'attendance':
            const students = getStudents();
            data = students.map(s => ({
                id: s.id,
                name: s.name,
                onlineClass: s.attendance?.onlineClassCompleted || false,
                offlineRecords: s.attendance?.offlineRecordsReceived || false
            }));
            filename = 'attendance_export';
            break;
        case 'leaves':
            const studentLeaves = getStudentLeaves();
            const trainerLeaves = getTrainerLeaves();
            data = [...studentLeaves, ...trainerLeaves];
            filename = 'leaves_export';
            break;
        default:
            if (typeof Toast !== 'undefined') {
                Toast.error('Invalid export type');
            }
            return;
    }
    
    if (data.length === 0) {
        if (typeof Toast !== 'undefined') {
            Toast.info('No data to export');
        }
        return;
    }
    
    // Convert to CSV
    const csv = convertToCSV(data);
    downloadFile(csv, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Data exported successfully');
    }
}

function exportAllData() {
    const allData = {
        students: getStudents(),
        trainers: JSON.parse(localStorage.getItem('trainers') || '[]'),
        studentLeaves: getStudentLeaves(),
        trainerLeaves: getTrainerLeaves(),
        users: JSON.parse(localStorage.getItem('systemUsers') || '[]'),
        canteenStock: getCanteenStock(),
        exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(allData, null, 2);
    downloadFile(json, `complete_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Complete backup exported successfully');
    }
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================== ANALYTICS ====================

function loadAnalytics() {
    const students = getStudents();
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    const studentLeaves = getStudentLeaves();
    const trainerLeaves = getTrainerLeaves();
    
    const analyticsHtml = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6>Student Statistics</h6>
                        <p>Total Students: <strong>${students.length}</strong></p>
                        <p>Hostel Students: <strong>${students.filter(s => s.hostelStatus === 'Yes').length}</strong></p>
                        <p>Attendance Rate: <strong>${calculateAttendanceRate()}%</strong></p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6>Leave Statistics</h6>
                        <p>Total Leaves: <strong>${studentLeaves.length + trainerLeaves.length}</strong></p>
                        <p>Pending: <strong>${(studentLeaves.filter(l => l.approvalStatus !== 'Approved' && l.approvalStatus !== 'Rejected').length + trainerLeaves.filter(l => l.approvalStatus !== 'Approved' && l.approvalStatus !== 'Rejected').length)}</strong></p>
                        <p>Approved: <strong>${(studentLeaves.filter(l => l.approvalStatus === 'Approved' || l.approvalStatus === 'Final Approved').length + trainerLeaves.filter(l => l.approvalStatus === 'Approved' || l.approvalStatus === 'Final Approved').length)}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const analyticsContent = document.getElementById('analyticsContent');
    if (analyticsContent) {
        analyticsContent.innerHTML = analyticsHtml;
    }
}

function calculateAttendanceRate() {
    const students = getStudents();
    if (students.length === 0) return 0;
    const completed = students.filter(s => 
        s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived
    ).length;
    return Math.round((completed / students.length) * 100);
}

// ==================== REPORTS ====================

function generateSystemReport() {
    if (typeof Toast !== 'undefined') {
        Toast.info('System report generation feature coming soon');
    } else {
        alert('System report generation feature coming soon');
    }
}

function generateStudentReport() {
    exportData('students', 'csv');
}

function generateAttendanceReport() {
    exportData('attendance', 'csv');
}

function generateLeaveReport() {
    exportData('leaves', 'csv');
}

// ==================== UTILITY FUNCTIONS ====================

function refreshAllData() {
    loadDashboard();
    loadStudents();
    loadTrainers();
    loadUsers();
    loadAttendance();
    loadLeaves();
    loadCanteen();
    loadHostel();
    
    if (typeof Toast !== 'undefined') {
        Toast.success('All data refreshed');
    }
}

function showUserProfile() {
    if (typeof Toast !== 'undefined') {
        Toast.info('User profile feature coming soon');
    }
}

function showSystemSettings() {
    if (typeof Toast !== 'undefined') {
        Toast.info('System settings feature coming soon');
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==================== SECTION-SPECIFIC DASHBOARDS ====================

function loadStudentsDashboard() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes').length;
    const batches = [...new Set(students.map(s => s.currentBatch).filter(Boolean))];
    const completedAttendance = students.filter(s => 
        s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived
    ).length;
    const attendanceRate = students.length > 0 ? Math.round((completedAttendance / students.length) * 100) : 0;
    
    // Update stats
    const totalEl = document.getElementById('studentsTotalCount');
    const hostelEl = document.getElementById('studentsHostelCount');
    const batchEl = document.getElementById('studentsBatchCount');
    const attendanceEl = document.getElementById('studentsAttendanceRate');
    
    if (totalEl) totalEl.textContent = students.length;
    if (hostelEl) hostelEl.textContent = hostelStudents;
    if (batchEl) batchEl.textContent = batches.length;
    if (attendanceEl) attendanceEl.textContent = attendanceRate + '%';
    
    // Batch Distribution Chart
    const batchData = {};
    students.forEach(s => {
        const batch = s.currentBatch || 'Unassigned';
        batchData[batch] = (batchData[batch] || 0) + 1;
    });
    
    const batchChartEl = document.getElementById('batchDistributionChart');
    if (batchChartEl) {
        let chartHtml = '<div class="row">';
        Object.entries(batchData).forEach(([batch, count]) => {
            const percentage = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
            chartHtml += `
                <div class="col-md-6 mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span><strong>${batch}</strong></span>
                        <span class="badge bg-primary">${count} students</span>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${percentage}%">${percentage}%</div>
                    </div>
                </div>
            `;
        });
        chartHtml += '</div>';
        batchChartEl.innerHTML = chartHtml || '<p class="text-muted">No batch data available</p>';
    }
    
    // Hostel Status Chart
    const hostelChartEl = document.getElementById('hostelStatusChart');
    if (hostelChartEl) {
        const nonHostel = students.length - hostelStudents;
        const hostelPercent = students.length > 0 ? Math.round((hostelStudents / students.length) * 100) : 0;
        const nonHostelPercent = 100 - hostelPercent;
        
        hostelChartEl.innerHTML = `
            <div class="row text-center">
                <div class="col-6">
                    <div class="p-3 bg-success bg-opacity-10 rounded">
                        <h3 class="text-success">${hostelStudents}</h3>
                        <p class="mb-0">Hostel Students</p>
                        <small class="text-muted">${hostelPercent}%</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-3 bg-secondary bg-opacity-10 rounded">
                        <h3 class="text-secondary">${nonHostel}</h3>
                        <p class="mb-0">Non-Hostel</p>
                        <small class="text-muted">${nonHostelPercent}%</small>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadTrainersDashboard() {
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    const classes = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const trainerLeaves = getTrainerLeaves();
    const pendingLeaves = trainerLeaves.filter(l => 
        l.approvalStatus !== 'Approved' && l.approvalStatus !== 'Rejected'
    );
    
    const totalEl = document.getElementById('trainersTotalCount');
    const classesEl = document.getElementById('trainersClassesCount');
    const leavesEl = document.getElementById('trainersPendingLeaves');
    
    if (totalEl) totalEl.textContent = trainers.length;
    if (classesEl) classesEl.textContent = classes.length;
    if (leavesEl) leavesEl.textContent = pendingLeaves.length;
    
    // Trainer Activity Overview
    const activityEl = document.getElementById('trainerActivityOverview');
    if (activityEl) {
        let html = '<div class="row">';
        trainers.forEach(trainer => {
            const trainerClasses = classes.filter(c => c.trainerId === trainer.username || c.trainerId === trainer.id);
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6>${trainer.name || trainer.username}</h6>
                            <p class="mb-1"><i class="bi bi-calendar-event"></i> Classes: <strong>${trainerClasses.length}</strong></p>
                            <p class="mb-0"><i class="bi bi-envelope"></i> ${trainer.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        activityEl.innerHTML = html || '<p class="text-muted">No trainer activity data</p>';
    }
}

function loadAttendanceDashboard() {
    const students = getStudents();
    const completed = students.filter(s => 
        s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived
    ).length;
    const online = students.filter(s => s.attendance && s.attendance.onlineClassCompleted).length;
    const offline = students.filter(s => s.attendance && s.attendance.offlineRecordsReceived).length;
    const pending = students.length - completed;
    
    const completedEl = document.getElementById('attendanceCompleted');
    const onlineEl = document.getElementById('attendanceOnline');
    const offlineEl = document.getElementById('attendanceOffline');
    const pendingEl = document.getElementById('attendancePending');
    
    if (completedEl) completedEl.textContent = completed;
    if (onlineEl) onlineEl.textContent = online;
    if (offlineEl) offlineEl.textContent = offline;
    if (pendingEl) pendingEl.textContent = pending;
    
    // Attendance Status Chart
    const statusChartEl = document.getElementById('attendanceStatusChart');
    if (statusChartEl) {
        const completedPercent = students.length > 0 ? Math.round((completed / students.length) * 100) : 0;
        const pendingPercent = 100 - completedPercent;
        
        statusChartEl.innerHTML = `
            <div class="text-center mb-3">
                <h3>${completedPercent}%</h3>
                <p class="text-muted">Completion Rate</p>
            </div>
            <div class="progress mb-2" style="height: 30px;">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${completedPercent}%">
                    Completed: ${completed}
                </div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: ${pendingPercent}%">
                    Pending: ${pending}
                </div>
            </div>
        `;
    }
    
    // Batch-wise Attendance
    const batchChartEl = document.getElementById('batchAttendanceChart');
    if (batchChartEl) {
        const batchData = {};
        students.forEach(s => {
            const batch = s.currentBatch || 'Unassigned';
            if (!batchData[batch]) {
                batchData[batch] = { total: 0, completed: 0 };
            }
            batchData[batch].total++;
            if (s.attendance && s.attendance.onlineClassCompleted && s.attendance.offlineRecordsReceived) {
                batchData[batch].completed++;
            }
        });
        
        let html = '';
        Object.entries(batchData).forEach(([batch, data]) => {
            const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            html += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span><strong>${batch}</strong></span>
                        <span>${rate}%</span>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${rate}%">${data.completed}/${data.total}</div>
                    </div>
                </div>
            `;
        });
        batchChartEl.innerHTML = html || '<p class="text-muted">No batch data</p>';
    }
}

function loadLeavesDashboard() {
    const studentLeaves = getStudentLeaves();
    const trainerLeaves = getTrainerLeaves();
    const allLeaves = [...studentLeaves, ...trainerLeaves];
    
    const pending = allLeaves.filter(l => 
        l.approvalStatus !== 'Approved' && l.approvalStatus !== 'Final Approved' && l.approvalStatus !== 'Rejected'
    ).length;
    const approved = allLeaves.filter(l => 
        l.approvalLevel === 3 || l.approvalStatus === 'Approved' || l.approvalStatus === 'Final Approved'
    ).length;
    const rejected = allLeaves.filter(l => l.approvalStatus === 'Rejected').length;
    const approvalRate = allLeaves.length > 0 ? Math.round((approved / allLeaves.length) * 100) : 0;
    
    const pendingEl = document.getElementById('leavesPendingCount');
    const approvedEl = document.getElementById('leavesApprovedCount');
    const rejectedEl = document.getElementById('leavesRejectedCount');
    const rateEl = document.getElementById('leavesApprovalRate');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
    if (rateEl) rateEl.textContent = approvalRate + '%';
    
    // Leave Status Chart
    const statusChartEl = document.getElementById('leaveStatusChart');
    if (statusChartEl) {
        statusChartEl.innerHTML = `
            <div class="row text-center">
                <div class="col-4">
                    <div class="p-3 bg-warning bg-opacity-10 rounded">
                        <h3 class="text-warning">${pending}</h3>
                        <p class="mb-0 small">Pending</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-3 bg-success bg-opacity-10 rounded">
                        <h3 class="text-success">${approved}</h3>
                        <p class="mb-0 small">Approved</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-3 bg-danger bg-opacity-10 rounded">
                        <h3 class="text-danger">${rejected}</h3>
                        <p class="mb-0 small">Rejected</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Leave by Type Chart
    const typeChartEl = document.getElementById('leaveTypeChart');
    if (typeChartEl) {
        const studentCount = studentLeaves.length;
        const trainerCount = trainerLeaves.length;
        const total = studentCount + trainerCount;
        
        const studentPercent = total > 0 ? Math.round((studentCount / total) * 100) : 0;
        const trainerPercent = 100 - studentPercent;
        
        typeChartEl.innerHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <span><i class="bi bi-people"></i> Student Leaves</span>
                    <span class="badge bg-primary">${studentCount} (${studentPercent}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${studentPercent}%"></div>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <span><i class="bi bi-person-badge"></i> Trainer Leaves</span>
                    <span class="badge bg-success">${trainerCount} (${trainerPercent}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${trainerPercent}%"></div>
                </div>
            </div>
        `;
    }
}

function loadHostelDashboard() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes').length;
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    
    const occupancyEl = document.getElementById('hostelOccupancyCount');
    const morningEl = document.getElementById('hostelMorningFood');
    const nightEl = document.getElementById('hostelNightFood');
    
    if (occupancyEl) occupancyEl.textContent = hostelStudents;
    if (morningEl) morningEl.textContent = menu.morning.selectedCount;
    if (nightEl) nightEl.textContent = menu.night.selectedCount;
    
    // Food Trends
    const trendsEl = document.getElementById('hostelFoodTrends');
    if (trendsEl) {
        trendsEl.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <i class="bi bi-sunrise fs-1 text-warning"></i>
                            <h4 class="mt-2">${menu.morning.selectedCount}</h4>
                            <p class="mb-0">Morning Selections</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <i class="bi bi-moon fs-1 text-info"></i>
                            <h4 class="mt-2">${menu.night.selectedCount}</h4>
                            <p class="mb-0">Night Selections</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadCanteenDashboard() {
    const stock = getCanteenStock();
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const totalSelections = menu.morning.selectedCount + menu.night.selectedCount;
    
    const stockEl = document.getElementById('canteenStockItems');
    const morningEl = document.getElementById('canteenMorningSelections');
    const nightEl = document.getElementById('canteenNightSelections');
    const totalEl = document.getElementById('canteenTotalSelections');
    
    if (stockEl) stockEl.textContent = stock.length;
    if (morningEl) morningEl.textContent = menu.morning.selectedCount;
    if (nightEl) nightEl.textContent = menu.night.selectedCount;
    if (totalEl) totalEl.textContent = totalSelections;
    
    // Stock Levels
    const stockLevelsEl = document.getElementById('stockLevelsDisplay');
    if (stockLevelsEl) {
        if (stock.length === 0) {
            stockLevelsEl.innerHTML = '<p class="text-muted">No stock data available</p>';
        } else {
            let html = '<div class="list-group">';
            stock.forEach(item => {
                html += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${item.item}</strong>
                            <br><small class="text-muted">${item.unit}</small>
                        </div>
                        <span class="badge bg-primary rounded-pill">${item.quantity}</span>
                    </div>
                `;
            });
            html += '</div>';
            stockLevelsEl.innerHTML = html;
        }
    }
    
    // Food Selection Chart
    const selectionChartEl = document.getElementById('foodSelectionChart');
    if (selectionChartEl) {
        const morningPercent = totalSelections > 0 ? Math.round((menu.morning.selectedCount / totalSelections) * 100) : 0;
        const nightPercent = 100 - morningPercent;
        
        selectionChartEl.innerHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <span><i class="bi bi-sunrise"></i> Morning</span>
                    <span class="badge bg-warning">${menu.morning.selectedCount} (${morningPercent}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-warning" role="progressbar" style="width: ${morningPercent}%"></div>
                </div>
            </div>
            <div>
                <div class="d-flex justify-content-between mb-2">
                    <span><i class="bi bi-moon"></i> Night</span>
                    <span class="badge bg-info">${menu.night.selectedCount} (${nightPercent}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${nightPercent}%"></div>
                </div>
            </div>
        `;
    }
}

function loadSystemConnections() {
    // Update connection status
    const students = getStudents();
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    
    const studentDataStatus = document.getElementById('studentDataStatus');
    const trainerDataStatus = document.getElementById('trainerDataStatus');
    
    if (studentDataStatus) {
        studentDataStatus.textContent = `${students.length} Records`;
    }
    if (trainerDataStatus) {
        trainerDataStatus.textContent = `${trainers.length} Records`;
    }
}

