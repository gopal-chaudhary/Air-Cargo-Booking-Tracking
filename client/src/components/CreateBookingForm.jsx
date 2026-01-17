import { useState } from 'react'
import { bookingAPI } from '../services/api'
import './CreateBookingForm.css'

export default function CreateBookingForm({ onBookingCreated }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pieces: '',
    weight_kg: '',
    flightIds: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        pieces: parseInt(formData.pieces),
        weight_kg: parseInt(formData.weight_kg),
      }

      if (formData.flightIds.trim()) {
        payload.flightIds = formData.flightIds
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id)
      }

      const response = await bookingAPI.create(payload)
      console.log(response.data);
      
      setSuccess(`Booking created successfully! Ref ID: ${response.data.ref_id}`)
      
      // Reset form
      setFormData({
        origin: '',
        destination: '',
        pieces: '',
        weight_kg: '',
        flightIds: '',
      })

      // Notify parent component
      if (onBookingCreated) {
        onBookingCreated(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-booking-form">
      <h2>Create New Booking</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="origin">Origin *</label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            placeholder="e.g., DEL"
            required
            maxLength={3}
            pattern="[A-Za-z]{3}"
            title="3-letter airport code"
          />
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination *</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g., BLR"
            required
            maxLength={3}
            pattern="[A-Za-z]{3}"
            title="3-letter airport code"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pieces">Pieces *</label>
            <input
              type="number"
              id="pieces"
              name="pieces"
              value={formData.pieces}
              onChange={handleChange}
              placeholder="e.g., 2"
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight_kg">Weight (kg) *</label>
            <input
              type="number"
              id="weight_kg"
              name="weight_kg"
              value={formData.weight_kg}
              onChange={handleChange}
              placeholder="e.g., 15"
              required
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="flightIds">Flight IDs (optional)</label>
          <input
            type="text"
            id="flightIds"
            name="flightIds"
            value={formData.flightIds}
            onChange={handleChange}
            placeholder="e.g., FL-001, FL-002"
          />
          <small>Comma-separated list of flight IDs</small>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  )
}
