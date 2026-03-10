# Expert Panel APIs Documentation

## Overview

This document outlines all the APIs for the Expert Panel in the DigitalOffices platform. The APIs are organized into domain-specific modules for better scalability and maintainability.

## Authentication

All expert APIs require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Modules

### 1. Expert Profile APIs

#### Get Expert Profile
```http
GET /experts/profile
```

**Response:**
```json
{
  "id": "expert_123",
  "bio": "10 years experience",
  "experience": 10,
  "specialization": "Corporate Tax",
  "consultationFee": 2000,
  "languages": ["English", "Hindi"],
  "profileImage": null,
  "introVideo": null,
  "verificationStatus": "PENDING_INITIAL",
  "hasPendingUpdates": false
}
```

#### Update Expert Profile
```http
PUT /experts/profile
```

**Request Body:**
```json
{
  "bio": "10 years experience",
  "experience": 10,
  "specialization": "Corporate Tax",
  "consultationFee": 2000,
  "languages": ["English", "Hindi"]
}
```

**Response:**
```json
{
  "message": "Profile update submitted for admin approval",
  "status": "PENDING_APPROVAL"
}
```

#### Upload Profile Image
```http
POST /experts/profile/image
Content-Type: multipart/form-data
```

**Request:** Form data with file field named "file"

**Response:**
```json
{
  "message": "Profile image uploaded successfully",
  "fileUrl": "/uploads/profile-images/abc123.jpg",
  "status": "PENDING_APPROVAL"
}
```

#### Upload Intro Video
```http
POST /experts/profile/intro-video
Content-Type: multipart/form-data
```

**Request:** Form data with file field named "file"

**Response:**
```json
{
  "message": "Intro video uploaded successfully",
  "fileUrl": "/uploads/intro-videos/xyz123.mp4",
  "status": "PENDING_APPROVAL"
}
```

### 2. Verification APIs

#### Upload Verification Documents
```http
POST /experts/verification/documents
Content-Type: multipart/form-data
```

**Request:** 
- File field named "file"
- Form field "documentType" (degree_certificate, professional_license, identity_proof, address_proof)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "documentType": "degree_certificate",
  "fileUrl": "/uploads/verification-documents/doc123.pdf",
  "status": "PENDING_REVIEW"
}
```

#### Get Verification Status
```http
GET /experts/verification/status
```

**Response:**
```json
{
  "status": "PENDING_INITIAL",
  "documents": [
    {
      "id": "doc_1",
      "documentType": "degree_certificate",
      "fileUrl": "/uploads/verification-documents/certificate.pdf",
      "status": "PENDING_REVIEW",
      "uploadedAt": "2024-03-10T14:30:00Z"
    }
  ]
}
```

**Possible Statuses:**
- `ONBOARDING`
- `PENDING_INITIAL`
- `REJECTED`
- `LIVE`

### 3. Organization Membership APIs

#### List Organizations
```http
GET /organizations?search=tax
```

**Response:**
```json
[
  {
    "id": "org_123",
    "name": "Tech Consultants Ltd",
    "description": "Leading technology consulting firm",
    "industry": "Technology",
    "location": "San Francisco, CA",
    "verified": true,
    "memberCount": 150,
    "rating": 4.8
  }
]
```

#### Request To Join Organization
```http
POST /experts/organization/request
```

**Request Body:**
```json
{
  "organizationId": "org_123"
}
```

**Response:**
```json
{
  "message": "Join request sent successfully",
  "requestId": "req_123456789",
  "organizationId": "org_123",
  "status": "PENDING",
  "createdAt": "2024-03-10T14:30:00Z"
}
```

#### Cancel Join Request
```http
DELETE /experts/organization/request/:requestId
```

**Response:**
```json
{
  "message": "Join request cancelled successfully",
  "requestId": "req_123456789"
}
```

#### View My Organizations
```http
GET /experts/organizations
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "org_123",
      "name": "Tech Consultants Ltd",
      "role": "Senior Consultant",
      "joinedAt": "2024-01-15T10:30:00Z",
      "status": "ACTIVE"
    }
  ],
  "pendingRequests": [
    {
      "id": "req_789",
      "organizationId": "org_456",
      "organizationName": "Financial Advisors Group",
      "requestedAt": "2024-03-10T14:20:00Z",
      "status": "PENDING"
    }
  ]
}
```

#### Leave Organization
```http
DELETE /experts/organizations/:organizationId
```

**Response:**
```json
{
  "message": "Left organization successfully",
  "organizationId": "org_123",
  "leftAt": "2024-03-10T15:00:00Z"
}
```

### 4. Availability & Schedule APIs

#### Set Availability
```http
POST /experts/availability
```

**Request Body:**
```json
{
  "day": "Monday",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Response:**
```json
{
  "message": "Availability set successfully",
  "availability": {
    "id": "avail_123",
    "expertId": "expert_123",
    "day": "Monday",
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true,
    "createdAt": "2024-03-10T14:30:00Z"
  }
}
```

#### Update Availability
```http
PUT /experts/availability/:id
```

**Request Body:**
```json
{
  "day": "Tuesday",
  "startTime": "10:00",
  "endTime": "18:00"
}
```

#### Get Availability
```http
GET /experts/availability
```

**Response:**
```json
{
  "availability": [
    {
      "id": "avail_1",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true
    }
  ],
  "blockedSlots": [
    {
      "id": "block_1",
      "startDate": "2024-12-25T00:00:00Z",
      "endDate": "2024-12-25T23:59:59Z",
      "reason": "Christmas Holiday"
    }
  ]
}
```

#### Block Time Slot
```http
POST /experts/availability/block
```

**Request Body:**
```json
{
  "startDate": "2024-12-25T00:00:00Z",
  "endDate": "2024-12-25T23:59:59Z",
  "reason": "Christmas Holiday"
}
```

**Response:**
```json
{
  "message": "Time slot blocked successfully",
  "blockedSlot": {
    "id": "block_123",
    "expertId": "expert_123",
    "startDate": "2024-12-25T00:00:00Z",
    "endDate": "2024-12-25T23:59:59Z",
    "reason": "Christmas Holiday",
    "createdAt": "2024-03-10T14:30:00Z"
  }
}
```

### 5. Booking APIs

#### Get Expert Bookings
```http
GET /experts/bookings?status=upcoming
```

**Query Parameters:**
- `status` (optional): upcoming, completed, cancelled, pending

**Response:**
```json
[
  {
    "id": "booking_1",
    "clientId": "client_123",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "service": "Tax Consultation",
    "consultationType": "online",
    "scheduledDate": "2024-03-15T10:00:00Z",
    "duration": 60,
    "amount": 2000,
    "status": "upcoming",
    "paymentStatus": "paid",
    "createdAt": "2024-03-10T14:30:00Z"
  }
]
```

#### Get Booking Details
```http
GET /experts/bookings/:bookingId
```

**Response:**
```json
{
  "id": "booking_1",
  "clientId": "client_123",
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "clientPhone": "+1234567890",
  "service": "Tax Consultation",
  "consultationType": "online",
  "scheduledDate": "2024-03-15T10:00:00Z",
  "duration": 60,
  "amount": 2000,
  "status": "upcoming",
  "paymentStatus": "paid",
  "meetingUrl": "https://meet.example.com/room/abc123",
  "notes": "Client needs help with tax filing for small business",
  "createdAt": "2024-03-10T14:30:00Z",
  "updatedAt": "2024-03-10T14:30:00Z"
}
```

#### Accept Booking
```http
POST /experts/bookings/:bookingId/accept
```

**Response:**
```json
{
  "message": "Booking accepted successfully",
  "bookingId": "booking_1",
  "status": "confirmed",
  "acceptedAt": "2024-03-10T14:35:00Z"
}
```

#### Reject Booking
```http
POST /experts/bookings/:bookingId/reject
```

**Request Body:**
```json
{
  "reason": "Expert unavailable"
}
```

**Response:**
```json
{
  "message": "Booking rejected successfully",
  "bookingId": "booking_1",
  "status": "rejected",
  "reason": "Expert unavailable",
  "rejectedAt": "2024-03-10T14:35:00Z"
}
```

#### Cancel Booking
```http
POST /experts/bookings/:bookingId/cancel
```

**Request Body:**
```json
{
  "reason": "Emergency situation"
}
```

**Response:**
```json
{
  "message": "Booking cancelled successfully",
  "bookingId": "booking_1",
  "status": "cancelled",
  "reason": "Emergency situation",
  "cancelledAt": "2024-03-10T14:35:00Z",
  "refundProcessed": true
}
```

### 6. Session APIs

#### Start Session
```http
POST /experts/sessions/:bookingId/start
```

**Response:**
```json
{
  "message": "Session started successfully",
  "sessionId": "session_123",
  "meetingUrl": "https://meet.example.com/room/session_123",
  "bookingId": "booking_1",
  "startedAt": "2024-03-15T10:00:00Z"
}
```

#### Join Session
```http
GET /experts/sessions/:bookingId/join
```

**Response:**
```json
{
  "meetingUrl": "https://meet.example.com/room/session_123",
  "sessionId": "session_123",
  "expertId": "expert_123",
  "bookingId": "booking_1",
  "isActive": true,
  "participantCount": 2
}
```

#### End Session
```http
POST /experts/sessions/:bookingId/end
```

**Response:**
```json
{
  "message": "Session ended successfully",
  "bookingId": "booking_1",
  "endedAt": "2024-03-15T10:45:00Z",
  "duration": 45,
  "amountEarned": 2000
}
```

#### Create Whiteboard Session
```http
POST /experts/sessions/:sessionId/whiteboard
```

**Response:**
```json
{
  "message": "Whiteboard session created",
  "whiteboardId": "wb_123",
  "sessionId": "session_123",
  "whiteboardUrl": "https://whiteboard.example.com/board/wb_123",
  "createdAt": "2024-03-15T10:15:00Z"
}
```

#### Save Whiteboard
```http
POST /experts/sessions/:sessionId/whiteboard/save
```

**Response:**
```json
{
  "message": "Whiteboard saved successfully",
  "sessionId": "session_123",
  "savedAt": "2024-03-15T10:45:00Z",
  "downloadUrl": "https://whiteboard.example.com/download/wb_123.png"
}
```

### 7. Earnings & Payments APIs

#### Get Earnings Summary
```http
GET /experts/earnings/summary
```

**Response:**
```json
{
  "totalEarnings": 50000,
  "pendingPayout": 10000,
  "completedPayout": 40000,
  "thisMonthEarnings": 12000,
  "lastMonthEarnings": 8500,
  "averagePerSession": 2000,
  "totalSessions": 25,
  "currency": "USD"
}
```

#### Get Transactions
```http
GET /experts/earnings/transactions?page=1&limit=10
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_1",
      "bookingId": "booking_1",
      "amount": 2000,
      "commission": 200,
      "netAmount": 1800,
      "status": "completed",
      "type": "session_payment",
      "description": "Tax Consultation - Online",
      "createdAt": "2024-03-10T14:30:00Z",
      "completedAt": "2024-03-10T16:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Payout History
```http
GET /experts/payouts?page=1&limit=10
```

**Response:**
```json
{
  "payouts": [
    {
      "id": "payout_1",
      "amount": 1800,
      "status": "completed",
      "method": "bank_transfer",
      "bankAccount": "****1234",
      "processedAt": "2024-03-08T12:00:00Z",
      "createdAt": "2024-03-08T10:00:00Z",
      "transactionId": "TXN123456789"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 8. Notification APIs

#### Get Notifications
```http
GET /experts/notifications?page=1&limit=10&unreadOnly=false
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_1",
      "title": "New Booking Request",
      "message": "John Doe has requested a Tax Consultation for March 15, 2024",
      "type": "booking_request",
      "isRead": false,
      "createdAt": "2024-03-10T14:30:00Z",
      "data": {
        "bookingId": "booking_1",
        "clientId": "client_123",
        "clientName": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "unreadCount": 3
}
```

#### Mark Notification Read
```http
POST /experts/notifications/:id/read
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "notificationId": "notif_1",
  "markedAt": "2024-03-10T15:00:00Z"
}
```

#### Mark All Notifications Read
```http
POST /experts/notifications/mark-all-read
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "markedAt": "2024-03-10T15:00:00Z",
  "count": 3
}
```

#### Get Unread Count
```http
GET /experts/notifications/unread-count
```

**Response:**
```json
{
  "unreadCount": 3,
  "totalCount": 10
}
```

### 9. Dashboard APIs

#### Get Dashboard Metrics
```http
GET /experts/dashboard
```

**Response:**
```json
{
  "todayBookings": 5,
  "upcomingBookings": 12,
  "completedSessions": 200,
  "earningsThisMonth": 12000,
  "status": "LIVE",
  "onboarding": null,
  "rejectionReason": null,
  "profile": {
    "hasPendingUpdates": false
  }
}
```

## Error Responses

All APIs return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid input data"
}
```

## File Upload Constraints

- **Profile Images**: Max 5MB, formats: jpg, jpeg, png, gif
- **Intro Videos**: Max 50MB, formats: mp4, avi, mov, wmv
- **Verification Documents**: Max 10MB, formats: pdf, jpg, jpeg, png

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Profile updates: 5 per hour
- File uploads: 10 per hour
- Other endpoints: 100 per hour

## Webhooks

The system supports webhooks for real-time notifications:
- New booking requests
- Booking status changes
- Payment notifications
- Profile approval updates

## Testing

The API includes mock data for testing purposes. Replace the TODO comments in service files with actual database implementations for production use.
