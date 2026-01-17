import { useState } from 'react'
import { bookingAPI } from '../services/api'
import './SearchBooking.css'

export default function SearchBooking({ onBookingFound }) {
  const [refId, setRefId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!refId.trim()) {
      setError('Please enter a booking reference ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await bookingAPI.getHistory(refId.trim())
      if (onBookingFound) {
        onBookingFound(response.data)
      }
    } catch (err) {
      setError(err.message)
      if (onBookingFound) {
        onBookingFound(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-booking">
      <h2>Search Booking</h2>
      <form onSubmit={handleSearch}>
        <div className="search-input-group">
          <input
            type="text"
            value={refId}
            onChange={(e) => {
              setRefId(e.target.value)
              setError(null)
            }}
            placeholder="Enter Booking Ref ID (e.g., BK-12345678)"
            className="search-input"
            required
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
