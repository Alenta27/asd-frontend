import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaPlus, FaTrash, FaTimes, FaUser } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

function BookingModal({ isOpen, onClose, onBook, children, therapists, navigate }) {
  const [formData, setFormData] = useState({
    childId: '',
    therapistId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If therapist or date changed, fetch available slots
    if ((name === 'therapistId' || name === 'appointmentDate') && value) {
      const therapistId = name === 'therapistId' ? value : formData.therapistId;
      const date = name === 'appointmentDate' ? value : formData.appointmentDate;
      if (therapistId && date) {
        fetchAvailableSlots(therapistId, date);
      }
    }
  };

  const fetchAvailableSlots = async (therapistId, date) => {
    if (!therapistId || !date) {
      console.log('fetchAvailableSlots: Missing therapistId or date', { therapistId, date });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/parent/available-slots?therapistId=${encodeURIComponent(therapistId)}&date=${encodeURIComponent(date)}`;
      console.log('Fetching available slots:', { therapistId, date, url });
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const slots = data.availableSlots || [];
        setAvailableSlots(slots);
        setSelectedSlot(data.slot);
        
        // Auto-select the first available slot if no time is selected yet
        if (slots.length > 0 && !formData.appointmentTime) {
          setFormData(prev => {
            const updatedData = { ...prev, appointmentTime: slots[0].start };
            console.log('Auto-selected first time slot:', slots[0].start);
            return updatedData;
          });
        }
      } else {
        setAvailableSlots([]);
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Form validation check:', {
      childId: formData.childId,
      therapistId: formData.therapistId,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      allFieldsPresent: !!(formData.childId && formData.therapistId && formData.appointmentDate && formData.appointmentTime)
    });
    
    if (!formData.childId || !formData.therapistId || !formData.appointmentDate || !formData.appointmentTime) {
      console.log('Validation failed - missing fields:', {
        childId: !formData.childId,
        therapistId: !formData.therapistId,
        appointmentDate: !formData.appointmentDate,
        appointmentTime: !formData.appointmentTime
      });
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get user data to get parent email/phone
      const userResponse = await fetch('http://localhost:5000/api/parent/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let parentEmail = '';
      let parentPhone = '';
      if (userResponse.ok) {
        const userData = await userResponse.json();
        parentEmail = userData.email || '';
        parentPhone = userData.phone || '';
      }
      
      // Call payment order creation endpoint
      const response = await fetch('http://localhost:5000/api/parent/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childId: formData.childId,
          therapistId: formData.therapistId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          reason: formData.reason,
          appointmentFee: 500 // You can make this configurable
        })
      });

      if (response.ok) {
        const paymentData = await response.json();
        console.log('Payment order created:', paymentData);
        
        // Close the modal
        onClose();
        
        // Reset form
        setFormData({
          childId: '',
          therapistId: '',
          appointmentDate: '',
          appointmentTime: '',
          reason: ''
        });
        
        // Redirect to payment page with payment data
        navigate('/parent/payment', { 
          state: { 
            paymentData: {
              ...paymentData,
              parentEmail,
              parentPhone
            }
          }
        });
      } else {
        let errorMessage = 'Server error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || 'Server error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Failed to create payment order:', errorMessage);
        alert(`Failed to process payment: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error in payment process:', error);
      alert(`Failed to process payment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (children.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              <FaTimes />
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-red-600 font-semibold mb-2">Cannot Book Appointment</p>
            <p className="text-gray-600 mb-2">No children found. Please add a child first in the dashboard.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold mt-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Child *</label>
            <select
              name="childId"
              value={formData.childId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
              required
            >
              <option value="">Choose a child...</option>
              {children.map(child => (
                <option key={child._id} value={child._id}>{child.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Therapist *</label>
            <select
              name="therapistId"
              value={formData.therapistId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
              required
            >
              <option value="">Choose a therapist...</option>
              {therapists.map(therapist => (
                <option key={therapist._id} value={therapist._id}>
                  {therapist.username || therapist.name} - {therapist.specialty || 'General Therapy'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots *</label>
              {availableSlots.length > 0 ? (
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          console.log('Time slot clicked:', slot.start);
                          setFormData(prev => {
                            const newData = { ...prev, appointmentTime: slot.start };
                            console.log('Updated form data:', newData);
                            return newData;
                          });
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition ${
                          formData.appointmentTime === slot.start
                            ? 'bg-pink-400 text-white border-pink-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-pink-50'
                        }`}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>
                </div>
              ) : formData.therapistId && formData.appointmentDate ? (
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  No available slots for this therapist on the selected date
                </div>
              ) : (
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Select therapist and date to see available slots
                </div>
              )}
            </div>
          </div>

          {selectedSlot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Appointment Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Mode:</span>
                  <span className="ml-2 text-blue-600">{selectedSlot.mode}</span>
                </div>
                {selectedSlot.hospitalClinicName && (
                  <div>
                    <span className="font-medium text-blue-700">Location:</span>
                    <span className="ml-2 text-blue-600">{selectedSlot.hospitalClinicName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., Follow-up consultation, speech therapy..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ParentAppointmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Initialize appointments from localStorage or use empty array
  const getInitialAppointments = () => {
    try {
      const savedAppointments = localStorage.getItem('cortexa_appointments');
      if (savedAppointments) {
        const parsed = JSON.parse(savedAppointments);
        console.log('Loaded appointments from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading appointments from localStorage:', error);
    }
    return [];
  };

  const [appointments, setAppointments] = useState(getInitialAppointments);
  const [children, setChildren] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const selectedChildIdParam = searchParams.get('childId');

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const appointmentRes = await fetch('http://localhost:5000/api/parent/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        console.log('Fetched appointments from API:', appointmentData);
        setAppointments(appointmentData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setIsLoading(false);
          return;
        }

        console.log('Fetching children...');

        const childRes = await fetch('http://localhost:5000/api/parent/children', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (childRes.ok) {
          const childData = await childRes.json();
          console.log('Fetched children:', childData);
          setChildren(childData);
        } else {
          console.error('Failed to fetch children:', childRes.status, childRes.statusText);
        }

        console.log('Fetching therapists...');
        const therapistRes = await fetch('http://localhost:5000/api/parent/therapists', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (therapistRes.ok) {
          const therapistData = await therapistRes.json();
          console.log('Fetched therapists:', therapistData);
          setTherapists(therapistData);
        } else {
          console.error('Failed to fetch therapists:', therapistRes.status, therapistRes.statusText);
        }

        fetchAppointments();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookingSuccess = (newAppointment) => {
    console.log('Adding new appointment:', newAppointment);
    
    alert('Appointment booked successfully!');
    
    setAppointments(prev => {
      const updated = [newAppointment, ...prev];
      try {
        localStorage.setItem('cortexa_appointments', JSON.stringify(updated));
        console.log('Appointments saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return updated;
    });
    
    setTimeout(() => fetchAppointments(), 500);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/parent/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAppointments(prev => {
          const updated = prev.filter(apt => apt._id !== appointmentId);
          // Save to localStorage
          try {
            localStorage.setItem('cortexa_appointments', JSON.stringify(updated));
            console.log('Appointments updated in localStorage after cancellation');
          } catch (error) {
            console.error('Error saving appointments to localStorage:', error);
          }
          return updated;
        });
        alert('Appointment cancelled successfully.');
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel appointment: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment.');
    }
  };

  // Get list of current parent's children names
  const parentChildrenNames = children.map(child => child.name);
  
  // Filter appointments to only show current parent's children
  const filteredAppointments = appointments.filter(apt => {
    return parentChildrenNames.length === 0 || parentChildrenNames.includes(apt.childId?.name);
  });

  const upcomingAppointments = filteredAppointments.filter(apt => {
    // Show all non-cancelled, non-completed appointments as "upcoming"
    // This includes past appointments that are still pending
    const isUpcoming = apt.status !== 'cancelled' && apt.status !== 'completed';
    
    console.log('Checking appointment:', {
      id: apt._id,
      date: apt.appointmentDate,
      status: apt.status,
      isUpcoming: isUpcoming,
      childName: apt.childId?.name
    });
    
    return isUpcoming;
  }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

  const pastAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    aptDate.setHours(0, 0, 0, 0); // Reset appointment date time to start of day
    return aptDate < today || apt.status === 'cancelled' || apt.status === 'completed';
  }).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-blue-300 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
            <p className="text-xs text-blue-600">ASD Detection & Support</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your child's appointments with therapists</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Book Appointment Button */}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full px-6 py-3 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <FaPlus /> Schedule New Appointment
              </button>

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Appointments</h2>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No upcoming appointments scheduled</p>
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="px-6 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold inline-flex items-center gap-2"
                    >
                      <FaPlus /> Book First Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt._id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-400 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FaUser className="text-blue-600" />
                              <h3 className="font-bold text-gray-800 text-lg">{apt.childId?.name || 'Child'}</h3>
                            </div>
                            <p className="text-gray-700 font-semibold mb-1">with {apt.therapistId?.username || apt.therapistId?.name || 'Therapist'}</p>
                            {apt.therapistId?.specialty && (
                              <p className="text-sm text-blue-600 mb-3">{apt.therapistId.specialty}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <FaCalendarAlt size={16} className="text-blue-500" />
                                <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <FaClock size={16} className="text-blue-500" />
                                <span>{apt.appointmentTime}</span>
                              </div>
                            </div>

                            {apt.reason && (
                              <p className="text-sm text-gray-600 mt-3"><strong>Reason:</strong> {apt.reason}</p>
                            )}

                            <div className="mt-3">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                apt.status === 'confirmed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelAppointment(apt._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition ml-4"
                            title="Cancel appointment"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Appointments</h2>
                  <div className="space-y-4">
                    {pastAppointments.map((apt) => (
                      <div key={apt._id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FaUser className="text-gray-400" />
                              <h3 className="font-bold text-gray-700 text-lg">{apt.childId?.name || 'Child'}</h3>
                            </div>
                            <p className="text-gray-600 font-semibold mb-1">with {apt.therapistId?.username || 'Therapist'}</p>
                            {apt.therapistId?.specialty && (
                              <p className="text-sm text-gray-500 mb-3">{apt.therapistId.specialty}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <FaCalendarAlt size={16} className="text-gray-400" />
                                <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <FaClock size={16} className="text-gray-400" />
                                <span>{apt.appointmentTime}</span>
                              </div>
                            </div>

                            {apt.reason && (
                              <p className="text-sm text-gray-600 mt-3"><strong>Reason:</strong> {apt.reason}</p>
                            )}
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                            apt.status === 'cancelled' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                          }`}>
                            {apt.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBook={handleBookingSuccess}
        children={children}
        therapists={therapists}
        navigate={navigate}
      />
    </div>
  );
};

export default ParentAppointmentsPage;
