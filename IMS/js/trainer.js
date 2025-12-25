// Trainer Dashboard Functionality
let currentUser = null;
let sessionAttendanceRecords = JSON.parse(localStorage.getItem('sessionAttendanceRecords') || '{}');

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'trainer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user name in sidebar and top navbar
    const userNameElements = document.querySelectorAll('#userName, #userNameTop');
    userNameElements.forEach(el => {
        if (el) el.textContent = currentUser.name;
    });
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const attendanceDateField = document.getElementById('attendanceDate');
    const foodSelectionDateField = document.getElementById('foodSelectionDate');
    if (attendanceDateField) attendanceDateField.value = today;
    if (foodSelectionDateField) foodSelectionDateField.value = today;
    
    // Navigation - Support both old and new nav structure
    document.querySelectorAll('.nav-link, .nav-item-new').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Load dashboard
    loadDashboard();
    loadClasses();
    loadStudents();
    loadAttendance();
    loadFoodSelection();
    loadLeaves();
});

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('d-none');
        
        // Update active nav item
        document.querySelectorAll('.nav-item-new, .nav-link').forEach(item => {
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
        
        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'attendance':
                loadAttendance();
                break;
            case 'classes':
                loadClasses();
                break;
            case 'students':
                loadStudents();
                break;
            case 'leaves':
                loadLeaves();
                break;
            case 'food':
                loadFoodSelection();
                break;
        }
    }
}

function loadDashboard() {
    const students = getStudents();
    const myStudents = students.filter(s => s.currentBatch && s.currentBatch.includes('Full Stack'));
    document.getElementById('myStudents').textContent = myStudents.length;
    
    // Count pending leaves (Level 0) for trainer approval
    const studentLeaves = getStudentLeaves();
    const pendingLeaves = studentLeaves.filter(l => (l.approvalLevel === 0 || l.approvalLevel === undefined) && l.approvalStatus !== 'Rejected').length;
    document.getElementById('pendingLeaves').textContent = pendingLeaves;
    
    // Count food selections
    const today = new Date().toISOString().split('T')[0];
    const trainerSelections = JSON.parse(localStorage.getItem('trainerFoodSelections') || '{}');
    const dateSelections = trainerSelections[today] || {};
    const mySelection = dateSelections[currentUser.username];
    let selectionCount = 0;
    if (mySelection) {
        if (mySelection.morning) selectionCount++;
        if (mySelection.night) selectionCount++;
    }
    document.getElementById('foodSelections').textContent = selectionCount;
    
    // Load food menu
    loadFoodMenuDisplay();
}

function loadFoodMenuDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    
    let menuHtml = '<div class="row">';
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card morning">';
    menuHtml += '<h6><i class="bi bi-sunrise"></i> Morning Menu</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.morning.items.length > 0) {
        menu.morning.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '<div class="mt-2"><strong>Total Count: ' + menu.morning.selectedCount + '</strong></div>';
    menuHtml += '</div></div></div>';
    
    menuHtml += '<div class="col-md-6">';
    menuHtml += '<div class="food-menu-card night">';
    menuHtml += '<h6><i class="bi bi-moon"></i> Night Menu</h6>';
    menuHtml += '<div class="food-items">';
    if (menu.night.items.length > 0) {
        menu.night.items.forEach(item => {
            menuHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        menuHtml += '<p class="text-muted">No menu set for today</p>';
    }
    menuHtml += '<div class="mt-2"><strong>Total Count: ' + menu.night.selectedCount + '</strong></div>';
    menuHtml += '</div></div></div>';
    menuHtml += '</div>';
    
    document.getElementById('foodMenuDisplay').innerHTML = menuHtml;
}

function loadAttendance() {
    const date = document.getElementById('attendanceDate').value || new Date().toISOString().split('T')[0];
    const dateRecord = sessionAttendanceRecords[date] || { 
        onlineAttendanceDone: '', 
        offlineAttendanceDone: '',
        date: date,
        locked: false
    };
    
    // Set current status
    const onlineSelect = document.getElementById('onlineAttendanceDone');
    const offlineSelect = document.getElementById('offlineAttendanceDone');
    
    if (onlineSelect) onlineSelect.value = dateRecord.onlineAttendanceDone || '';
    if (offlineSelect) offlineSelect.value = dateRecord.offlineAttendanceDone || '';
    
    // Disable if locked
    if (dateRecord.locked === true) {
        if (onlineSelect) onlineSelect.disabled = true;
        if (offlineSelect) offlineSelect.disabled = true;
    } else {
        if (onlineSelect) onlineSelect.disabled = false;
        if (offlineSelect) offlineSelect.disabled = false;
    }
    
    // Display current status
    const statusDisplay = document.getElementById('attendanceStatusDisplay');
    if (statusDisplay) {
        let statusHtml = '<div class="mt-3">';
        if (dateRecord.locked === true) {
            statusHtml += '<div class="alert alert-warning">';
            statusHtml += '<i class="bi bi-lock"></i> <strong>Attendance Locked:</strong> This attendance has been submitted and is locked.';
            statusHtml += '</div>';
        }
        
        if (dateRecord.onlineAttendanceDone || dateRecord.offlineAttendanceDone) {
            statusHtml += '<h6>Current Status:</h6>';
            statusHtml += '<div class="mb-2">';
            statusHtml += `<strong>Online Attendance:</strong> `;
            const onlineBadge = dateRecord.onlineAttendanceDone === 'yes' ? 'bg-success' : dateRecord.onlineAttendanceDone === 'no' ? 'bg-danger' : 'bg-secondary';
            const onlineText = dateRecord.onlineAttendanceDone === 'yes' ? 'Done' : dateRecord.onlineAttendanceDone === 'no' ? 'Not Done' : 'Not Set';
            statusHtml += `<span class="badge ${onlineBadge}">${onlineText}</span>`;
            statusHtml += '</div>';
            statusHtml += '<div class="mb-2">';
            statusHtml += `<strong>Offline Attendance:</strong> `;
            const offlineBadge = dateRecord.offlineAttendanceDone === 'yes' ? 'bg-success' : dateRecord.offlineAttendanceDone === 'no' ? 'bg-danger' : 'bg-secondary';
            const offlineText = dateRecord.offlineAttendanceDone === 'yes' ? 'Done' : dateRecord.offlineAttendanceDone === 'no' ? 'Not Done' : 'Not Set';
            statusHtml += `<span class="badge ${offlineBadge}">${offlineText}</span>`;
            statusHtml += '</div>';
        } else {
            statusHtml += '<span class="badge bg-secondary p-2">No attendance recorded for this date</span>';
        }
        statusHtml += '</div>';
        statusDisplay.innerHTML = statusHtml;
    }
}

function saveAttendance() {
    const date = document.getElementById('attendanceDate').value || new Date().toISOString().split('T')[0];
    const onlineAttendanceDone = document.getElementById('onlineAttendanceDone').value;
    const offlineAttendanceDone = document.getElementById('offlineAttendanceDone').value;
    
    if (!onlineAttendanceDone || !offlineAttendanceDone) {
        Toast.error('Please select both online and offline attendance status');
        return;
    }
    
    // Check if attendance is already locked
    const existingRecord = sessionAttendanceRecords[date];
    if (existingRecord && existingRecord.locked === true) {
        Toast.error('Attendance for this date is locked and cannot be modified');
        return;
    }
    
    sessionAttendanceRecords[date] = {
        onlineAttendanceDone: onlineAttendanceDone,
        offlineAttendanceDone: offlineAttendanceDone,
        date: date,
        trainerId: currentUser.username,
        trainerName: currentUser.name,
        updatedAt: new Date().toISOString(),
        locked: true // Lock after submission
    };
    
    localStorage.setItem('sessionAttendanceRecords', JSON.stringify(sessionAttendanceRecords));
    
    // Log action
    logAction('attendance_submit', {
        date: date,
        online: onlineAttendanceDone,
        offline: offlineAttendanceDone
    });
    
    loadAttendance();
    Toast.success('Attendance saved and locked successfully');
}

function loadClasses() {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const students = getStudents();
    
    // Get batches assigned to this trainer
    const trainerBatches = [...new Set(students
        .filter(s => s.currentBatch)
        .map(s => s.currentBatch)
    )];
    
    // Filter classes for this trainer (by trainerId or by batch assignment)
    let classesToShow = allClasses.filter(cls => {
        // Show if trainerId matches OR if batch is assigned to trainer
        return cls.trainerId === currentUser.username || 
               (cls.batch && trainerBatches.includes(cls.batch));
    });
    
    // Apply filters
    const filterDate = document.getElementById('filterDate')?.value;
    const filterBatch = document.getElementById('filterBatch')?.value?.toLowerCase();
    const filterTime = document.getElementById('filterTime')?.value?.toLowerCase();
    
    if (filterDate || filterBatch || filterTime) {
        classesToShow = classesToShow.filter(cls => {
            if (filterDate && cls.date && cls.date !== filterDate) return false;
            if (filterBatch && !cls.batch?.toLowerCase().includes(filterBatch)) return false;
            if (filterTime && !cls.time?.toLowerCase().includes(filterTime) && !cls.schedule?.toLowerCase().includes(filterTime)) return false;
            return true;
        });
    }
    
    const tbody = document.getElementById('classesTableBody');
    if (!tbody) return;
    
    if (classesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No classes found. Create a new schedule to get started.</td></tr>';
        return;
    }
    
    tbody.innerHTML = classesToShow.map(cls => {
        const isLocked = cls.status === 'completed' || cls.locked === true;
        const statusBadge = cls.status === 'completed' ? 'bg-success' : 
                           cls.status === 'cancelled' ? 'bg-danger' : 'bg-primary';
        const statusText = cls.status === 'completed' ? 'Completed (Locked)' : 
                          cls.status === 'cancelled' ? 'Cancelled' : 'Scheduled';
        
        return `
            <tr>
                <td>${cls.name || 'N/A'}</td>
                <td>${cls.date || cls.schedule || 'N/A'}</td>
                <td>${cls.time || cls.schedule || 'N/A'}</td>
                <td>${cls.batch || 'N/A'}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td>
                    ${!isLocked ? `
                        <button class="btn btn-sm btn-primary" onclick="editClassSchedule('${cls.id}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteClassSchedule('${cls.id}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    ` : `
                        <span class="text-muted"><i class="bi bi-lock"></i> Locked</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function filterClasses() {
    loadClasses();
}

function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterBatch').value = '';
    document.getElementById('filterTime').value = '';
    loadClasses();
}

// Schedule Management Functions
function showAddClassModal() {
    document.getElementById('addClassForm').reset();
    document.getElementById('classId').value = '';
    document.getElementById('classDate').value = new Date().toISOString().split('T')[0];
    
    // Populate batch dropdown with trainer's batches
    const students = getStudents();
    const trainerBatches = [...new Set(students
        .filter(s => s.currentBatch)
        .map(s => s.currentBatch)
    )];
    
    const batchSelect = document.getElementById('classBatch');
    if (batchSelect) {
        batchSelect.innerHTML = '<option value="">Select Batch</option>' + 
            trainerBatches.map(batch => `<option value="${batch}">${batch}</option>`).join('');
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

function editClassSchedule(classId) {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const cls = allClasses.find(c => c.id === classId);
    
    if (!cls) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Schedule not found');
        }
        return;
    }
    
    // Check if schedule is locked
    if (cls.status === 'completed' || cls.locked === true) {
        if (typeof Toast !== 'undefined') {
            Toast.warning('This schedule is locked and cannot be edited');
        }
        return;
    }
    
    // Populate form
    document.getElementById('classId').value = cls.id;
    document.getElementById('className').value = cls.name || cls.topic || '';
    document.getElementById('classDate').value = cls.date || '';
    document.getElementById('classTime').value = cls.time || '';
    document.getElementById('classStatus').value = cls.status || 'scheduled';
    
    // Populate batch dropdown
    const students = getStudents();
    const trainerBatches = [...new Set(students
        .filter(s => s.currentBatch)
        .map(s => s.currentBatch)
    )];
    
    const batchSelect = document.getElementById('classBatch');
    if (batchSelect) {
        batchSelect.innerHTML = '<option value="">Select Batch</option>' + 
            trainerBatches.map(batch => `<option value="${batch}" ${batch === cls.batch ? 'selected' : ''}>${batch}</option>`).join('');
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

function saveClassSchedule() {
    const classId = document.getElementById('classId').value;
    const className = document.getElementById('className').value;
    const classDate = document.getElementById('classDate').value;
    const classTime = document.getElementById('classTime').value;
    const classBatch = document.getElementById('classBatch').value;
    const classStatus = document.getElementById('classStatus').value;
    
    if (!className || !classDate || !classTime || !classBatch) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Please fill in all required fields');
        }
        return;
    }
    
    let allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    
    if (classId) {
        // Edit existing
        const index = allClasses.findIndex(c => c.id === classId);
        if (index >= 0) {
            // Check if schedule is locked
            if (allClasses[index].status === 'completed' || allClasses[index].locked === true) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('This schedule is locked and cannot be edited');
                }
                return;
            }
            
            allClasses[index] = {
                ...allClasses[index],
                name: className,
                topic: className,
                date: classDate,
                time: classTime,
                batch: classBatch,
                status: classStatus,
                locked: classStatus === 'completed' ? true : false,
                trainerId: currentUser.username,
                trainerName: currentUser.name
            };
        }
    } else {
        // Add new
        const newClass = {
            id: 'CLASS' + Date.now(),
            name: className,
            topic: className,
            date: classDate,
            time: classTime,
            batch: classBatch,
            status: classStatus,
            locked: classStatus === 'completed' ? true : false,
            trainerId: currentUser.username,
            trainerName: currentUser.name,
            createdAt: new Date().toISOString()
        };
        allClasses.push(newClass);
    }
    
    localStorage.setItem('allClasses', JSON.stringify(allClasses));
    
    // Log action
    if (typeof logAction !== 'undefined') {
        logAction(classId ? 'schedule_updated' : 'schedule_created', {
            classId: classId || 'NEW',
            className: className,
            date: classDate,
            batch: classBatch
        });
    }
    
    if (typeof Toast !== 'undefined') {
        Toast.success(classId ? 'Schedule updated successfully' : 'Schedule created successfully');
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
    if (modal) modal.hide();
    
    loadClasses();
    loadDashboard();
}

async function deleteClassSchedule(classId) {
    const allClasses = JSON.parse(localStorage.getItem('allClasses') || '[]');
    const cls = allClasses.find(c => c.id === classId);
    
    if (!cls) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Schedule not found');
        }
        return;
    }
    
    // Check if schedule is locked
    if (cls.status === 'completed' || cls.locked === true) {
        if (typeof Toast !== 'undefined') {
            Toast.warning('This schedule is locked and cannot be deleted');
        }
        return;
    }
    
    const confirmed = typeof ConfirmDialog !== 'undefined'
        ? await ConfirmDialog.show('Are you sure you want to delete this schedule?', 'Confirm Deletion')
        : confirm('Are you sure you want to delete this schedule?');
    
    if (!confirmed) return;
    
    const filtered = allClasses.filter(c => c.id !== classId);
    localStorage.setItem('allClasses', JSON.stringify(filtered));
    
    // Log action
    if (typeof logAction !== 'undefined') {
        logAction('schedule_deleted', {
            classId: classId,
            className: cls.name || cls.topic
        });
    }
    
    if (typeof Toast !== 'undefined') {
        Toast.success('Schedule deleted successfully');
    }
    
    loadClasses();
    loadDashboard();
}

function loadStudents() {
    const students = getStudents();
    const filterBatch = document.getElementById('filterBatchStudents')?.value;
    
    // Filter by batch if selected
    let filteredStudents = students;
    if (filterBatch) {
        filteredStudents = students.filter(s => s.currentBatch === filterBatch || s.batchNumber === filterBatch);
    }
    
    // Populate batch filter dropdown
    const batchSelect = document.getElementById('filterBatchStudents');
    const batches = [...new Set(students.map(s => s.currentBatch).filter(Boolean))];
    batchSelect.innerHTML = '<option value="">All Batches</option>' + batches.map(batch => 
        `<option value="${batch}">${batch}</option>`
    ).join('');
    if (filterBatch) {
        batchSelect.value = filterBatch;
    }
    
    const tbody = document.getElementById('studentsTableBody');
    
    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.mobile}</td>
            <td>
                ${student.parentNumber ? `<a href="tel:${student.parentNumber}" class="btn btn-sm btn-success"><i class="bi bi-telephone"></i> ${student.parentNumber}</a>` : 'N/A'}
            </td>
            <td>${student.currentBatch || 'N/A'}</td>
            <td>${student.currentBatchId || student.batchNumber || 'N/A'}</td>
            <td><span class="badge ${student.hostelStatus === 'Yes' ? 'bg-success' : 'bg-secondary'}">${student.hostelStatus}</span></td>
            <td>${student.location || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudentDetails('${student.id}')">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

function viewStudentDetails(studentId) {
    const student = getStudentById(studentId);
    if (!student) {
        alert('Student not found');
        return;
    }
    
    let detailsHtml = '<div class="row">';
    detailsHtml += '<div class="col-md-6">';
    detailsHtml += '<table class="table table-bordered">';
    detailsHtml += `<tr><th>Student ID</th><td>${student.id}</td></tr>`;
    detailsHtml += `<tr><th>Name</th><td>${student.name}</td></tr>`;
    detailsHtml += `<tr><th>Mobile</th><td>${student.mobile}</td></tr>`;
    if (student.parentNumber) {
        detailsHtml += `<tr><th>Parent Number</th><td><a href="tel:${student.parentNumber}" class="btn btn-sm btn-success"><i class="bi bi-telephone"></i> ${student.parentNumber}</a></td></tr>`;
    }
    detailsHtml += `<tr><th>Batch Number</th><td>${student.batchNumber}</td></tr>`;
    detailsHtml += `<tr><th>Current Batch</th><td>${student.currentBatch}</td></tr>`;
    detailsHtml += `<tr><th>Current Batch ID</th><td>${student.currentBatchId || student.batchNumber}</td></tr>`;
    detailsHtml += `<tr><th>Hostel Status</th><td>${student.hostelStatus}</td></tr>`;
    detailsHtml += `<tr><th>Location</th><td>${student.location || 'N/A'}</td></tr>`;
    detailsHtml += '</table>';
    detailsHtml += '</div></div>';
    
    document.getElementById('studentDetailsDisplay').innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
    modal.show();
}

function loadFoodSelection() {
    const date = document.getElementById('foodSelectionDate').value || new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(date);
    const trainerSelections = JSON.parse(localStorage.getItem('trainerFoodSelections') || '{}');
    const dateSelections = trainerSelections[date] || {};
    const mySelection = dateSelections[currentUser.username] || { morning: '', night: '' };
    
    // Display menu items
    let morningHtml = '';
    if (menu.morning.items.length > 0) {
        menu.morning.items.forEach(item => {
            morningHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        morningHtml = '<p class="text-muted">No menu set</p>';
    }
    document.getElementById('morningMenuItems').innerHTML = morningHtml + '<div class="mt-2"><strong>Total Count: ' + menu.morning.selectedCount + '</strong></div>';
    
    let nightHtml = '';
    if (menu.night.items.length > 0) {
        menu.night.items.forEach(item => {
            nightHtml += `<div class="food-item">${item}</div>`;
        });
    } else {
        nightHtml = '<p class="text-muted">No menu set</p>';
    }
    document.getElementById('nightMenuItems').innerHTML = nightHtml + '<div class="mt-2"><strong>Total Count: ' + menu.night.selectedCount + '</strong></div>';
    
    // Set current selection
    document.getElementById('trainerMorningSelection').value = mySelection.morning;
    document.getElementById('trainerNightSelection').value = mySelection.night;
}

function saveTrainerFoodSelection() {
    const date = document.getElementById('foodSelectionDate').value || new Date().toISOString().split('T')[0];
    const morning = document.getElementById('trainerMorningSelection').value;
    const night = document.getElementById('trainerNightSelection').value;
    
    if (!morning || !night) {
        return; // Don't save if not both selected
    }
    
    const trainerSelections = JSON.parse(localStorage.getItem('trainerFoodSelections') || '{}');
    if (!trainerSelections[date]) {
        trainerSelections[date] = {};
    }
    trainerSelections[date][currentUser.username] = {
        morning: morning,
        night: night,
        trainerName: currentUser.name
    };
    localStorage.setItem('trainerFoodSelections', JSON.stringify(trainerSelections));
    
    // Update counts
    updateFoodCounts(date);
    
    loadFoodSelection();
    loadDashboard();
    alert('Food selection saved. Your vote is included in the total count.');
}

function loadLeaves() {
    const leaves = getStudentLeaves();
    
    // Get all leaves for trainer (Level 0 only - pending trainer approval)
    const trainerLeaves = leaves.filter(l => 
        (l.approvalLevel === 0 || l.approvalLevel === undefined) &&
        (l.trainerApprovedBy === currentUser.name || l.approvalLevel === 0 || l.approvalLevel === undefined)
    );
    
    // Separate into approved, rejected, and pending
    const approvedLeaves = trainerLeaves.filter(l => (l.approvalLevel === 1 || l.approvalLevel === 2 || l.approvalLevel === 3 || l.approvalLevel === 4) && l.approvalStatus !== 'Rejected');
    const rejectedLeaves = trainerLeaves.filter(l => l.approvalStatus === 'Rejected');
    const pendingLeaves = trainerLeaves.filter(l => (l.approvalLevel === 0 || l.approvalLevel === undefined) && l.approvalStatus !== 'Rejected');
    
    // Populate with Accordions
    if (typeof renderLeaveAccordion !== 'undefined') {
        renderLeaveAccordion(approvedLeaves, 'approvedLeavesAccordion', 'trainer');
        renderLeaveAccordion(rejectedLeaves, 'rejectedLeavesAccordion', 'trainer');
        renderLeaveAccordion(pendingLeaves, 'pendingLeavesAccordion', 'trainer');
    } else {
        // Fallback to table format
        const approvedTbody = document.getElementById('approvedLeavesTableBody');
        const rejectedTbody = document.getElementById('rejectedLeavesTableBody');
        const pendingTbody = document.getElementById('pendingLeavesTableBody');
        
        if (approvedTbody) {
            approvedTbody.innerHTML = approvedLeaves.length === 0 
                ? '<tr><td colspan="7" class="text-center text-muted">No approved leaves</td></tr>'
                : approvedLeaves.map(leave => `
                    <tr>
                        <td>${leave.studentId}</td>
                        <td>${leave.studentName}</td>
                        <td>${leave.fromDate}</td>
                        <td>${leave.toDate}</td>
                        <td>${leave.reason}</td>
                        <td><span class="badge bg-success">Level 1 Approved</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `).join('');
        }
        
        if (rejectedTbody) {
            rejectedTbody.innerHTML = rejectedLeaves.length === 0 
                ? '<tr><td colspan="7" class="text-center text-muted">No rejected leaves</td></tr>'
                : rejectedLeaves.map(leave => `
                    <tr>
                        <td>${leave.studentId}</td>
                        <td>${leave.studentName}</td>
                        <td>${leave.fromDate}</td>
                        <td>${leave.toDate}</td>
                        <td>${leave.reason}</td>
                        <td><span class="badge bg-danger">Rejected</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `).join('');
        }
        
        if (pendingTbody) {
            pendingTbody.innerHTML = pendingLeaves.length === 0 
                ? '<tr><td colspan="7" class="text-center text-muted">No pending student leave applications for approval</td></tr>'
                : pendingLeaves.map(leave => `
                    <tr>
                        <td>${leave.studentId}</td>
                        <td>${leave.studentName}</td>
                        <td>${leave.fromDate}</td>
                        <td>${leave.toDate}</td>
                        <td>${leave.reason}</td>
                        <td><span class="badge bg-warning">Pending Level 1</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-success" onclick="approveLeaveLevel1('${leave.id}')">
                                <i class="bi bi-check-circle"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                                <i class="bi bi-x-circle"></i> Reject
                            </button>
                        </td>
                    </tr>
                `).join('');
        }
    }
}

function viewLeaveDetails(leaveId) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    let details = `Leave Details:\n\nStudent: ${leave.studentName} (${leave.studentId})\nFrom: ${leave.fromDate}\nTo: ${leave.toDate}\nReason: ${leave.reason}\nApplied: ${leave.appliedDate}\n\n`;
    details += `Status: ${leave.approvalStatus || 'Pending'}\n`;
    details += `Approval Level: ${leave.approvalLevel || 0} (Level 1 - Trainer Approval)`;
    
    alert(details);
}

function approveLeaveLevel1(leaveId) {
    if (!confirm('Approve this leave at Level 1 (Trainer Approval)?\n\nThis will forward the leave request to MIS for Level 2 approval.')) {
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    leave.approvalLevel = 1;
    leave.trainerApproved = true;
    leave.trainerApprovedBy = currentUser.name;
    leave.trainerApprovedDate = new Date().toISOString().split('T')[0];
    leave.approvalStatus = 'Trainer Approved - Forwarded to MIS';
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
    
    // Log action
    logAction('leave_approval_level1', {
        leaveId: leaveId,
        studentId: leave.studentId
    });
    
    loadLeaves();
    loadDashboard();
    if (typeof Toast !== 'undefined') {
        Toast.success('Leave approved at Level 1. The request has been forwarded to MIS for Level 2 approval.');
    } else {
        alert('Leave approved at Level 1. The request has been forwarded to MIS for Level 2 approval.');
    }
}

function rejectLeave(leaveId) {
    if (!confirm('Reject this leave application?\n\nRejected leaves will not be forwarded to MIS.')) {
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;
    
    leave.approvalStatus = 'Rejected';
    leave.approvalLevel = -1;
    
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    localStorage.setItem('studentLeaves', JSON.stringify(leaves));
    
    loadLeaves();
    loadDashboard();
    alert('Leave application rejected.');
}
