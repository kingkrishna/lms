# Login Credentials - Training Institute CMS

## All User Login Credentials

Use these credentials to test different roles in the system:

---

### 🔐 Admin / Manager
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Full system control - can view, add, edit, and delete all data

---

### 👨‍🏫 Trainer
- **Username**: `trainer`
- **Password**: `trainer123`
- **Role**: Trainer
- **Access**: Schedule management, leave approval (Level 1), attendance tracking

---

### 📊 MIS Officer
- **Username**: `mis`
- **Password**: `mis123`
- **Role**: MIS
- **Access**: Leave approval (Level 2), system reports, analytics

---

### 🏠 Hostel Incharge
- **Username**: `hostel`
- **Password**: `hostel123`
- **Role**: Hostel Incharge
- **Access**: Hostel operations, movement tracking, canteen view access

---

### 🍽️ Canteen Incharge
- **Username**: `canteen`
- **Password**: `canteen123`
- **Role**: Canteen Incharge
- **Access**: Menu management, stock management, food count

---

### 👨‍🎓 Student
- **Username**: `STU001`
- **Password**: `student123`
- **Role**: Student
- **Access**: Self-service only - view menu, select food, apply leave, view profile

**Note**: For students, the username is their Student ID. Any student ID in the system can use password `student123` to login.

---

## Quick Login Guide

1. Go to `index.html` (Login Page)
2. Enter the **Username** and **Password** from above
3. Select the corresponding **Role** from the dropdown
4. Click "Login"

---

## Testing Checklist

- [ ] Admin Dashboard - Full system access
- [ ] Trainer Dashboard - Schedule and attendance
- [ ] MIS Dashboard - Leave approvals
- [ ] Hostel Dashboard - Movement tracking
- [ ] Canteen Dashboard - Menu and stock
- [ ] Student Dashboard - Food selection and leave application

---

## Security Note

⚠️ **These are default credentials for testing purposes only.**

For production use:
- Change all default passwords
- Implement password complexity requirements
- Add password reset functionality
- Implement proper server-side authentication
- Use secure password hashing (bcrypt, etc.)

---

## Additional Notes

- **QIS Role**: The QIS role has been merged into MIS. QIS users (`qis` / `qis123`) will be redirected to the MIS dashboard.
- **Student Login**: Students use their Student ID as username. The default password is `student123` for all students.
- **Session**: Login sessions are stored in `sessionStorage` and will be cleared when the browser is closed.

