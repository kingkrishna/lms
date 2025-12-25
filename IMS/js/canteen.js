// Canteen Incharge Dashboard Functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (!currentUser) return;
    
    if (currentUser.role !== 'canteen') {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user name
    const userNameElements = document.querySelectorAll('#userName, #userNameTop');
    userNameElements.forEach(el => {
        if (el) el.textContent = currentUser.name;
    });
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const menuDateField = document.getElementById('menuDate');
    const selectionDateField = document.getElementById('selectionDate');
    if (menuDateField) menuDateField.value = today;
    if (selectionDateField) selectionDateField.value = today;
    
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
    
    // Load dashboard
    loadDashboard();
    loadMenuForDate();
    loadStock();
    loadSelectionsForDate();
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
            case 'menu':
                loadMenuForDate();
                break;
            case 'stock':
                loadStock();
                break;
            case 'selections':
                loadSelectionsForDate();
                break;
        }
    }
}

function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const stock = getCanteenStock();
    
    // Update KPIs
    const morningSelections = document.getElementById('morningSelections');
    const nightSelections = document.getElementById('nightSelections');
    const stockItems = document.getElementById('stockItems');
    const todayDate = document.getElementById('todayDate');
    
    if (morningSelections) morningSelections.textContent = menu.morning.selectedCount;
    if (nightSelections) nightSelections.textContent = menu.night.selectedCount;
    if (stockItems) stockItems.textContent = stock.length;
    if (todayDate) {
        const dateObj = new Date(today);
        todayDate.textContent = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Load today's menu display
    loadTodayMenu();
    loadSelectionSummary();
}

function loadTodayMenu() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    
    const display = document.getElementById('todayMenuDisplay');
    if (!display) return;
    
    let html = '<div class="row">';
    html += '<div class="col-md-6">';
    html += '<h6><i class="bi bi-sunrise text-warning"></i> Morning Menu</h6>';
    if (menu.morning.items.length > 0) {
        html += '<ul class="list-unstyled">';
        menu.morning.items.forEach(item => {
            html += `<li><i class="bi bi-check-circle text-success"></i> ${item}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p class="text-muted">No menu set for today</p>';
    }
    html += '</div>';
    
    html += '<div class="col-md-6">';
    html += '<h6><i class="bi bi-moon text-info"></i> Night Menu</h6>';
    if (menu.night.items.length > 0) {
        html += '<ul class="list-unstyled">';
        menu.night.items.forEach(item => {
            html += `<li><i class="bi bi-check-circle text-success"></i> ${item}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p class="text-muted">No menu set for today</p>';
    }
    html += '</div></div>';
    
    display.innerHTML = html;
}

function loadSelectionSummary() {
    const today = new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(today);
    const total = menu.morning.selectedCount + menu.night.selectedCount;
    
    const display = document.getElementById('selectionSummary');
    if (!display) return;
    
    const morningPercent = total > 0 ? Math.round((menu.morning.selectedCount / total) * 100) : 0;
    const nightPercent = 100 - morningPercent;
    
    let html = `
        <div class="mb-3">
            <div class="d-flex justify-content-between mb-2">
                <span><i class="bi bi-sunrise"></i> Morning</span>
                <span class="badge bg-warning">${menu.morning.selectedCount}</span>
            </div>
            <div class="progress" style="height: 25px;">
                <div class="progress-bar bg-warning" role="progressbar" style="width: ${morningPercent}%">${morningPercent}%</div>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between mb-2">
                <span><i class="bi bi-moon"></i> Night</span>
                <span class="badge bg-info">${menu.night.selectedCount}</span>
            </div>
            <div class="progress" style="height: 25px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: ${nightPercent}%">${nightPercent}%</div>
            </div>
        </div>
        <div class="mt-3">
            <p class="mb-0"><strong>Total Selections:</strong> <span class="badge bg-primary">${total}</span></p>
        </div>
    `;
    
    display.innerHTML = html;
}

function loadMenuForDate() {
    const dateInput = document.getElementById('menuDate');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(date);
    
    const display = document.getElementById('menuDisplay');
    if (!display) return;
    
    let html = '<div class="row">';
    html += '<div class="col-md-6">';
    html += '<div class="card">';
    html += '<div class="card-header bg-warning text-white">';
    html += '<h6 class="mb-0"><i class="bi bi-sunrise"></i> Morning Menu (Tiffin)</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    if (menu.morning.items.length > 0) {
        html += '<ul class="list-unstyled">';
        menu.morning.items.forEach(item => {
            html += `<li><i class="bi bi-check-circle text-success"></i> ${item}</li>`;
        });
        html += '</ul>';
        html += `<p class="mb-0"><strong>Selections:</strong> ${menu.morning.selectedCount}</p>`;
    } else {
        html += '<p class="text-muted">No menu set for this date</p>';
    }
    html += '</div></div></div>';
    
    html += '<div class="col-md-6">';
    html += '<div class="card">';
    html += '<div class="card-header bg-info text-white">';
    html += '<h6 class="mb-0"><i class="bi bi-moon"></i> Night Menu (Dinner)</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    if (menu.night.items.length > 0) {
        html += '<ul class="list-unstyled">';
        menu.night.items.forEach(item => {
            html += `<li><i class="bi bi-check-circle text-success"></i> ${item}</li>`;
        });
        html += '</ul>';
        html += `<p class="mb-0"><strong>Selections:</strong> ${menu.night.selectedCount}</p>`;
    } else {
        html += '<p class="text-muted">No menu set for this date</p>';
    }
    html += '</div></div></div></div>';
    
    html += '<div class="mt-3">';
    html += `<button class="btn btn-primary" onclick="showAddMenuModal('${date}')">`;
    html += '<i class="bi bi-pencil"></i> Edit Menu';
    html += '</button>';
    html += '</div>';
    
    display.innerHTML = html;
}

function loadStock() {
    const stock = getCanteenStock();
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;
    
    if (stock.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No stock items found. Add items to get started.</td></tr>';
        return;
    }
    
    tbody.innerHTML = stock.map((item, index) => {
        return `
            <tr>
                <td>${item.item}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${new Date().toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="showEditStockModal(${index})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStockItem(${index})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function loadSelectionsForDate() {
    const dateInput = document.getElementById('selectionDate');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(date);
    const selections = getFoodSelections(date);
    const students = getStudents();
    
    const display = document.getElementById('selectionsDisplay');
    if (!display) return;
    
    let html = '<div class="row">';
    html += '<div class="col-md-6">';
    html += '<div class="card">';
    html += '<div class="card-header bg-warning">';
    html += '<h6 class="mb-0"><i class="bi bi-sunrise"></i> Morning Selections: ' + menu.morning.selectedCount + '</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<p class="text-muted small">These counts are automatically generated from student and trainer selections.</p>';
    html += '</div></div></div>';
    
    html += '<div class="col-md-6">';
    html += '<div class="card">';
    html += '<div class="card-header bg-info">';
    html += '<h6 class="mb-0"><i class="bi bi-moon"></i> Night Selections: ' + menu.night.selectedCount + '</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<p class="text-muted small">These counts are automatically generated from student and trainer selections.</p>';
    html += '</div></div></div></div>';
    
    display.innerHTML = html;
}

function showAddMenuModal(date) {
    const dateInput = document.getElementById('menuDateInput');
    if (dateInput) {
        dateInput.value = date || document.getElementById('menuDate')?.value || new Date().toISOString().split('T')[0];
    }
    
    // Load existing menu if available
    const menuDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const menu = getFoodMenu(menuDate);
    
    const morningItems = document.getElementById('morningMenuItems');
    const nightItems = document.getElementById('nightMenuItems');
    
    if (morningItems) morningItems.value = menu.morning.items.join(', ');
    if (nightItems) nightItems.value = menu.night.items.join(', ');
    
    const modal = new bootstrap.Modal(document.getElementById('addMenuModal'));
    modal.show();
}

function saveMenu() {
    const dateInput = document.getElementById('menuDateInput');
    const morningItems = document.getElementById('morningMenuItems');
    const nightItems = document.getElementById('nightMenuItems');
    
    if (!dateInput || !dateInput.value) {
        Toast.error('Date is required');
        return;
    }
    
    const date = dateInput.value;
    const morningItemsList = morningItems.value.split(',').map(item => item.trim()).filter(item => item);
    const nightItemsList = nightItems.value.split(',').map(item => item.trim()).filter(item => item);
    
    const menu = {
        morning: {
            items: morningItemsList,
            selectedCount: 0 // Will be updated automatically
        },
        night: {
            items: nightItemsList,
            selectedCount: 0 // Will be updated automatically
        }
    };
    
    saveFoodMenu(date, menu);
    
    Toast.success('Menu saved successfully');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMenuModal'));
    modal.hide();
    
    loadDashboard();
    loadMenuForDate();
}

function showAddStockModal() {
    document.getElementById('stockItemIndex').value = '';
    document.getElementById('stockItemName').value = '';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockUnit').value = 'kg';
    
    const modal = new bootstrap.Modal(document.getElementById('addStockModal'));
    modal.show();
}

function showEditStockModal(index) {
    const stock = getCanteenStock();
    if (index < 0 || index >= stock.length) {
        Toast.error('Invalid stock item');
        return;
    }
    
    const item = stock[index];
    document.getElementById('stockItemIndex').value = index;
    document.getElementById('stockItemName').value = item.item;
    document.getElementById('stockQuantity').value = item.quantity;
    document.getElementById('stockUnit').value = item.unit;
    
    const modal = new bootstrap.Modal(document.getElementById('addStockModal'));
    modal.show();
}

function saveStock() {
    const index = document.getElementById('stockItemIndex').value;
    const itemName = document.getElementById('stockItemName').value;
    const quantity = document.getElementById('stockQuantity').value;
    const unit = document.getElementById('stockUnit').value;
    
    if (!itemName || !quantity) {
        Toast.error('Item name and quantity are required');
        return;
    }
    
    const stock = getCanteenStock();
    
    if (index === '' || index === null) {
        // Add new item
        stock.push({
            item: itemName,
            quantity: parseFloat(quantity),
            unit: unit
        });
    } else {
        // Update existing item
        const idx = parseInt(index);
        if (idx >= 0 && idx < stock.length) {
            stock[idx].item = itemName;
            stock[idx].quantity = parseFloat(quantity);
            stock[idx].unit = unit;
        }
    }
    
    saveCanteenStock(stock);
    
    Toast.success('Stock saved successfully');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStockModal'));
    modal.hide();
    
    loadStock();
    loadDashboard();
}

function deleteStockItem(index) {
    if (!ConfirmDialog) {
        if (!confirm('Are you sure you want to delete this stock item?')) {
            return;
        }
    } else {
        ConfirmDialog.show({
            title: 'Delete Stock Item',
            message: 'Are you sure you want to delete this stock item?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => {
                performDeleteStock(index);
            }
        });
        return;
    }
    
    performDeleteStock(index);
}

function performDeleteStock(index) {
    const stock = getCanteenStock();
    if (index < 0 || index >= stock.length) {
        Toast.error('Invalid stock item');
        return;
    }
    
    stock.splice(index, 1);
    saveCanteenStock(stock);
    
    Toast.success('Stock item deleted successfully');
    loadStock();
    loadDashboard();
}

function refreshCanteenData() {
    loadDashboard();
    loadMenuForDate();
    loadStock();
    loadSelectionsForDate();
    Toast.success('Data refreshed');
}


