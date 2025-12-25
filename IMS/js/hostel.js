// Hostel Incharge Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'hostel') {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user name
    const userNameElements = document.querySelectorAll('#userName, #userNameTop');
    userNameElements.forEach(el => {
        if (el) el.textContent = currentUser.name;
    });
    
    // Navigation
    document.querySelectorAll('.nav-item-new').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Setup search
    const hostelStudentSearch = document.getElementById('hostelStudentSearch');
    if (hostelStudentSearch) {
        hostelStudentSearch.addEventListener('input', debounce(function() {
            loadHostelStudents();
        }, 300));
    }
    
    const movementSearch = document.getElementById('movementSearch');
    if (movementSearch) {
        movementSearch.addEventListener('input', debounce(function() {
            loadMovementTracking();
        }, 300));
    }
    
    const leaveLetterSearch = document.getElementById('leaveLetterSearch');
    if (leaveLetterSearch) {
        leaveLetterSearch.addEventListener('input', debounce(function() {
            loadLeaveLetters();
        }, 300));
    }
    
    // Load dashboard
    loadDashboard();
    loadHostelStudents();
    loadMovementTracking();
    loadLeaveLetters();
});

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('d-none');
        
        // Update active nav
        document.querySelectorAll('.nav-item-new').forEach(item => {
            item.classList.remove('active');
            const dataSection = item.getAttribute('data-section');
            if (dataSection === sectionName) {
                item.classList.add('active');
            }
        });
        
        // Update page header
        if (typeof updatePageHeader === 'function') {
            updatePageHeader(sectionName);
        }
        
        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'students':
                loadHostelStudents();
                break;
            case 'movement':
                loadMovementTracking();
                break;
            case 'leaves':
                loadLeaveLetters();
                break;
            case 'canteen':
                loadCanteenView();
                break;
        }
    }
}

function loadDashboard() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    
    // Update KPIs
    const totalHostelStudents = document.getElementById('totalHostelStudents');
    const studentsInHostel = document.getElementById('studentsInHostel');
    const pendingMovements = document.getElementById('pendingMovements');
    const pendingLeaveLetters = document.getElementById('pendingLeaveLetters');
    
    if (totalHostelStudents) totalHostelStudents.textContent = hostelStudents.length;
    
    // Count students currently in hostel
    let inHostelCount = 0;
    hostelStudents.forEach(student => {
        if (student.hostel && student.hostel.inTime && !student.hostel.outTime) {
            inHostelCount++;
        }
    });
    if (studentsInHostel) studentsInHostel.textContent = inHostelCount;
    
    // Count pending movements (students with out-time but no in-time today)
    const today = new Date().toISOString().split('T')[0];
    let pendingCount = 0;
    hostelStudents.forEach(student => {
        if (student.hostel && student.hostel.outTime) {
            const lastMovement = student.hostel.movementHistory && student.hostel.movementHistory.length > 0 
                ? student.hostel.movementHistory[student.hostel.movementHistory.length - 1]
                : null;
            if (!lastMovement || lastMovement.date !== today) {
                pendingCount++;
            }
        }
    });
    if (pendingMovements) pendingMovements.textContent = pendingCount;
    
    // Count pending leave letters
    const leaves = getStudentLeaves();
    const pendingLetters = leaves.filter(l => l.leaveLetterReceived === false || l.leaveLetterReceived === undefined).length;
    if (pendingLeaveLetters) pendingLeaveLetters.textContent = pendingLetters;
    
    // Update badges
    const hostelStudentsBadge = document.getElementById('hostelStudentsBadge');
    const pendingLettersBadge = document.getElementById('pendingLettersBadge');
    if (hostelStudentsBadge) hostelStudentsBadge.textContent = hostelStudents.length;
    if (pendingLettersBadge) pendingLettersBadge.textContent = pendingLetters;
    
    // Load recent movements
    loadRecentMovements();
    loadNotifications();
}

function loadHostelStudents() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    const searchTerm = document.getElementById('hostelStudentSearch')?.value.toLowerCase() || '';
    
    const filtered = hostelStudents.filter(s => {
        return s.name.toLowerCase().includes(searchTerm) ||
               s.id.toLowerCase().includes(searchTerm) ||
               (s.mobile && s.mobile.includes(searchTerm));
    });
    
    const tbody = document.getElementById('hostelStudentsTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hostel students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(student => {
        const status = student.hostel && student.hostel.inTime ? 'In Hostel' : 'Out';
        const statusClass = student.hostel && student.hostel.inTime ? 'success' : 'secondary';
        
        return `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.mobile || 'N/A'}</td>
                <td>${student.parentNumber || 'N/A'}</td>
                <td>${student.roomNumber || 'N/A'}</td>
                <td><span class="badge bg-${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showUpdateMovement('${student.id}')">
                        <i class="bi bi-clock"></i> Update Movement
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadMovementTracking() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    const searchTerm = document.getElementById('movementSearch')?.value.toLowerCase() || '';
    
    const filtered = hostelStudents.filter(s => {
        return s.name.toLowerCase().includes(searchTerm) ||
               s.id.toLowerCase().includes(searchTerm);
    });
    
    const tbody = document.getElementById('movementTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No movement records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(student => {
        const inTime = student.hostel?.inTime || 'Not set';
        const outTime = student.hostel?.outTime || 'Not set';
        const lastMovement = student.hostel?.movementHistory && student.hostel.movementHistory.length > 0
            ? student.hostel.movementHistory[student.hostel.movementHistory.length - 1]
            : null;
        const lastMovementText = lastMovement 
            ? `${lastMovement.date} ${lastMovement.type === 'in' ? 'In' : 'Out'}`
            : 'No history';
        const status = student.hostel && student.hostel.inTime && !student.hostel.outTime ? 'In' : 'Out';
        const statusClass = status === 'In' ? 'success' : 'warning';
        
        return `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${inTime}</td>
                <td>${outTime}</td>
                <td>${lastMovementText}</td>
                <td><span class="badge bg-${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showUpdateMovement('${student.id}')">
                        <i class="bi bi-pencil"></i> Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadLeaveLetters() {
    const leaves = getStudentLeaves();
    const searchTerm = document.getElementById('leaveLetterSearch')?.value.toLowerCase() || '';
    const students = getStudents();
    
    const filtered = leaves.filter(leave => {
        const student = students.find(s => s.id === leave.studentId);
        if (!student) return false;
        return student.name.toLowerCase().includes(searchTerm) ||
               leave.studentId.toLowerCase().includes(searchTerm);
    });
    
    const tbody = document.getElementById('leaveLettersTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No leave letters found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(leave => {
        const student = students.find(s => s.id === leave.studentId);
        const received = leave.leaveLetterReceived === true ? 'Yes' : 'No';
        const receivedClass = received === 'Yes' ? 'success' : 'warning';
        const receivedDate = leave.leaveLetterReceivedDate || 'N/A';
        
        return `
            <tr>
                <td>${leave.studentId}</td>
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${leave.fromDate}</td>
                <td>${leave.toDate}</td>
                <td><span class="badge bg-${receivedClass}">${received}</span></td>
                <td>${receivedDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showUpdateLeaveLetter('${leave.id}')">
                        <i class="bi bi-pencil"></i> Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showUpdateMovement(studentId) {
    const student = getStudentById(studentId);
    if (!student) {
        Toast.error('Student not found');
        return;
    }
    
    document.getElementById('movementStudentId').value = studentId;
    document.getElementById('movementStudentName').value = `${student.name} (${student.id})`;
    document.getElementById('movementInTime').value = student.hostel?.inTime || '';
    document.getElementById('movementOutTime').value = student.hostel?.outTime || '';
    document.getElementById('movementStatus').value = student.hostel && student.hostel.inTime && !student.hostel.outTime ? 'in' : 'out';
    
    const modal = new bootstrap.Modal(document.getElementById('updateMovementModal'));
    modal.show();
}

function saveMovement() {
    const studentId = document.getElementById('movementStudentId').value;
    const inTime = document.getElementById('movementInTime').value;
    const outTime = document.getElementById('movementOutTime').value;
    const status = document.getElementById('movementStatus').value;
    
    if (!studentId) {
        Toast.error('Student ID is required');
        return;
    }
    
    const student = getStudentById(studentId);
    if (!student) {
        Toast.error('Student not found');
        return;
    }
    
    if (!student.hostel) {
        student.hostel = {
            inTime: '',
            outTime: '',
            movementHistory: []
        };
    }
    
    // Update times
    student.hostel.inTime = inTime;
    student.hostel.outTime = outTime;
    
    // Add to movement history
    const today = new Date().toISOString().split('T')[0];
    if (!student.hostel.movementHistory) {
        student.hostel.movementHistory = [];
    }
    
    // Add movement record
    student.hostel.movementHistory.push({
        date: today,
        time: new Date().toLocaleTimeString(),
        type: status,
        inTime: status === 'in' ? inTime : null,
        outTime: status === 'out' ? outTime : null
    });
    
    // Keep only last 30 days of history
    if (student.hostel.movementHistory.length > 30) {
        student.hostel.movementHistory = student.hostel.movementHistory.slice(-30);
    }
    
    saveStudent(student);
    
    Toast.success('Movement updated successfully');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateMovementModal'));
    modal.hide();
    
    loadMovementTracking();
    loadDashboard();
}

function showUpdateLeaveLetter(leaveId) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) {
        Toast.error('Leave not found');
        return;
    }
    
    const students = getStudents();
    const student = students.find(s => s.id === leave.studentId);
    
    document.getElementById('leaveLetterId').value = leaveId;
    document.getElementById('leaveLetterStudentName').value = student ? `${student.name} (${leave.studentId})` : leave.studentId;
    document.getElementById('leaveLetterPeriod').value = `${leave.fromDate} to ${leave.toDate}`;
    document.getElementById('leaveLetterReceived').value = leave.leaveLetterReceived === true ? 'true' : 'false';
    document.getElementById('leaveLetterReceivedDate').value = leave.leaveLetterReceivedDate || '';
    
    const modal = new bootstrap.Modal(document.getElementById('updateLeaveLetterModal'));
    modal.show();
}

function saveLeaveLetter() {
    const leaveId = document.getElementById('leaveLetterId').value;
    const received = document.getElementById('leaveLetterReceived').value === 'true';
    const receivedDate = document.getElementById('leaveLetterReceivedDate').value;
    
    if (!leaveId) {
        Toast.error('Leave ID is required');
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) {
        Toast.error('Leave not found');
        return;
    }
    
    leave.leaveLetterReceived = received;
    if (received && receivedDate) {
        leave.leaveLetterReceivedDate = receivedDate;
    } else if (!received) {
        leave.leaveLetterReceivedDate = '';
    }
    
    saveStudentLeave(leave);
    
    Toast.success('Leave letter status updated successfully');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateLeaveLetterModal'));
    modal.hide();
    
    loadLeaveLetters();
    loadDashboard();
}

function loadCanteenView() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    
    // Display menu
    const menuDisplay = document.getElementById('canteenMenuDisplay');
    if (menuDisplay) {
        let html = '<div class="row">';
        html += '<div class="col-md-6">';
        html += '<h6><i class="bi bi-sunrise"></i> Morning Menu</h6>';
        html += '<ul>';
        if (menu.morning.items.length > 0) {
            menu.morning.items.forEach(item => {
                html += `<li>${item}</li>`;
            });
        } else {
            html += '<li class="text-muted">No menu set</li>';
        }
        html += '</ul></div>';
        
        html += '<div class="col-md-6">';
        html += '<h6><i class="bi bi-moon"></i> Night Menu</h6>';
        html += '<ul>';
        if (menu.night.items.length > 0) {
            menu.night.items.forEach(item => {
                html += `<li>${item}</li>`;
            });
        } else {
            html += '<li class="text-muted">No menu set</li>';
        }
        html += '</ul></div></div>';
        
        menuDisplay.innerHTML = html;
    }
    
    // Display counts
    const countDisplay = document.getElementById('canteenCountDisplay');
    if (countDisplay) {
        countDisplay.innerHTML = `
            <p><strong>Morning Selections:</strong> ${menu.morning.selectedCount}</p>
            <p><strong>Night Selections:</strong> ${menu.night.selectedCount}</p>
            <p><strong>Total Selections:</strong> ${menu.morning.selectedCount + menu.night.selectedCount}</p>
        `;
    }
}

function loadRecentMovements() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    
    const recentMovements = [];
    hostelStudents.forEach(student => {
        if (student.hostel && student.hostel.movementHistory && student.hostel.movementHistory.length > 0) {
            const lastMovement = student.hostel.movementHistory[student.hostel.movementHistory.length - 1];
            recentMovements.push({
                student: student,
                movement: lastMovement
            });
        }
    });
    
    // Sort by date/time (most recent first)
    recentMovements.sort((a, b) => {
        const dateA = new Date(`${a.movement.date} ${a.movement.time}`);
        const dateB = new Date(`${b.movement.date} ${b.movement.time}`);
        return dateB - dateA;
    });
    
    const display = document.getElementById('recentMovements');
    if (!display) return;
    
    if (recentMovements.length === 0) {
        display.innerHTML = '<p class="text-muted">No recent movements</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    recentMovements.slice(0, 5).forEach(item => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${item.student.name}</strong>
                        <br><small class="text-muted">${item.movement.date} ${item.movement.time}</small>
                    </div>
                    <span class="badge bg-${item.movement.type === 'in' ? 'success' : 'warning'}">${item.movement.type === 'in' ? 'In' : 'Out'}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    display.innerHTML = html;
}

function loadNotifications() {
    const leaves = getStudentLeaves();
    const pendingLetters = leaves.filter(l => l.leaveLetterReceived === false || l.leaveLetterReceived === undefined);
    
    const display = document.getElementById('hostelNotifications');
    if (!display) return;
    
    if (pendingLetters.length === 0) {
        display.innerHTML = '<p class="text-muted">No pending notifications</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    pendingLetters.slice(0, 5).forEach(leave => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>Leave Letter Pending</strong>
                        <br><small class="text-muted">Student ID: ${leave.studentId}</small>
                    </div>
                    <span class="badge bg-warning">Pending</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    display.innerHTML = html;
}

function refreshHostelData() {
    loadDashboard();
    loadHostelStudents();
    loadMovementTracking();
    loadLeaveLetters();
    Toast.success('Data refreshed');
}

function exportHostelData() {
    const students = getStudents();
    const hostelStudents = students.filter(s => s.hostelStatus === 'Yes');
    
    const data = hostelStudents.map(s => ({
        'Student ID': s.id,
        'Name': s.name,
        'Mobile': s.mobile || '',
        'Parent Number': s.parentNumber || '',
        'In-Time': s.hostel?.inTime || '',
        'Out-Time': s.hostel?.outTime || '',
        'Status': s.hostel && s.hostel.inTime && !s.hostel.outTime ? 'In Hostel' : 'Out'
    }));
    
    const csv = convertToCSV(data);
    downloadFile(csv, 'hostel-data.csv', 'text/csv');
    Toast.success('Hostel data exported successfully');
}

// Helper function for debounce
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


