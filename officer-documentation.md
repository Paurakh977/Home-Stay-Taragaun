# Officer Management System Documentation

## Overview

The Officer Management System provides functionality for admins to create and manage officers within the Hamro Home Stay application. Officers are users with limited permissions who can assist admins in managing homestay listings and related operations.

## Officer Data Model

### Core Structure

Officers are stored in the same collection as other users but with a dedicated role of 'officer'. The officer data model includes:

- **_id**: Unique MongoDB ObjectId
- **username**: Unique username for login
- **password**: Hashed password (using bcrypt)
- **email**: Contact email
- **contactNumber**: Phone number
- **role**: Set to 'officer'
- **isActive**: Boolean flag to enable/disable account
- **permissions**: Object containing permission flags
- **parentAdmin**: Username of the admin who created this officer
- **createdAt**: Timestamp of creation
- **updatedAt**: Timestamp of last update

### Permissions Structure

Officers can have the following permissions, each controlled by a boolean flag:

- **adminDashboardAccess**: Access to the admin dashboard
- **homestayApproval**: Can approve/reject homestay listings
- **homestayEdit**: Can edit homestay information
- **homestayDelete**: Can delete homestay listings
- **documentUpload**: Can upload documents for homestays
- **imageUpload**: Can upload images for homestays

Only permissions that the parent admin possesses can be granted to their officers.

## Officer Creation Process

### Frontend Flow

1. Admin navigates to `/admin/{adminUsername}/officer/create`
2. Admin fills out the officer creation form with:
   - Username
   - Password
   - Email
   - Contact Number
   - Active status
   - Permissions (limited to permissions the admin has)
3. Form submission sends data to the backend API

### Backend API Process

1. API endpoint: `POST /api/admin/officer/create`
2. Authentication verification checks:
   - Valid admin token
   - Token matches the admin creating the officer
3. Field validation:
   - Required fields: username, password, email, contactNumber, adminUsername
   - Username and email uniqueness
4. Permissions filtering:
   - Only permissions the admin possesses can be granted
   - Superadmins can grant any permission
5. Officer creation in database:
   - Password is hashed
   - Role is set to 'officer'
   - ParentAdmin is set to the creating admin's username
6. Response with created officer data (password excluded)

### Security Measures

- Only admins can create officers
- Admins can only create officers for themselves
- Superadmins can create officers for any admin
- Officers can only have a subset of their parent admin's permissions
- Password is hashed before storage

## Officer Management Functions

### Officer Listing

1. Frontend displays a table of officers at `/admin/{adminUsername}/officer/list`
2. Data fetched from `GET /api/admin/officer/list?adminUsername={adminUsername}`
3. Features:
   - Search by username, email, or contact number
   - Sorting by creation date
   - Status indication (Active/Inactive)
   - Action buttons for each officer

### Officer Status Toggle

1. Click on eye/eye-off icon to activate/deactivate an officer
2. API endpoint: `POST /api/admin/officer/update-status`
3. Process:
   - Authentication verification
   - Ownership verification (admin can only modify their own officers)
   - Status update in database
   - State update in UI

### Officer Password Reset

1. Click on key icon to open password reset modal
2. System generates a random secure password
3. Admin can modify the password if needed
4. API endpoint: `POST /api/admin/officer/reset-password`
5. Process:
   - Authentication verification
   - Ownership verification
   - Password hashing
   - Update in database

### Officer Deletion

1. Click on trash icon to open deletion confirmation modal
2. Confirm deletion via modal
3. API endpoint: `POST /api/admin/officer/delete`
4. Process:
   - Authentication verification
   - Ownership verification
   - Permanent removal from database
   - State update in UI

## API Endpoints

### Officer Creation
- **Endpoint**: `POST /api/admin/officer/create`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "username": "officer_username",
    "password": "password123",
    "email": "officer@example.com",
    "contactNumber": "9812345678",
    "permissions": {
      "adminDashboardAccess": true,
      "homestayApproval": true,
      "homestayEdit": false,
      "homestayDelete": false,
      "documentUpload": true,
      "imageUpload": true
    },
    "isActive": true,
    "adminUsername": "admin1"
  }
  ```
- **Response**: Officer object with success message

### Officer Listing
- **Endpoint**: `GET /api/admin/officer/list?adminUsername={adminUsername}`
- **Authentication**: Required
- **Response**: Array of officer objects

### Update Officer Status
- **Endpoint**: `POST /api/admin/officer/update-status`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "officerId": "680201defb7a6522f49376bc",
    "isActive": true,
    "adminUsername": "admin1"
  }
  ```
- **Response**: Success message

### Reset Officer Password
- **Endpoint**: `POST /api/admin/officer/reset-password`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "officerId": "680201defb7a6522f49376bc",
    "newPassword": "newPassword123",
    "adminUsername": "admin1"
  }
  ```
- **Response**: Success message

### Delete Officer
- **Endpoint**: `POST /api/admin/officer/delete`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "officerId": "680201defb7a6522f49376bc", 
    "adminUsername": "admin1",
    "_method": "DELETE"
  }
  ```
- **Response**: Success message

## Implementation Details

### Authentication Flow

1. Admin login creates and stores a JWT token in cookies
2. Token includes admin ID, username, role, and isAdmin flag
3. API endpoints verify token validity before processing requests
4. For officer management, the API also verifies:
   - Token belongs to an admin/superadmin
   - Admin owns the officer being managed

### Permission Inheritance Model

Officers inherit permissions from their parent admin with these rules:
- Admin can only grant permissions they possess
- An admin's permissions limit what their officers can do
- Superadmins can grant any permission
- An officer's permissions can be a subset of their admin's permissions, never more

### Data Validation and Security

1. Input validation on both frontend and backend
2. SQL injection protection through MongoDB's document model
3. XSS protection with proper React rendering
4. CSRF protection with token validation
5. Password security:
   - Bcrypt hashing with salt
   - Generated passwords are complex
   - Passwords never returned to frontend

## Technical Implementation

### Frontend Components

- **Officer Create Page**: Form for creating new officers
- **Officer List Page**: Table display with search and actions
- **Confirmation Modals**: For password reset and deletion
- **Admin Sidebar**: Navigation between officer management features

### Backend Structure

- **Route Handlers**: Process API requests
- **Authentication Middleware**: Verify user tokens
- **Service Layer**: Handle business logic
- **Model Layer**: Interface with MongoDB

### State Management

The application uses React's useState and useEffect hooks for state management:
- **officers**: Array of officer data from API
- **loading**: Boolean for loading states
- **actionLoading**: Boolean for action button loading states
- **searchTerm**: String for filtering the officer list
- **selectedOfficer**: Currently selected officer for modals
- **modalStates**: Boolean flags for opening/closing modals 