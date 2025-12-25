// Authentication and Session Management
const users = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin Manager' },
    trainer: { username: 'trainer', password: 'trainer123', role: 'trainer', name: 'John Trainer' },
    qis: { username: 'qis', password: 'qis123', role: 'qis', name: 'QIS Officer' },
    mis: { username: 'mis', password: 'mis123', role: 'mis', name: 'MIS Officer' },
    hostel: { username: 'hostel', password: 'hostel123', role: 'hostel', name: 'Hostel Incharge' },
    canteen: { username: 'canteen', password: 'canteen123', role: 'canteen', name: 'Canteen Incharge' },
    student: { username: 'STU001', password: 'student123', role: 'student', name: 'Rajesh Kumar', studentId: 'STU001' }
};

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    const errorAlert = document.getElementById('errorAlert');
    
    // Validate role selection
    if (!role) {
        errorAlert.textContent = 'Please select a role';
        errorAlert.classList.remove('d-none');
        return;
    }
    
    // Check if user exists and credentials match
    let user = users[role];
    
    // For students, check against student records
    if (role === 'student') {
        // Import getStudents function from data.js (will be available after data.js loads)
        if (typeof getStudents === 'function') {
            const students = getStudents();
            const student = students.find(s => s.id === username);
            if (student && username === student.id && password === 'student123') {
                user = {
                    username: student.id,
                    role: 'student',
                    name: student.name,
                    studentId: student.id
                };
            } else {
                user = null;
            }
        } else {
            // Fallback for initial load
            if (username === 'STU001' && password === 'student123') {
                user = {
                    username: 'STU001',
                    role: 'student',
                    name: 'Rajesh Kumar',
                    studentId: 'STU001'
                };
            } else {
                user = null;
            }
        }
    }
    
    if (user && user.username === username && (role !== 'student' || password === 'student123')) {
        // Show loading state
        const loginButton = document.getElementById('loginButton');
        const originalText = loginButton.innerHTML;
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        
        // Store session
        const sessionData = {
            username: user.username,
            role: user.role,
            name: user.name,
            studentId: user.studentId || user.username,
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        
        // Log login action (after session is set so logAction can access it)
        // Use direct storage here since logAction needs sessionStorage
        const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            user: user.username,
            role: user.role,
            action: 'login',
            details: { loginTime: sessionData.loginTime }
        });
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }
        
        localStorage.setItem('auditLogs', JSON.stringify(logs));
        
        // Show success message
        if (typeof Toast !== 'undefined') {
            Toast.success('Login successful! Redirecting...', 2000);
        }
        
        // Redirect based on role with slight delay for better UX
        setTimeout(() => {
            switch(role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'trainer':
                    window.location.href = 'trainer-dashboard.html';
                    break;
                case 'qis':
                    // QIS merged into MIS - redirect to MIS dashboard
                    window.location.href = 'mis-dashboard.html';
                    break;
                case 'mis':
                    window.location.href = 'mis-dashboard.html';
                    break;
                case 'hostel':
                    window.location.href = 'hostel-dashboard.html';
                    break;
                case 'canteen':
                    window.location.href = 'canteen-dashboard.html';
                    break;
                case 'student':
                    window.location.href = 'student-dashboard.html';
                    break;
            }
        }, 500);
    } else {
        if (typeof Toast !== 'undefined') {
            Toast.error('Invalid username, password, or role mismatch');
        } else {
            errorAlert.textContent = 'Invalid username, password, or role mismatch';
            errorAlert.classList.remove('d-none');
        }
    }
});

// Check if user is logged in (for dashboard pages)
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Centralized action logging function
function logAction(actionType, details = {}) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!currentUser.username) return;
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        user: currentUser.username,
        role: currentUser.role || currentUser.userRole,
        action: actionType,
        details: details
    };
    
    // Use centralized audit log function if available, otherwise use direct storage
    if (typeof saveAuditLog === 'function') {
        saveAuditLog(logEntry);
    } else {
        const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }
        
        localStorage.setItem('auditLogs', JSON.stringify(logs));
    }
}

// Logout function
function logout() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // Log logout action
    if (currentUser.username) {
        logAction('logout', { 
            loginTime: currentUser.loginTime,
            sessionDuration: currentUser.loginTime ? 
                Math.round((new Date() - new Date(currentUser.loginTime)) / 1000 / 60) + ' minutes' : 'N/A'
        });
    }
    
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

