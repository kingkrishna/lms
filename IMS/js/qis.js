// QIS Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'qis') {
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
    
    // Setup tab change listener
    const leaveTabs = document.querySelectorAll('#leaveTabs button[data-bs-toggle="tab"]');
    leaveTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            loadLeaves();
        });
    });
    
    // Load dashboard
    loadDashboard();
    loadLeaves();
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
            case 'leaves':
                loadLeaves();
                break;
        }
    }
}

function loadDashboard() {
    const leaves = getStudentLeaves();
    
    // Count pending verifications (Level 1 approved, waiting for QIS)
    const pendingVerification = leaves.filter(l => 
        l.approvalLevel === 1 && 
        l.trainerApproved === true && 
        l.qisApproved !== true && 
        l.approvalStatus !== 'Rejected'
    ).length;
    
    // Count verified today
    const today = new Date().toISOString().split('T')[0];
    const verifiedToday = leaves.filter(l => 
        l.qisApproved === true && 
        l.qisApprovedDate === today
    ).length;
    
    // Count forwarded to MIS (Level 2 approved)
    const forwardedToMIS = leaves.filter(l => 
        l.approvalLevel === 2 && 
        l.qisApproved === true
    ).length;
    
    // Count rejected
    const rejectedLeaves = leaves.filter(l => 
        l.qisRejected === true || 
        (l.approvalStatus === 'Rejected' && l.qisRejectedBy)
    ).length;
    
    // Update KPIs
    const pendingVerificationEl = document.getElementById('pendingVerification');
    const verifiedTodayEl = document.getElementById('verifiedToday');
    const forwardedToMISEl = document.getElementById('forwardedToMIS');
    const rejectedLeavesEl = document.getElementById('rejectedLeaves');
    const pendingLeavesBadge = document.getElementById('pendingLeavesBadge');
    const pendingLeavesBadgeTop = document.getElementById('pendingLeavesBadgeTop');
    
    if (pendingVerificationEl) pendingVerificationEl.textContent = pendingVerification;
    if (verifiedTodayEl) verifiedTodayEl.textContent = verifiedToday;
    if (forwardedToMISEl) forwardedToMISEl.textContent = forwardedToMIS;
    if (rejectedLeavesEl) rejectedLeavesEl.textContent = rejectedLeaves;
    if (pendingLeavesBadge) pendingLeavesBadge.textContent = pendingVerification;
    if (pendingLeavesBadgeTop) pendingLeavesBadgeTop.textContent = pendingVerification;
    
    // Load recent verifications
    loadRecentVerifications();
}

function loadLeaves() {
    const leaves = getStudentLeaves();
    
    // Pending verifications (Level 1 approved, waiting for QIS)
    const pendingLeaves = leaves.filter(l => 
        l.approvalLevel === 1 && 
        l.trainerApproved === true && 
        l.qisApproved !== true && 
        l.approvalStatus !== 'Rejected'
    );
    
    // Verified and forwarded (Level 2 approved)
    const verifiedLeaves = leaves.filter(l => 
        l.approvalLevel === 2 && 
        l.qisApproved === true
    );
    
    // Rejected by QIS
    const rejectedLeaves = leaves.filter(l => 
        l.qisRejected === true || 
        (l.approvalStatus === 'Rejected' && l.qisRejectedBy)
    );
    
    // Update counts
    const pendingCount = document.getElementById('pendingCount');
    const verifiedCount = document.getElementById('verifiedCount');
    const rejectedCount = document.getElementById('rejectedCount');
    
    if (pendingCount) pendingCount.textContent = pendingLeaves.length;
    if (verifiedCount) verifiedCount.textContent = verifiedLeaves.length;
    if (rejectedCount) rejectedCount.textContent = rejectedLeaves.length;
    
    // Render tables
    renderPendingLeaves(pendingLeaves);
    renderVerifiedLeaves(verifiedLeaves);
    renderRejectedLeaves(rejectedLeaves);
}

function renderPendingLeaves(leaves) {
    const tbody = document.getElementById('pendingLeavesTableBody');
    if (!tbody) return;
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No pending leaves for verification</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => {
        const trainerApprovedText = leave.trainerApprovedBy 
            ? `${leave.trainerApprovedBy} on ${leave.trainerApprovedDate || 'N/A'}`
            : 'N/A';
        
        return `
            <tr>
                <td>${leave.studentId || 'N/A'}</td>
                <td>${leave.studentName || 'N/A'}</td>
                <td>${leave.fromDate || 'N/A'}</td>
                <td>${leave.toDate || 'N/A'}</td>
                <td>${leave.reason || 'N/A'}</td>
                <td>${trainerApprovedText}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showVerifyLeaveModal('${leave.id}')">
                        <i class="bi bi-check-circle"></i> Verify
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderVerifiedLeaves(leaves) {
    const tbody = document.getElementById('verifiedLeavesTableBody');
    if (!tbody) return;
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No verified leaves</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => {
        return `
            <tr>
                <td>${leave.studentId || 'N/A'}</td>
                <td>${leave.studentName || 'N/A'}</td>
                <td>${leave.fromDate || 'N/A'}</td>
                <td>${leave.toDate || 'N/A'}</td>
                <td>${leave.reason || 'N/A'}</td>
                <td>${leave.qisApprovedDate || 'N/A'}</td>
                <td><span class="badge bg-success">Forwarded to MIS</span></td>
            </tr>
        `;
    }).join('');
}

function renderRejectedLeaves(leaves) {
    const tbody = document.getElementById('rejectedLeavesTableBody');
    if (!tbody) return;
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No rejected leaves</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => {
        return `
            <tr>
                <td>${leave.studentId || 'N/A'}</td>
                <td>${leave.studentName || 'N/A'}</td>
                <td>${leave.fromDate || 'N/A'}</td>
                <td>${leave.toDate || 'N/A'}</td>
                <td>${leave.reason || 'N/A'}</td>
                <td>${leave.qisRejectionReason || 'N/A'}</td>
                <td>${leave.qisRejectedDate || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function showVerifyLeaveModal(leaveId) {
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    
    if (!leave) {
        Toast.error('Leave not found');
        return;
    }
    
    document.getElementById('verifyLeaveId').value = leaveId;
    document.getElementById('verifyStudentName').value = `${leave.studentName} (${leave.studentId})`;
    document.getElementById('verifyFromDate').value = leave.fromDate || 'N/A';
    document.getElementById('verifyToDate').value = leave.toDate || 'N/A';
    document.getElementById('verifyReason').value = leave.reason || 'N/A';
    
    const trainerApprovedText = leave.trainerApprovedBy 
        ? `Approved by ${leave.trainerApprovedBy} on ${leave.trainerApprovedDate || 'N/A'}`
        : 'Not available';
    document.getElementById('verifyTrainerApproval').value = trainerApprovedText;
    
    document.getElementById('verifyStatus').value = '';
    document.getElementById('verifyRemarks').value = '';
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectionReasonDiv').style.display = 'none';
    
    // Show/hide rejection reason based on status
    const verifyStatusSelect = document.getElementById('verifyStatus');
    verifyStatusSelect.addEventListener('change', function() {
        if (this.value === 'reject') {
            document.getElementById('rejectionReasonDiv').style.display = 'block';
        } else {
            document.getElementById('rejectionReasonDiv').style.display = 'none';
        }
    });
    
    const modal = new bootstrap.Modal(document.getElementById('verifyLeaveModal'));
    modal.show();
}

function saveVerification() {
    const leaveId = document.getElementById('verifyLeaveId').value;
    const verifyStatus = document.getElementById('verifyStatus').value;
    const verifyRemarks = document.getElementById('verifyRemarks').value;
    const rejectionReason = document.getElementById('rejectionReason').value;
    
    if (!leaveId || !verifyStatus) {
        Toast.error('Please select verification status');
        return;
    }
    
    if (verifyStatus === 'reject' && !rejectionReason.trim()) {
        Toast.error('Please provide rejection reason');
        return;
    }
    
    const leaves = getStudentLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    
    if (!leave) {
        Toast.error('Leave not found');
        return;
    }
    
    if (verifyStatus === 'approve') {
        // Approve and forward to MIS (Level 2)
        leave.approvalLevel = 2;
        leave.qisApproved = true;
        leave.qisApprovedBy = currentUser.name;
        leave.qisApprovedDate = new Date().toISOString().split('T')[0];
        leave.qisRemarks = verifyRemarks;
        leave.approvalStatus = 'QIS Approved - Forwarded to MIS';
        leave.qisRejected = false;
    } else if (verifyStatus === 'reject') {
        // Reject at QIS level
        leave.approvalLevel = -1;
        leave.qisRejected = true;
        leave.qisRejectedBy = currentUser.name;
        leave.qisRejectedDate = new Date().toISOString().split('T')[0];
        leave.qisRejectionReason = rejectionReason;
        leave.qisRemarks = verifyRemarks;
        leave.approvalStatus = 'Rejected by QIS';
        leave.qisApproved = false;
    }
    
    // Update leave in array
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index >= 0) {
        leaves[index] = leave;
    }
    
    saveStudentLeave(leave);
    
    // Log action
    logAction('leave_verification', {
        leaveId: leaveId,
        action: verifyStatus,
        studentId: leave.studentId,
        remarks: verifyRemarks
    });
    
    Toast.success(verifyStatus === 'approve' 
        ? 'Leave verified and forwarded to MIS successfully' 
        : 'Leave rejected successfully');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('verifyLeaveModal'));
    modal.hide();
    
    loadDashboard();
    loadLeaves();
}

function loadRecentVerifications() {
    const leaves = getStudentLeaves();
    const verifiedLeaves = leaves.filter(l => l.qisApproved === true || l.qisRejected === true)
        .sort((a, b) => {
            const dateA = new Date(a.qisApprovedDate || a.qisRejectedDate || 0);
            const dateB = new Date(b.qisApprovedDate || b.qisRejectedDate || 0);
            return dateB - dateA;
        })
        .slice(0, 5);
    
    const display = document.getElementById('recentVerifications');
    if (!display) return;
    
    if (verifiedLeaves.length === 0) {
        display.innerHTML = '<p class="text-muted">No recent verifications</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    verifiedLeaves.forEach(leave => {
        const status = leave.qisApproved ? 'Verified' : 'Rejected';
        const statusClass = leave.qisApproved ? 'success' : 'danger';
        const date = leave.qisApprovedDate || leave.qisRejectedDate || 'N/A';
        
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${leave.studentName}</strong> (${leave.studentId})
                        <br><small class="text-muted">${date}</small>
                    </div>
                    <span class="badge bg-${statusClass}">${status}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    display.innerHTML = html;
}

function refreshQISData() {
    loadDashboard();
    loadLeaves();
    Toast.success('Data refreshed');
}

// Helper function to log actions (for audit trail)
function logAction(actionType, details) {
    const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    logs.push({
        timestamp: new Date().toISOString(),
        user: currentUser.username,
        userRole: currentUser.role,
        action: actionType,
        details: details
    });
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
        logs.shift();
    }
    
    localStorage.setItem('auditLogs', JSON.stringify(logs));
}

