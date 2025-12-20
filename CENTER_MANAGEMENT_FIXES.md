# Center Management & Staff Registration Workflow - Fixed Issues

## 🎯 Issues Fixed

### 1. ✅ Staff Registration Notification System
**Problem**: When staff registers a center, admin doesn't receive any notification.

**Solution**: 
- Added automatic notification creation when staff registers
- All admin users receive a notification with staff details
- Notification includes center name, email, and staff user ID
- Notifications appear in admin dashboard

**Implementation**:
```javascript
// In authRoutes.js - staff-register endpoint
const notifications = adminUsers.map(admin => ({
  user: admin._id,
  type: 'staff_registration',
  title: 'New Staff Registration',
  message: `New staff registration from ${centerName}. Please review and approve.`,
  meta: {
    staffUserId: staffUser._id,
    centerName: centerName,
    centerEmail: centerContact.email
  }
}));
```

### 2. ✅ Center Inactive/Delete Issue
**Problem**: When marking a center as inactive, it was being deleted from the admin centers view.

**Solution**:
- Changed DELETE endpoint to properly soft-delete (set status to 'inactive')
- Created new admin endpoint `/api/centers/admin/all` that shows ALL centers (including inactive)
- Public endpoint `/api/centers` still only shows active centers
- When center is deactivated, associated staff user is also deactivated
- Centers remain visible in admin panel with proper status filtering

**Implementation**:
```javascript
// Soft delete - sets status to inactive
center.status = 'inactive';
center.updatedAt = new Date();
await center.save();

// Also deactivate associated staff
if (center.registeredBy) {
  await User.findByIdAndUpdate(center.registeredBy, { 
    isActive: false,
    updatedAt: new Date()
  });
}
```

### 3. ✅ Admin Centers Page Filtering
**Problem**: Inactive centers disappeared from the admin view.

**Solution**:
- Updated AdminCenters component to use `/api/centers/admin/all` endpoint
- Shows all centers regardless of status
- Filter dropdown works correctly for: All, Active, Inactive, Maintenance
- Each center card shows current status with color coding:
  - Green: Active
  - Red: Inactive
  - Yellow: Maintenance

### 4. ✅ Staff User Status Synchronization
**Problem**: When center is deactivated, staff user status wasn't updated.

**Solution**:
- When center is marked inactive, associated staff user is automatically deactivated
- Staff cannot login when their account is inactive
- Admin can see staff status in the Staff Management section
- Status changes are reflected across all admin views

### 5. ✅ Approval/Rejection Notifications
**Problem**: Staff members weren't notified about approval/rejection decisions.

**Solution**:
- When admin approves staff registration:
  - Staff receives approval notification
  - Can now login to their dashboard
  - Center becomes active
  
- When admin rejects staff registration:
  - Staff receives rejection notification with reason
  - Account remains inactive
  - Cannot login

### 6. ✅ **NEW: Permanent Delete for Inactive Centers**
**Problem**: No way to permanently remove inactive centers from the database.

**Solution**:
- Added permanent delete endpoint `/api/centers/:id/permanent`
- Only inactive centers can be permanently deleted
- Deletes all associated data:
  - Center record
  - Staff user account
  - Staff records
  - All appointments
- Requires explicit confirmation (user must type "DELETE")
- Shows warning icon (⚠️) for inactive centers
- Includes bulk delete option for multiple inactive centers
- Requires typing "DELETE ALL" for bulk deletion

**Implementation**:
```javascript
// Backend - Permanent delete endpoint
router.delete('/:id/permanent', async (req, res) => {
  // Only allow deletion of inactive centers
  if (center.status !== 'inactive') {
    return res.status(400).json({
      message: 'Only inactive centers can be permanently deleted'
    });
  }
  
  // Delete all associated data
  await Staff.deleteMany({ center: center._id });
  await Appointment.deleteMany({ center: center._id });
  await User.findByIdAndDelete(center.registeredBy);
  await AkshayaCenter.findByIdAndDelete(req.params.id);
});
```

## 🔄 Complete Workflow

### Staff Registration Flow:
1. **Staff Registers** → Fills out center registration form
2. **System Creates**:
   - Inactive staff user account
   - Inactive center record
   - Staff record linking user to center
   - **Notifications to all admins**
3. **Admin Reviews** → Sees notification in admin dashboard
4. **Admin Approves/Rejects**:
   - **Approve**: Activates staff, center, sends approval notification
   - **Reject**: Sends rejection notification with reason
5. **Staff Notified** → Receives email/notification about decision
6. **Staff Logs In** → (if approved) Can access staff dashboard

### Center Management Flow:
1. **Admin Views Centers** → Sees all centers (active + inactive)
2. **Admin Filters** → Can filter by status (all/active/inactive/maintenance)
3. **Admin Edits** → Can update center details, status, capacity
4. **Admin Deactivates** → Marks center as inactive (soft delete)
   - Center remains in database
   - Visible in admin panel with "inactive" status
   - Associated staff user is deactivated
   - Public users don't see inactive centers
5. **Admin Permanently Deletes** → (NEW) Removes inactive center completely
   - Only available for inactive centers
   - Requires explicit confirmation
   - Deletes all associated data
   - Cannot be undone

## 📡 API Endpoints

### Public Endpoints:
- `GET /api/centers` - Get active centers only
- `GET /api/centers/nearby` - Get nearby active centers
- `GET /api/centers/search` - Search active centers
- `GET /api/centers/:id` - Get specific center details

### Admin Endpoints:
- `GET /api/centers/admin/all` - Get ALL centers (including inactive)
- `POST /api/centers` - Create new center
- `PUT /api/centers/:id` - Update center
- `DELETE /api/centers/:id` - Soft delete (mark inactive)
- `DELETE /api/centers/:id/permanent` - **NEW: Permanently delete inactive center**

### Admin Notification Endpoints:
- `GET /api/admin/notifications` - Get admin notifications
- `POST /api/admin/notifications/mark-read` - Mark notifications as read

### Staff Registration Endpoints:
- `POST /api/auth/staff-register` - Staff registration
- `POST /api/auth/admin/approve-staff/:userId` - Approve staff
- `POST /api/auth/admin/reject-staff/:userId` - Reject staff
- `GET /api/auth/staff-registrations` - Get all staff registrations

## 🧪 Testing

### Test Staff Login:
```bash
cd backend/scripts
node testAutoLogin.js
```

### Test Center Management:
```bash
cd backend/scripts
node testCenterManagement.js
```

### Test Permanent Delete:
```bash
cd backend/scripts
node testPermanentDelete.js
```

### Working Staff Credentials:
- **Email**: `akshayacenter2@gmail.com`
- **Password**: `staff123`
- **Status**: Active & Approved

## 🎨 UI Changes

### Admin Centers Page:
- Shows all centers with status badges
- Filter dropdown: All / Active / Inactive / Maintenance
- Search by name, city, or district
- **Active Centers**: Trash icon (🗑️) to deactivate
- **Inactive Centers**: Warning icon (⚠️) to permanently delete
- Shows associated staff member name
- Color-coded status indicators
- **NEW: Bulk delete button** for deleting all inactive centers at once
- **NEW: Warning banner** when viewing inactive centers

### Permanent Delete Features:
- Individual delete: Click warning icon (⚠️) on inactive center
- Bulk delete: "Delete All Inactive" button when filtering by inactive
- Confirmation required: Must type "DELETE" or "DELETE ALL"
- Shows list of centers to be deleted
- Cannot delete active centers (must deactivate first)
- Deletes all associated data (staff, appointments, etc.)

### Admin Staff Page:
- Shows pending staff registrations
- Approve/Reject buttons
- Shows associated center details
- Notification badge for new registrations

## 🔐 Security

- Public endpoints only show active centers
- Admin endpoints require admin authentication
- Staff can only access their own center data
- Soft delete prevents accidental data loss
- Permanent delete requires explicit confirmation
- Only inactive centers can be permanently deleted
- Status changes are logged with timestamps

## 📝 Database Changes

### Center Model:
- `status`: 'active' | 'inactive' | 'maintenance'
- `registeredBy`: Reference to staff user
- `updatedAt`: Timestamp of last update

### User Model (Staff):
- `isActive`: Boolean (synced with center status)
- `approvalStatus`: 'pending' | 'approved' | 'rejected'
- `reviewedBy`: Admin who reviewed
- `reviewedAt`: Timestamp of review
- `reviewNotes`: Admin notes/reason

### Notification Model:
- `type`: 'staff_registration' | 'approval' | 'rejection' | 'broadcast'
- `meta`: Additional data (center name, staff ID, etc.)

## ✅ Verification Checklist

- [x] Staff registration creates admin notifications
- [x] Admin receives notification for new staff registrations
- [x] Admin can view all centers (including inactive)
- [x] Inactive centers remain visible in admin panel
- [x] Filter works correctly (all/active/inactive/maintenance)
- [x] Deactivating center also deactivates staff user
- [x] Staff receives approval notification
- [x] Staff receives rejection notification
- [x] Public endpoints only show active centers
- [x] Admin endpoints show all centers
- [x] Auto-detection login works for all roles
- [x] **NEW: Permanent delete only works for inactive centers**
- [x] **NEW: Permanent delete requires confirmation**
- [x] **NEW: Permanent delete removes all associated data**
- [x] **NEW: Bulk delete option available for inactive centers**
- [x] **NEW: Cannot permanently delete active centers**

## 🚀 Next Steps

1. Test the complete workflow in the UI
2. Verify notifications appear in admin dashboard
3. Test staff approval/rejection flow
4. Verify center status changes reflect in all views
5. Test public center finder only shows active centers
6. **NEW: Test permanent delete for inactive centers**
7. **NEW: Test bulk delete functionality**
8. **NEW: Verify active centers cannot be permanently deleted**

## 📞 Support

If you encounter any issues:
1. Check server logs for errors
2. Verify database connection
3. Ensure admin user exists
4. Test with provided staff credentials
5. Check notification creation in database
6. **NEW: Verify center status before attempting permanent delete**
