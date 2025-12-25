// Attendance Accordion Helper Function

function renderAttendanceAccordion(students, accordionId) {
    const accordion = document.getElementById(accordionId);
    if (!accordion) return;
    
    if (students.length === 0) {
        accordion.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 48px; opacity: 0.3;"></i>
                <p class="mt-3">No students found</p>
            </div>
        `;
        return;
    }
    
    accordion.innerHTML = students.map((student, index) => {
        const accordionItemId = `attendance-${student.id || index}`;
        const isFirst = index === 0;
        
        // Get attendance status
        const onlineStatus = student.attendance && student.attendance.onlineClassCompleted;
        const offlineStatus = student.attendance && student.attendance.offlineRecordsReceived;
        
        // Determine overall status badge
        let statusBadge = '';
        let statusText = '';
        if (onlineStatus && offlineStatus) {
            statusBadge = 'bg-success';
            statusText = 'Complete';
        } else if (onlineStatus || offlineStatus) {
            statusBadge = 'bg-warning';
            statusText = 'Partial';
        } else {
            statusBadge = 'bg-danger';
            statusText = 'Pending';
        }
        
        return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${accordionItemId}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionItemId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="collapse-${accordionItemId}">
                        <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <div>
                                <strong>${student.name || 'Unknown'}</strong>
                                <span class="badge ${statusBadge} ms-2">${statusText}</span>
                            </div>
                        </div>
                    </button>
                </h2>
                <div id="collapse-${accordionItemId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" aria-labelledby="heading-${accordionItemId}" data-bs-parent="#${accordionId}">
                    <div class="accordion-body">
                        <div class="row mb-2">
                            <div class="col-md-4"><strong>Student ID:</strong></div>
                            <div class="col-md-8">${student.id || 'N/A'}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-4"><strong>Batch:</strong></div>
                            <div class="col-md-8">${student.currentBatch || 'N/A'}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-4"><strong>Online Class:</strong></div>
                            <div class="col-md-8">
                                <span class="badge ${onlineStatus ? 'bg-success' : 'bg-danger'}">
                                    ${onlineStatus ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-md-4"><strong>Offline Records:</strong></div>
                            <div class="col-md-8">
                                <span class="badge ${offlineStatus ? 'bg-success' : 'bg-danger'}">
                                    ${offlineStatus ? 'Received' : 'Pending'}
                                </span>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-top">
                            <button class="btn btn-sm btn-primary" onclick="showUpdateAttendance('${student.id}')">
                                <i class="bi bi-pencil"></i> Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


