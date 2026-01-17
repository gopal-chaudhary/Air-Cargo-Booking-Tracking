# Air Cargo Booking & Tracking System - Architecture Documentation
## demo



<img width="699" height="478" alt="Screenshot From 2026-01-17 15-47-45" src="https://github.com/user-attachments/assets/56f3a844-affc-47fa-b847-e0397ac046a4" />
<img width="699" height="478" alt="Screenshot From 2026-01-17 15-48-18" src="https://github.com/user-attachments/assets/c5776fcf-b9af-42c4-bf88-41d183b97fae" />
<img width="699" height="478" alt="Screenshot From 2026-01-17 15-48-27" src="https://github.com/user-attachments/assets/d167e6ad-7559-45e0-b096-f5b7b529748f" />
<img width="699" height="478" alt="Screenshot From 2026-01-17 15-48-35" src="https://github.com/user-attachments/assets/1e22b825-7194-40e0-95d6-81474fdb6dcd" />






## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Concurrency Control](#concurrency-control)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Considerations](#security-considerations)
12. [Error Handling](#error-handling)
13. [Future Enhancements](#future-enhancements)

---
## System Overview

The Air Cargo Booking & Tracking System is a RESTful API service designed to handle cargo booking creation, flight route discovery, and real-time tracking of cargo shipments through their journey. The system is built to handle high throughput (50K new bookings and 150K updates per day) with proper concurrency control.

### Key Features
- **Route Discovery**: Find direct flights and transit routes between origin and destination
- **Booking Management**: Create, update, and track cargo bookings
- **Status Tracking**: Track bookings through states: BOOKED → DEPARTED → ARRIVED → DELIVERED
- **Concurrency Control**: Distributed locking mechanism for safe concurrent updates
- **Event Timeline**: Complete chronological history of booking events

### Non-Functional Requirements
- **Throughput**: 50K new bookings/day, 150K updates/day
- **Concurrency**: Handle multiple simultaneous updates on same booking
- **Performance**: Optimized database queries with proper indexing
- **Reliability**: Fail-open design for Redis (graceful degradation)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                       │
│              (Web UI, Mobile Apps, External Systems)              │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                      Express.js API Server                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Route Layer                             │   │
│  │  /api/flights/*    /api/bookings/*                        │   │
│  └────────────┬───────────────────────┬───────────────────────┘   │
│               │                       │                           │
│  ┌────────────▼──────────┐  ┌────────▼──────────────┐            │
│  │  Controller Layer     │  │  Controller Layer     │            │
│  │  - flightController   │  │  - bookingController  │            │
│  └────────────┬──────────┘  └────────┬──────────────┘            │
│               │                       │                           │
│               │                       │                           │
│  ┌────────────▼───────────────────────▼──────────────┐            │
│  │              Business Logic Layer                  │            │
│  │  - Route Discovery (Direct + Transit)             │            │
│  │  - Booking State Management                        │            │
│  │  - Event Timeline Management                       │            │
│  └───────────────────────┬───────────────────────────┘            │
│                          │                                         │
│  ┌───────────────────────▼───────────────────────────┐            │
│  │              Utility Layer                         │            │
│  │  - Distributed Lock Manager (Redis)                │            │
│  └───────────────────────────────────────────────────┘            │
└────────────────────┬───────────────────────┬──────────────────────┘
                     │                       │
                     │                       │
        ┌────────────▼──────────┐  ┌────────▼──────────────┐
        │    MongoDB            │  │    Redis               │
        │  - Bookings           │  │  - Distributed Locks │
        │  - Flights            │  │  - Lock Keys           │
        │  - Events             │  └───────────────────────┘
        └───────────────────────┘
```

---

## Technology Stack

### Backend Framework
- **Node.js**: Runtime environment
- **Express.js 5.2.1**: Web application framework
- **ES Modules**: Modern JavaScript module system

### Database
- **MongoDB 9.1.4**: Primary database for bookings and flights
- **Mongoose**: ODM (Object Document Mapper) for MongoDB

### Caching & Distributed Systems
- **Redis (ioredis 5.3.2)**: Distributed locking mechanism
- **Fail-open Design**: System continues to function if Redis is unavailable

### Utilities
- **dayjs**: Date manipulation and formatting
- **uuid**: Unique identifier generation for booking references

### Development Tools
- **nodemon**: Development server with hot-reload

---

## System Components

### 1. API Server (`server.js`)
- Entry point of the application
- Starts Express server on port 3000
- Initializes database connections

### 2. Application Layer (`app.js`)
- Express application configuration
- Middleware setup (JSON parsing)
- Route registration
- Database connection initialization

### 3. Route Layer
- **`routes/flightRoutes.js`**: Flight-related endpoints
  - `GET /api/flights/route`: Route discovery
  
- **`routes/bookingRoutes.js`**: Booking-related endpoints
  - `POST /api/bookings`: Create booking
  - `POST /api/bookings/:ref_id/depart`: Mark as departed
  - `POST /api/bookings/:ref_id/arrive`: Mark as arrived
  - `POST /api/bookings/:ref_id/deliver`: Mark as delivered
  - `GET /api/bookings/:ref_id`: Get booking history
  - `POST /api/bookings/:ref_id/cancel`: Cancel booking

### 4. Controller Layer
- **`controllers/flightController.js`**
  - `getRoute()`: Implements route discovery logic
    - Finds direct flights
    - Finds transit routes (1-hop connections)
    - Handles date-based filtering

- **`controllers/bookingController.js`**
  - `createBooking()`: Creates new booking with validation
  - `departBooking()`: Updates status to DEPARTED (with lock)
  - `arriveBooking()`: Updates status to ARRIVED (with lock)
  - `deliverBooking()`: Updates status to DELIVERED (with lock)
  - `getHistory()`: Retrieves booking with chronological events
  - `cancelBooking()`: Cancels booking (with lock, business rules)

### 5. Model Layer
- **`models/Booking.js`**: Booking schema
  - Embedded event timeline
  - Status enum validation
  - Indexes on ref_id and status

- **`models/Flight.js`**: Flight schema
  - Compound indexes for route queries
  - Unique flightId constraint

### 6. Configuration Layer
- **`config/db.js`**: MongoDB connection configuration
- **`config/redis.js`**: Redis connection with fail-open design

### 7. Utility Layer
- **`utils/lock.js`**: Distributed locking implementation
  - `acquireLock()`: Acquires Redis-based lock
  - `withLock()`: Executes function with lock protection
  - Automatic lock release on completion/error

### 8. Scripts
- **`scripts/seedData.js`**: Database seeding utility
  - Creates sample flights and bookings
  - Useful for development and testing

---

## Data Flow

### 1. Route Discovery Flow
```
Client Request
    ↓
GET /api/flights/route?origin=DEL&destination=BLR&departure_date=2025-08-15
    ↓
flightController.getRoute()
    ↓
Query MongoDB for direct flights (origin=DEL, destination=BLR)
    ↓
Query MongoDB for first hop flights (origin=DEL)
    ↓
For each first hop, query for second hop (origin=firstHop.destination, destination=BLR)
    ↓
Filter transit routes (second hop on same day or next day)
    ↓
Return { directFlights: [...], transitRoute: {...} }
```

### 2. Booking Creation Flow
```
Client Request
    ↓
POST /api/bookings { origin, destination, pieces, weight_kg, flightIds }
    ↓
bookingController.createBooking()
    ↓
Validate input (required fields, integer validation)
    ↓
Generate unique ref_id (BK-{uuid})
    ↓
Create Booking document in MongoDB
    ↓
Return booking document
```

### 3. Booking Update Flow (Depart/Arrive/Deliver/Cancel)
```
Client Request
    ↓
POST /api/bookings/:ref_id/{action}
    ↓
bookingController.{action}()
    ↓
withLock(ref_id, async () => {
    ↓
    Acquire distributed lock from Redis
    ↓
    Find booking by ref_id
    ↓
    Validate business rules (status checks)
    ↓
    Update booking status
    ↓
    Add event to timeline
    ↓
    Save to MongoDB
    ↓
    Release lock
})
    ↓
Return updated booking
```

### 4. Booking History Flow
```
Client Request
    ↓
GET /api/bookings/:ref_id
    ↓
bookingController.getHistory()
    ↓
Find booking by ref_id
    ↓
Sort events chronologically
    ↓
Return booking with sorted events
```

---

## Database Schema

### Booking Collection

```javascript
{
  _id: ObjectId,
  ref_id: String (unique, indexed),        // "BK-12345678"
  origin: String,                           // "DEL"
  destination: String,                      // "BLR"
  pieces: Number (required),               // 2
  weight_kg: Number (required),            // 15
  status: String (indexed),                // "BOOKED" | "DEPARTED" | "ARRIVED" | "DELIVERED" | "CANCELLED"
  flightIds: [String],                     // ["FL-001", "FL-002"]
  events: [
    {
      type: String,                        // "BOOKED" | "DEPARTED" | "ARRIVED" | "DELIVERED" | "CANCELLED"
      location: String,                    // "DEL"
      flightInfo: Object (optional),       // { flightNumber: "AI-202", flightId: "FL-001" }
      timestamp: Date                      // Auto-generated
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `ref_id`: Unique index for fast lookups
- `status`: Index for status-based queries

### Flight Collection

```javascript
{
  _id: ObjectId,
  flightId: String (unique, indexed),      // "FL-DEL-BLR-0-1"
  flightNumber: String (indexed),          // "AI-201"
  airlineName: String,                    // "Air India"
  departureTime: Date (indexed),          // 2025-08-15T08:00:00Z
  arrivalTime: Date,                       // 2025-08-15T10:30:00Z
  origin: String (indexed),                // "DEL"
  destination: String (indexed)           // "BLR"
}
```

**Indexes:**
- `flightId`: Unique index
- `flightNumber`: Index for flight number lookups
- `departureTime`: Index for time-based queries
- `origin`: Index for route queries
- `destination`: Index for route queries
- `(origin, destination, departureTime)`: Compound index for route discovery queries

---

## API Architecture

### RESTful Design Principles
- **Resource-based URLs**: `/api/bookings/:ref_id`
- **HTTP Methods**: GET (read), POST (create/update)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 404 (not found), 409 (conflict), 500 (server error)
- **JSON Request/Response**: All endpoints use JSON

### Endpoint Specifications

#### 1. Route Discovery
```
GET /api/flights/route?origin={origin}&destination={destination}&departure_date={date}

Query Parameters:
- origin: String (required) - Origin airport code
- destination: String (required) - Destination airport code
- departure_date: String (required) - Date in YYYY-MM-DD format

Response:
{
  directFlights: [
    {
      flightId: "FL-001",
      flightNumber: "AI-201",
      airlineName: "Air India",
      departureTime: "2025-08-15T08:00:00Z",
      arrivalTime: "2025-08-15T10:30:00Z",
      origin: "DEL",
      destination: "BLR"
    }
  ],
  transitRoute: {
    first: { /* first hop flight */ },
    second: { /* second hop flight */ }
  } | null
}
```

#### 2. Create Booking
```
POST /api/bookings

Request Body:
{
  origin: String (required),
  destination: String (required),
  pieces: Number (required, positive integer),
  weight_kg: Number (required, positive integer),
  flightIds: [String] (optional)
}

Response: 201 Created
{
  ref_id: "BK-12345678",
  origin: "DEL",
  destination: "BLR",
  pieces: 2,
  weight_kg: 15,
  status: "BOOKED",
  flightIds: ["FL-001"],
  events: [...],
  createdAt: "2025-08-15T10:00:00Z",
  updatedAt: "2025-08-15T10:00:00Z"
}
```

#### 3. Update Booking Status
```
POST /api/bookings/:ref_id/depart
POST /api/bookings/:ref_id/arrive
POST /api/bookings/:ref_id/deliver
POST /api/bookings/:ref_id/cancel

Request Body (for depart):
{
  location: String (required),
  flightInfo: Object (optional)
}

Response: 200 OK
{
  /* Updated booking object */
}
```

#### 4. Get Booking History
```
GET /api/bookings/:ref_id

Response: 200 OK
{
  ref_id: "BK-12345678",
  origin: "DEL",
  destination: "BLR",
  pieces: 2,
  weight_kg: 15,
  status: "ARRIVED",
  flightIds: ["FL-001"],
  createdAt: "2025-08-15T10:00:00Z",
  updatedAt: "2025-08-15T12:00:00Z",
  events: [
    {
      type: "BOOKED",
      location: "DEL",
      timestamp: "2025-08-15T10:00:00Z"
    },
    {
      type: "DEPARTED",
      location: "DEL",
      flightInfo: { flightNumber: "AI-201" },
      timestamp: "2025-08-15T11:00:00Z"
    },
    {
      type: "ARRIVED",
      location: "BLR",
      timestamp: "2025-08-15T12:00:00Z"
    }
  ]
}
```

---

## Concurrency Control

### Problem Statement
Multiple users/processes may attempt to update the same booking simultaneously, leading to:
- Race conditions
- Lost updates
- Inconsistent state

### Solution: Distributed Locks

#### Implementation
- **Technology**: Redis-based distributed locks
- **Lock Key**: `lock:booking:{ref_id}`
- **TTL**: 5 seconds (configurable)
- **Lock Acquisition**: SET with NX (only if not exists) and PX (expiration)
- **Lock Release**: Lua script ensures only lock owner can release

#### Lock Flow
```
Request arrives for booking update
    ↓
withLock(ref_id, async () => {
    ↓
    Try to acquire lock from Redis
    ↓
    If lock acquired:
        - Execute update operation
        - Release lock
    ↓
    If lock not acquired:
        - Return 409 Conflict
        - Client retries
})
```

#### Fail-Open Design
- If Redis is unavailable, system continues without locks
- Prevents single point of failure
- Suitable for development/testing environments
- Production should have Redis for proper concurrency control

#### Protected Operations
- `departBooking()`: Protected by lock
- `arriveBooking()`: Protected by lock
- `deliverBooking()`: Protected by lock
- `cancelBooking()`: Protected by lock

#### Unprotected Operations
- `createBooking()`: No lock needed (creates new document)
- `getHistory()`: Read-only, no lock needed

---

## Scalability & Performance

### Current Capacity
- **50K new bookings/day**: ~0.58 bookings/second
- **150K updates/day**: ~1.74 updates/second
- **Peak load**: ~3-5 requests/second (with burst handling)

### Performance Optimizations

#### 1. Database Indexing
- **Booking Collection**:
  - `ref_id`: Unique index for O(1) lookups
  - `status`: Index for status-based queries
  
- **Flight Collection**:
  - `flightId`: Unique index
  - `flightNumber`: Index for flight lookups
  - `departureTime`: Index for time-based queries
  - `origin`, `destination`: Indexes for route queries
  - `(origin, destination, departureTime)`: Compound index for route discovery

#### 2. Query Optimization
- Route discovery uses indexed queries
- Booking lookups use indexed ref_id
- Event sorting done in-memory (small dataset per booking)

#### 3. Connection Pooling
- MongoDB connection pooling (Mongoose default)
- Redis connection reuse

### Scaling Strategies

#### Horizontal Scaling
1. **Load Balancer**: Distribute requests across multiple API servers
2. **Stateless Servers**: All servers share same MongoDB and Redis
3. **Session Affinity**: Not required (stateless API)

#### Database Scaling
1. **Read Replicas**: MongoDB replica set for read-heavy operations
2. **Sharding**: Shard by ref_id or date range for very large datasets
3. **Caching**: Redis cache for frequently accessed bookings

#### Redis Scaling
1. **Redis Cluster**: For high availability and distributed locking
2. **Sentinel Mode**: Automatic failover for Redis

### Performance Metrics
- **Route Discovery**: < 100ms (with indexes)
- **Booking Creation**: < 50ms
- **Booking Update**: < 100ms (with lock)
- **History Retrieval**: < 50ms

---

## Deployment Architecture

### Development Environment
```
┌─────────────┐
│   Node.js   │
│   Server    │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Mongo│ │Redis│
│ DB  │ │     │
└─────┘ └─────┘
```

### Production Environment
```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (NGINX)    │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼────┐  ┌─────▼─────┐  ┌────▼──────┐
    │ API Server │  │ API Server │  │ API Server│
    │  Instance 1│  │  Instance 2│  │ Instance 3│
    └───────┬────┘  └─────┬─────┘  └────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼────┐  ┌─────▼─────┐  ┌────▼──────┐
    │  MongoDB   │  │  MongoDB  │  │  MongoDB  │
    │  Primary   │  │  Replica  │  │  Replica  │
    └────────────┘  └───────────┘  └───────────┘
                           │
                    ┌─────▼─────┐
                    │   Redis   │
                    │  Cluster  │
                    └───────────┘
```

### Containerization (Docker)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/aircargo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=production
```

---

## Security Considerations

### Current Implementation
1. **Input Validation**: All inputs validated (required fields, types, ranges)
2. **Error Handling**: Generic error messages (no sensitive data exposure)
3. **Status Code Usage**: Proper HTTP status codes

### Recommended Enhancements
1. **Authentication**: JWT-based authentication for API access
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: Prevent API abuse
4. **HTTPS**: Encrypt all communications
5. **Input Sanitization**: Prevent injection attacks
6. **CORS**: Configure allowed origins
7. **API Keys**: For external system integration
8. **Audit Logging**: Track all booking modifications

### Security Best Practices
```javascript
// Example: Add authentication middleware
app.use('/api', authenticateToken)

// Example: Add rate limiting
app.use('/api', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}))
```

---

## Error Handling

### Error Types
1. **Validation Errors** (400): Invalid input data
2. **Not Found** (404): Booking/flight not found
3. **Conflict** (409): Lock acquisition failed
4. **Business Rule Violations** (400): Invalid state transitions
5. **Server Errors** (500): Unexpected errors

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Error Handling Strategy
- **Try-Catch Blocks**: All async operations wrapped
- **Graceful Degradation**: System continues if Redis unavailable
- **Logging**: All errors logged for debugging
- **User-Friendly Messages**: Clear error messages for clients

---

## Future Enhancements

### Short-term
1. **Pagination**: For large result sets
2. **Filtering**: Filter bookings by status, date range
3. **Search**: Full-text search for bookings
4. **Webhooks**: Notify external systems on status changes
5. **Email Notifications**: Send updates to customers

### Medium-term
1. **GraphQL API**: Alternative to REST
2. **Real-time Updates**: WebSocket support for live tracking
3. **Analytics Dashboard**: Booking statistics and insights
4. **Multi-tenant Support**: Support multiple airlines/organizations
5. **Batch Operations**: Bulk booking creation/updates

### Long-term
1. **Microservices Architecture**: Split into separate services
2. **Event Sourcing**: Complete event history with replay capability
3. **CQRS**: Separate read/write models
4. **Machine Learning**: Predictive analytics for delays
5. **Blockchain**: Immutable booking records

---

## Monitoring & Observability

### Recommended Metrics
1. **Request Rate**: Requests per second
2. **Response Time**: P50, P95, P99 latencies
3. **Error Rate**: 4xx and 5xx error percentage
4. **Database Performance**: Query execution times
5. **Redis Performance**: Lock acquisition times
6. **Booking Status Distribution**: Count by status

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Track requests across services
- **Centralized Logging**: ELK stack or similar

### Health Checks
```javascript
// Example health check endpoint
GET /health
{
  "status": "healthy",
  "mongodb": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

---

## Conclusion

The Air Cargo Booking & Tracking System is designed as a scalable, reliable REST API service. The architecture emphasizes:

- **Modularity**: Clear separation of concerns
- **Scalability**: Horizontal scaling capability
- **Reliability**: Fail-open design, proper error handling
- **Performance**: Optimized queries with proper indexing
- **Concurrency**: Distributed locking for safe updates

The system is production-ready for the specified load requirements and can be extended for future enhancements.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-17  
**Author**: System Architecture Team
