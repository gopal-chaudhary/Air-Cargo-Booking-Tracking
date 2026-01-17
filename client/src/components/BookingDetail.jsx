import { useState, useCallback } from 'react'
import { bookingAPI } from '../services/api'
import './BookingDetail.css'

const STATUS_COLORS = {
  BOOKED: '#4a90e2',
  DEPARTED: '#f39c12',
  ARRIVED: '#27ae60',
  DELIVERED: '#2ecc71',
  CANCELLED: '#e74c3c'
}

const STATUS_LABELS = {
  BOOKED: 'Booked',
  DEPARTED: 'Departed',
  ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
}

const VALID_TRANSITIONS = {
  BOOKED: ['depart', 'cancel'],
  DEPARTED: ['arrive', 'cancel'],
  ARRIVED: ['deliver'],
  DELIVERED: [],
  CANCELLED: []
}

export default function BookingDetail({ booking, onBookingUpdated }) {
  // ✅ Hooks at top
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const refreshBooking = useCallback(async () => {
    if (!booking?.ref_id) return
    const res = await bookingAPI.getHistory(
      booking.ref_id.trim()
    )
    onBookingUpdated(res.data)
  }, [booking?.ref_id, onBookingUpdated])

  if (!booking) {
    return (
      <div className="booking-detail">
        <div className="no-booking">
          <p>No booking selected. Search for a booking to view details.</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAction = async (action, data = {}) => {
    if (loading) return

    if (!VALID_TRANSITIONS[booking.status]?.includes(action)) {
      setError('Invalid status transition')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      switch (action) {
        case 'depart':
          await bookingAPI.depart(booking.ref_id, data)
          break
        case 'arrive':
          await bookingAPI.arrive(booking.ref_id, data)
          break
        case 'deliver':
          await bookingAPI.deliver(booking.ref_id, data)
          break
        case 'cancel':
          await bookingAPI.cancel(booking.ref_id)
          break
        default:
          throw new Error('Unknown action')
      }

      setSuccess(
        `${STATUS_LABELS[booking.status]} → ${action} successful`
      )

      await refreshBooking()
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const canUpdate =
    booking.status !== 'CANCELLED' &&
    booking.status !== 'DELIVERED'

  return (
    <div className="booking-detail">
      {/* HEADER */}
      <div className="booking-header">
        <div>
          <h2>Booking Details</h2>
          <p className="ref-id">Ref ID: {booking.ref_id}</p>
        </div>
        <div
          className="status-badge"
          style={{ backgroundColor: STATUS_COLORS[booking.status] }}
        >
          {STATUS_LABELS[booking.status]}
        </div>
      </div>

      {/* ROUTE INFO */}
      <div className="info-section">
        <h3>Route Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Origin:</span>
            <span className="info-value">{booking.origin}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Destination:</span>
            <span className="info-value">{booking.destination}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Pieces:</span>
            <span className="info-value">{booking.pieces}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Weight:</span>
            <span className="info-value">
              {booking.weight_kg} kg
            </span>
          </div>
        </div>
      </div>

      {/* FLIGHT IDS */}
      {booking.flightIds?.length > 0 && (
        <div className="info-section">
          <h3>Flight IDs</h3>
          <div className="flight-ids">
            {booking.flightIds.map((id, i) => (
              <span key={i} className="flight-id-badge">
                {id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      <div className="info-section">
        <h3>Timeline</h3>
        <div className="timeline">
          {booking.events?.length ? (
            booking.events.map((event, i) => (
              <div key={i} className="timeline-item">
                <div
                  className="timeline-marker"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[event.type] || '#999'
                  }}
                />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-type">
                      {STATUS_LABELS[event.type] || event.type}
                    </span>
                    <span className="timeline-time">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <div className="timeline-details">
                    📍 {event.location}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-events">No events recorded</p>
          )}
        </div>
      </div>

      {/* METADATA */}
      <div className="info-section">
        <h3>Metadata</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {formatDate(booking.createdAt)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">
              {formatDate(booking.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      {canUpdate && (
        <div className="booking-actions">
          <h3>Actions</h3>

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">{success}</div>
          )}

          <div className="action-buttons">
            {booking.status === 'BOOKED' && (
              <button
                onClick={() =>
                  handleAction('depart', {
                    location: booking.origin
                  })
                }
                disabled={loading}
                className="action-button depart"
              >
                {loading
                  ? 'Processing...'
                  : 'Mark as Departed'}
              </button>
            )}

            {booking.status === 'DEPARTED' && (
              <button
                onClick={() =>
                  handleAction('arrive', {
                    location: booking.destination
                  })
                }
                disabled={loading}
                className="action-button arrive"
              >
                {loading
                  ? 'Processing...'
                  : 'Mark as Arrived'}
              </button>
            )}

            {booking.status === 'ARRIVED' && (
              <button
                onClick={() =>
                  handleAction('deliver', {
                    location: booking.destination
                  })
                }
                disabled={loading}
                className="action-button deliver"
              >
                {loading
                  ? 'Processing...'
                  : 'Mark as Delivered'}
              </button>
            )}

            {['BOOKED', 'DEPARTED'].includes(
              booking.status
            ) && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={loading}
                className="action-button cancel"
              >
                {loading
                  ? 'Processing...'
                  : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
