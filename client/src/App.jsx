import { useState } from 'react'
import CreateBookingForm from './components/CreateBookingForm'
import SearchBooking from './components/SearchBooking'
import BookingDetail from './components/BookingDetail'
import './App.css'

function App() {
  const [selectedBooking, setSelectedBooking] = useState(null)

  const handleBookingCreated = (booking) => {
    // Optionally load the created booking
    setSelectedBooking(booking)
  }

  const handleBookingFound = (booking) => {
    setSelectedBooking(booking)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Air Cargo Booking & Tracking</h1>
        <p>Manage and track your cargo bookings</p>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="content-grid">
            <div className="left-panel">
              <CreateBookingForm onBookingCreated={handleBookingCreated} />
              <SearchBooking onBookingFound={handleBookingFound} />
            </div>

            <div className="right-panel">
              <BookingDetail
                booking={selectedBooking}
                onBookingUpdated={setSelectedBooking}
              />

            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Air Cargo Booking System</p>
      </footer>
    </div>
  )
}

export default App
