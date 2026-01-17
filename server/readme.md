
# Air Cargo Booking & Tracking System

## Features

- ✅ Get Route: Find direct flights and transit routes
- ✅ Create Booking: Create new cargo bookings with flight IDs
- ✅ Depart Booking: Mark booking as departed with location and flight info
- ✅ Arrive Booking: Mark booking as arrived at a location
- ✅ Deliver Booking: Mark booking as delivered
- ✅ Get Booking History: Retrieve full booking timeline
- ✅ Cancel Booking: Cancel bookings (cannot cancel if arrived/delivered)
- ✅ Distributed Locks: Handle concurrent updates using Redis
- ✅ Database Indexes: Optimized for high throughput (50K bookings, 150K updates/day)

## Prerequisites

- Node.js
- MongoDB
- Redis (for distributed locks)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB and Redis services

3. Update MongoDB connection in `config/db.js` if needed

4. Update Redis connection in `config/redis.js` if needed (default: localhost:6379)

5. Start the server:
```bash
npm start
```

## API Endpoints

### Get Route
`GET /api/flights/route?origin=DEL&destination=BLR&departure_date=2025-08-15`

Returns:
- `directFlights`: Array of direct flights from origin to destination on the departure date
- `transitRoute`: One transit route (if available) with first and second hop flights

### Create Booking
`POST /api/bookings`
```json
{
  "origin": "DEL",
  "destination": "BLR",
  "pieces": 2,
  "weight_kg": 15,
  "flightIds": ["FL-001", "FL-002"]
}
```

**Note:** `pieces` and `weight_kg` must be positive integers. `flightIds` is optional.

### Depart Booking
`POST /api/bookings/:ref_id/depart`
```json
{
  "location": "DEL",
  "flightInfo": { "flightNumber": "AI-202", "flightId": "FL-001" }
}
```

**Note:** Uses distributed lock to prevent concurrent updates.

### Arrive Booking
`POST /api/bookings/:ref_id/arrive`
```json
{
  "location": "BLR"
}
```

**Note:** Uses distributed lock to prevent concurrent updates.

### Deliver Booking
`POST /api/bookings/:ref_id/deliver`
```json
{
  "location": "BLR"
}
```

**Note:** Uses distributed lock to prevent concurrent updates.

### Get Booking History
`GET /api/bookings/:ref_id`

Returns booking details with chronological event timeline:
```json
{
  "ref_id": "BK-12345678",
  "origin": "DEL",
  "destination": "BLR",
  "pieces": 2,
  "weight_kg": 15,
  "status": "ARRIVED",
  "flightIds": ["FL-001"],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z",
  "events": [
    {
      "type": "BOOKED",
      "location": "DEL",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "type": "DEPARTED",
      "location": "DEL",
      "flightInfo": { "flightNumber": "AI-202" },
      "timestamp": "2025-01-15T11:00:00Z"
    },
    {
      "type": "ARRIVED",
      "location": "BLR",
      "timestamp": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### Cancel Booking
`POST /api/bookings/:ref_id/cancel`

**Note:** Cannot cancel bookings that have status ARRIVED or DELIVERED. Uses distributed lock to prevent concurrent updates.

## Data Model

### Booking
- `ref_id` (unique, indexed): Human-friendly booking reference
- `origin`: Origin location
- `destination`: Destination location
- `pieces` (int, required): Number of pieces
- `weight_kg` (int, required): Weight in kilograms
- `status` (enum, indexed): BOOKED, DEPARTED, ARRIVED, DELIVERED, CANCELLED
- `flightIds` (array): Array of flight IDs associated with the booking
- `events` (array): Chronological timeline of events
- `timestamps`: createdAt, updatedAt

### Flight
- `flightId` (unique, indexed): Unique flight identifier
- `flightNumber` (indexed): Flight number
- `airlineName`: Airline name
- `departureTime` (indexed): Departure datetime
- `arrivalTime`: Arrival datetime
- `origin` (indexed): Origin airport
- `destination` (indexed): Destination airport

## Concurrency Control

The system uses Redis-based distributed locks to handle concurrent updates on the same booking. All update operations (depart, arrive, deliver, cancel) are protected by locks to ensure data consistency.

If a lock cannot be acquired, the API returns a 409 Conflict status with an appropriate error message.