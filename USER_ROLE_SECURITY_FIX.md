# User Role Security Fix

## 🚨 Security Issue Fixed

**Critical Security Vulnerability**: Users could set themselves as admin during registration!

### What Was Wrong

1. **Manual Registration**: Users could send `role: "admin"` in the request body
2. **Google Login**: Users could send `role: "admin"` in the Google auth request
3. **Result**: Anyone could become an admin without authorization ❌

---

## ✅ What Was Fixed

### 1. **Manual Registration** (`POST /api/auth/register`)

**Before** (Insecure):
```javascript
const { name, email, password, phone, role = "user" } = req.body;

const user = await User.create({
  name, email, password: hashedPassword, phone,
  role,  // ❌ User could send role: "admin"
  provider: "local",
});
```

**After** (Secure):
```javascript
const { name, email, password, phone } = req.body;
// role removed from destructuring

const user = await User.create({
  name, email, password: hashedPassword, phone,
  role: "user",  // ✅ Always "user" for new registrations
  provider: "local",
});
```

---

### 2. **Google Login** (`POST /api/auth/google`)

**Before** (Insecure):
```javascript
user = await User.create({
  name: name || email.split("@")[0],
  email,
  googleId: uid,
  provider: "google",
  avatar: picture,
  role: req.body.role || "user",  // ❌ Client could send role
});
```

**After** (Secure):
```javascript
user = await User.create({
  name: name || email.split("@")[0],
  email,
  googleId: uid,
  provider: "google",
  avatar: picture,
  role: "user",  // ✅ Always "user" for new accounts
});
```

---

### 3. **New Admin Endpoint** (Admin Can Change Roles)

Added proper endpoint for admins to promote users:

**New Endpoint**: `PATCH /api/admin/users/:id/role`

**Usage**:
```bash
# Promote a user to admin
PATCH /api/admin/users/USER_ID/role
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "role": "admin"
}
```

**Features**:
- ✅ Only admins can access this endpoint
- ✅ Validates role is either "user" or "admin"
- ✅ Prevents admin from demoting themselves
- ✅ Returns updated user information

---

### 4. **Improved User List** (Show All Users)

**Before**: Only showed users with `role: "user"`

**After**: Shows all users (both regular users and admins)

**New Features**:
- Optional filter: `GET /api/admin/users?role=admin` (show only admins)
- Optional filter: `GET /api/admin/users?role=user` (show only users)
- No filter: `GET /api/admin/users` (show everyone)

---

## 🎯 How It Works Now

### User Registration Flow

```
User signs up (Manual or Google)
  ↓
Backend creates account with role: "user" (hardcoded)
  ↓
User cannot set their own role
  ↓
User has normal user access
```

### Making Someone Admin

```
Admin logs into admin panel
  ↓
Goes to Users Management
  ↓
Finds the user
  ↓
Clicks "Change Role" or uses API
  ↓
Sets role to "admin"
  ↓
User now has admin access
```

---

## 📝 API Endpoints Summary

### Registration & Auth (Public)

| Endpoint | Method | Role Assignment |
|----------|--------|----------------|
| `/api/auth/register` | POST | Always "user" ✅ |
| `/api/auth/google` | POST | Always "user" ✅ |
| `/api/auth/login` | POST | N/A (uses existing role) |

### User Management (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users?role=admin` | GET | List only admins |
| `/api/admin/users?role=user` | GET | List only regular users |
| `/api/admin/users/:id/status` | PATCH | Activate/deactivate user |
| `/api/admin/users/:id/role` | PATCH | **Change user role** (NEW) ✅ |

---

## 🧪 Testing the Fix

### Test 1: Try to Register as Admin (Should Fail)

**Manual Registration**:
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Hacker",
  "email": "hacker@test.com",
  "password": "password123",
  "role": "admin"  // ❌ This will be ignored
}
```

**Expected Result**:
- User is created with `role: "user"`
- The `role: "admin"` in the request is **ignored**

### Test 2: Check Google Login Creates User Role

**Google Login**:
```bash
POST /api/auth/google
Content-Type: application/json

{
  "token": "FIREBASE_ID_TOKEN",
  "role": "admin"  // ❌ This will be ignored
}
```

**Expected Result**:
- New user created with `role: "user"`
- Cannot set admin role through Google login

### Test 3: Admin Can Change User Role (Should Work)

```bash
PATCH /api/admin/users/USER_ID/role
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "role": "admin"
}
```

**Expected Result**:
```json
{
  "success": true,
  "message": "User role updated to admin successfully",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",  // ✅ Updated
    ...
  }
}
```

### Test 4: Admin Cannot Demote Themselves

```bash
PATCH /api/admin/users/SELF_ID/role
Authorization: Bearer ADMIN_TOKEN

{
  "role": "user"
}
```

**Expected Result**:
```json
{
  "success": false,
  "message": "You cannot demote yourself from admin"
}
```

---

## 🔐 Security Best Practices Implemented

1. ✅ **Never trust client input for role assignment**
2. ✅ **Hardcode default role to "user"** for all new registrations
3. ✅ **Separate endpoint for role changes** (admin-only access)
4. ✅ **Validate role values** (only "user" or "admin" allowed)
5. ✅ **Prevent self-demotion** (admin can't remove own admin status)
6. ✅ **Admin authentication required** for role changes

---

## 🎨 Frontend Integration (Optional)

If you want to add role management UI in the admin panel:

### Example UI Component:
```jsx
// Admin Users Page - Add role change button
const AdminUsers = () => {
  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await axios.patch(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Role updated successfully!');
        // Refresh user list
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div>
      {/* User list with role badges and change buttons */}
      {users.map(user => (
        <div key={user._id}>
          <span>{user.name} ({user.role})</span>
          {user.role === 'user' ? (
            <button onClick={() => handleChangeRole(user._id, 'admin')}>
              Make Admin
            </button>
          ) : (
            <button onClick={() => handleChangeRole(user._id, 'user')}>
              Remove Admin
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 📋 Migration Notes

### Existing Users

- ✅ All existing users keep their current roles
- ✅ No database migration needed
- ✅ Changes only affect **new registrations**

### First Admin Account

If you don't have an admin account yet, create one manually:

**Option 1: Using MongoDB Shell/Compass**
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Using Seed Script** (if you have one)
```bash
node backend/scripts/seedAdmin.js
```

**Option 3: Temporarily modify registration** (not recommended for production)
1. Register a new account
2. Manually update role in database
3. Delete this account or change back to "user" after creating proper admin

---

## ✨ Summary

### Before (Insecure):
- ❌ Users could register as admin
- ❌ Anyone could promote themselves
- ❌ Major security vulnerability

### After (Secure):
- ✅ All new registrations default to "user"
- ✅ Only admins can change user roles
- ✅ Proper access control implemented
- ✅ Security best practices followed

---

## 🚀 Deployment

1. **Commit the changes**:
```bash
git add backend/routes/authRoutes.js backend/routes/adminRoutes.js
git commit -m "Fix user role security vulnerability - prevent self-promotion to admin"
git push
```

2. **Deploy to production** (Render will auto-deploy)

3. **Test on production**:
   - Try to register as admin → Should fail
   - Admin can change user roles → Should work

---

**Status**: ✅ **FIXED - Critical Security Vulnerability Resolved**
**Date**: October 27, 2025
**Severity**: High (Unauthorized Privilege Escalation)
**Files Changed**: 2 files
- `backend/routes/authRoutes.js` - Fixed registration & Google login
- `backend/routes/adminRoutes.js` - Added role management endpoint

