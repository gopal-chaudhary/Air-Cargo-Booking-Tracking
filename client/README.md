# Air Cargo Booking & Tracking - Frontend

React-based frontend for the Air Cargo Booking & Tracking System.

## Features

- ✅ Create Booking Form
- ✅ Search Booking by Ref ID
- ✅ Booking Detail Panel with Status & Timeline
- ✅ Responsive Design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```bash
VITE_API_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── CreateBookingForm.jsx
│   ├── SearchBooking.jsx
│   └── BookingDetail.jsx
├── services/           # API service layer
│   └── api.js
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## Usage

1. **Create a Booking**: Fill in the form on the left panel
2. **Search a Booking**: Enter a booking ref_id in the search box
3. **View Details**: Booking details appear in the right panel
4. **Update Status**: Use action buttons to update booking status
