// Accordion Helper Functions for Leave Management

function renderLeaveAccordion(leaves, accordionId, type = 'admin') {
    const accordion = document.getElementById(accordionId);
    if (!accordion) return;
    
    if (leaves.length === 0) {
        accordion.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 48px; opacity: 0.3;"></i>
                <p class="mt-3">No leaves found</p>
            </div>
        `;
        return;
    }
    
    accordion.innerHTML = leaves.map((leave, index) => {
        const accordionItemId = `leave-${leave.id || index}`;
        const isFirst = index === 0;
        
        // Determine badge color based on status
        let badgeClass = 'bg-secondary';
        let statusText = 'Unknown';
        
        if (leave.approvalStatus === 'Rejected' || leave.approvalStatus === 'rejected') {
            badgeClass = 'bg-danger';
            statusText = 'Rejected';
        } else if (leave.approvalLevel === 4 || leave.approvalStatus === 'Final Approved') {
            badgeClass = 'bg-success';
            statusText = 'Final Approved';
        } else if (leave.approvalLevel === 3 || leave.approvalStatus === 'Final Approved') {
            badgeClass = 'bg-success';
            statusText = 'Final Approved (Level 3)';
        } else if (leave.approvalLevel === 2 || leave.approvalStatus === 'MIS Approved') {
            badgeClass = 'bg-primary';
            statusText = 'MIS Approved (Level 2)';
        } else if (leave.approvalLevel === 1) {
            badgeClass = 'bg-info';
            statusText = 'Trainer Approved (Level 1)';
        } else {
            badgeClass = 'bg-warning';
            statusText = 'Pending';
        }
        
        // Build action buttons based on type
        let actionButtons = '';
        if (type === 'admin') {
            if (leave.approvalLevel === 2 && leave.approvalStatus !== 'Rejected' && leave.approvalStatus !== 'Approved' && leave.approvalStatus !== 'MIS Approved' && leave.approvalStatus !== 'Final Approved') {
                actionButtons = `
                    <button class="btn btn-sm btn-primary me-2" onclick="viewLeaveDetails('${leave.id}')">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-success me-2" onclick="approveLeaveLevel3('${leave.id}')">
                        <i class="bi bi-check-circle"></i> Final Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                        <i class="bi bi-x-circle"></i> Reject
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                        <i class="bi bi-eye"></i> View Details
                    </button>
                `;
            }
        } else if (type === 'trainer') {
            if ((leave.approvalLevel === 0 || leave.approvalLevel === undefined) && leave.approvalStatus !== 'Rejected' && leave.approvalStatus !== 'Trainer Approved') {
                actionButtons = `
                    <button class="btn btn-sm btn-primary me-2" onclick="viewLeaveDetails('${leave.id}')">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-success me-2" onclick="approveLeaveLevel1('${leave.id}')">
                        <i class="bi bi-check-circle"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                        <i class="bi bi-x-circle"></i> Reject
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-sm btn-primary" onclick="viewLeaveDetails('${leave.id}')">
                        <i class="bi bi-eye"></i> View Details
                    </button>
                `;
            }
        } else if (type === 'student') {
            actionButtons = `
                <button class="btn btn-sm btn-primary" onclick="viewLeave('${leave.id}')">
                    <i class="bi bi-eye"></i> View Details
                </button>
            `;
        } else if (type === 'mis') {
            if (leave.approvalLevel === 1 && leave.approvalStatus !== 'Rejected' && leave.approvalStatus !== 'MIS Approved') {
                actionButtons = `
                    <button class="btn btn-sm btn-success me-2" onclick="callParent('${leave.studentId || leave.studentName}')">
                        <i class="bi bi-telephone"></i> Call Parent
                    </button>
                    <button class="btn btn-sm btn-primary me-2" onclick="approveLeaveLevel2('${leave.id}')">
                        <i class="bi bi-check-circle"></i> Approve Level 2
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave.id}')">
                        <i class="bi bi-x-circle"></i> Reject
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-sm btn-primary me-2" onclick="showUpdateLeave('${leave.id}', 'student')">
                        <i class="bi bi-pencil"></i> Update
                    </button>
                    <button class="btn btn-sm btn-success" onclick="callParent('${leave.studentId || leave.studentName}')">
                        <i class="bi bi-telephone"></i> Call Parent
                    </button>
                `;
            }
        }
        
        // Build details content
        let detailsContent = '';
        if (type === 'admin' || type === 'mis') {
            detailsContent = `
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Student ID/Name:</strong></div>
                    <div class="col-md-8">${leave.studentId || leave.studentName || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>From Date:</strong></div>
                    <div class="col-md-8">${leave.fromDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>To Date:</strong></div>
                    <div class="col-md-8">${leave.toDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Reason:</strong></div>
                    <div class="col-md-8">${leave.reason || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Parent Contacted:</strong></div>
                    <div class="col-md-8">
                        <span class="badge ${leave.parentContacted ? 'bg-success' : 'bg-warning'}">
                            ${leave.parentContacted ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Leave Letter:</strong></div>
                    <div class="col-md-8">
                        <span class="badge ${leave.leaveLetterReceived ? 'bg-success' : 'bg-danger'}">
                            ${leave.leaveLetterReceived ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Applied Date:</strong></div>
                    <div class="col-md-8">${leave.appliedDate || 'N/A'}</div>
                </div>
            `;
        } else if (type === 'trainer') {
            detailsContent = `
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Student ID:</strong></div>
                    <div class="col-md-8">${leave.studentId || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Student Name:</strong></div>
                    <div class="col-md-8">${leave.studentName || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>From Date:</strong></div>
                    <div class="col-md-8">${leave.fromDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>To Date:</strong></div>
                    <div class="col-md-8">${leave.toDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Reason:</strong></div>
                    <div class="col-md-8">${leave.reason || 'N/A'}</div>
                </div>
            `;
        } else if (type === 'student') {
            detailsContent = `
                <div class="row mb-2">
                    <div class="col-md-4"><strong>From Date:</strong></div>
                    <div class="col-md-8">${leave.fromDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>To Date:</strong></div>
                    <div class="col-md-8">${leave.toDate || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Reason:</strong></div>
                    <div class="col-md-8">${leave.reason || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4"><strong>Applied Date:</strong></div>
                    <div class="col-md-8">${leave.appliedDate || 'N/A'}</div>
                </div>
            `;
        }
        
        return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${accordionItemId}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionItemId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="collapse-${accordionItemId}">
                        <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <div>
                                <strong>${leave.studentName || leave.studentId || leave.trainerName || 'Unknown'}</strong>
                                <span class="badge ${badgeClass} ms-2">${statusText}</span>
                            </div>
                            <small class="text-muted">${leave.fromDate} to ${leave.toDate}</small>
                        </div>
                    </button>
                </h2>
                <div id="collapse-${accordionItemId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" aria-labelledby="heading-${accordionItemId}" data-bs-parent="#${accordionId}">
                    <div class="accordion-body">
                        ${detailsContent}
                        <div class="mt-3 pt-3 border-top">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


