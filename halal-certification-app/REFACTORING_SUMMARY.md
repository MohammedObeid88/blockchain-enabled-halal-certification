 React App Refactoring - Halal Certification Dashboard

## Overview
The monolithic `App.js` file has been completely refactored into a scalable, component-based React architecture while maintaining all core functionality.

## Architecture Changes

### Directory Structure
```
src/
├── components/
│   ├── ApplicationCard.jsx          (New: Reusable application card component)
│   ├── FileDisplay.jsx              (New: Reusable file display component)
│   ├── PopupModal.jsx               (New: Reusable modal component)
│   ├── ResponseMessage.jsx          (New: Reusable response message component)
│   ├── requestHalalCertification.jsx (Existing)
│   └── ... (other components)
├── hooks/
│   ├── useApi.js                    (New: API calls and response management)
│   ├── useApplicationState.js       (New: Application state management)
│   ├── useApplication.js            (Existing)
│   ├── useAuth.js                   (Existing)
│   └── useFile.js                   (Existing)
├── pages/
│   ├── ManufacturerPage.jsx         (New: Org1 business logic)
│   └── CertifierPage.jsx            (New: Org2 business logic)
├── services/
│   └── authContext.jsx              (Existing)
├── utils/
│   ├── constants.js                 (New: All constants in one place)
│   └── apiClient.js                 (New: Centralized API client)
├── App.js                           (Refactored: Now slim and maintainable)
└── App.css                          (Existing)
```

## Key Improvements

### 1. **Separation of Concerns**
- **App.js**: Navigation and routing logic only
- **ManufacturerPage.jsx**: All org1 (manufacturer) features
- **CertifierPage.jsx**: All org2 (certifier) features
- Each component has single responsibility

### 2. **Custom Hooks for Logic Reuse**
#### `useApi.js` - API and Response Management
- `useApi()`: Base hook for response/error state
- `useApplicationAPI()`: Application-related API calls
- `useFileUpload()`: File upload operations

#### `useApplicationState.js` - Global State
- Manages `applicationDetails`, `uploadedFiles`, popup state
- Provides methods to add, update, reset applications
- Controls modal/overlay visibility

#### `apiClient.js` - Centralized HTTP Client
- Single source for all API requests
- Automatic error handling
- Timestamp formatting

### 3. **Reusable UI Components**
- `ApplicationCard.jsx`: Display application details with actions
- `FileDisplay.jsx`: Display uploaded files with preview
- `PopupModal.jsx`: Consistent modal dialogs
- `ResponseMessage.jsx`: Display API responses

### 4. **Constants Centralization** (`constants.js`)
- API endpoints
- Status constants
- File types
- Popup types
- Organization IDs
- Timezone formatting

### 5. **Code Reduction**
- **Before**: 854 lines in App.js
- **After**: 61 lines in App.js
- Removed ~400 lines of duplicate popup/modal logic
- Created reusable components and hooks

## Feature Parity

All original functionality is preserved:

### Manufacturer (Org1) Features
✅ Request Halal Certification
✅ Submit Ingredients List
✅ View Submitted Applications
✅ Cancel Requests
✅ Appeal Rejections
✅ Upload ingredients files

### Certifier (Org2) Features
✅ View Received Applications
✅ Approve/Reject Certifications
✅ Check Appeals
✅ Upload Certificates
✅ Upload Certificates After Appeal
✅ Check Compliance

### General Features
✅ User Authentication
✅ Logout
✅ Response Messages
✅ Error Handling
✅ Loading States

## Migration Benefits

1. **Maintainability**: Easier to locate and modify features
2. **Scalability**: Easy to add new components and features
3. **Testability**: Isolated components and hooks are easier to test
4. **Code Reuse**: Custom hooks and components reduce duplication
5. **State Management**: Clear separation of local vs app state
6. **Type Safety**: Can easily add TypeScript later

## How to Use

The refactored app maintains the same user experience:

1. Login with credentials
2. User is routed to their organization's page (Manufacturer or Certifier)
3. Perform organization-specific actions
4. Responses appear in real-time

## Future Enhancements

With this architecture, you can easily:
- Add Context API or Redux for state management
- Convert to TypeScript for type safety
- Add unit/integration tests
- Implement additional pages and features
- Add theming system
- Implement analytics
