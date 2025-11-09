import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaPlus, FaTrash, FaTimes, FaHospital } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SlotManagementPage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    intervalMinutes: 30,
    breakTimeMinutes: 5,
    mode: 'In-person',
    hospitalClinicName: ''
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/slots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      } else {
        console.error('Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('You can only create slots for today or future dates.');
      return;
    }

    // Validate time range
    if (formData.startTime >= formData.endTime) {
      alert('End time must be after start time.');
      return;
    }

    // Validate hospital name for in-person appointments
    if (formData.mode === 'In-person' && !formData.hospitalClinicName.trim()) {
      alert('Hospital/Clinic name is required for in-person appointments.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newSlot = await response.json();
        setSlots(prev => [...prev, newSlot]);
        setIsCreatingSlot(false);
        setFormData({
          date: '',
          startTime: '09:00',
          endTime: '17:00',
          intervalMinutes: 30,
          breakTimeMinutes: 5,
          mode: 'In-person',
          hospitalClinicName: ''
        });
        alert('Slot created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create slot: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      alert('Failed to create slot.');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/therapist/slots/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSlots(prev => prev.filter(slot => slot._id !== slotId));
        alert('Slot deleted successfully!');
      } else {
        alert('Failed to delete slot.');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot.');
    }
  };

  const generateTimeSlots = (startTime, endTime, intervalMinutes, breakTimeMinutes) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    let current = new Date(start);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);
      if (slotEnd <= end) {
        slots.push({
          start: current.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5)
        });
      }
      current = new Date(slotEnd.getTime() + breakTimeMinutes * 60000);
    }
    
    return slots;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSlotsForDate = (date) => {
    return slots.filter(slot => slot.date === date);
  };

  const uniqueDates = [...new Set(slots.map(slot => slot.date))].sort();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-blue-300 flex items-center gap-2">
          <button
            onClick={() => navigate('/therapist-dashboard')}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">NeuroTrack</h1>
            <p className="text-xs text-blue-600">Therapist Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <h3 className="text-sm font-semibold text-blue-700 mb-4">Navigation</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => navigate('/therapist-dashboard')}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center gap-2"
              >
                <span>🏠</span> Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/therapist-patients')}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center gap-2"
              >
                <span>👥</span> My Patients
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/therapist-schedule')}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center gap-2"
              >
                <span>📅</span> Schedule
              </button>
            </li>
            <li>
              <button className="w-full text-left px-3 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2 font-semibold">
                <span>📅</span> Manage Slots
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Consultation Slots</h1>
              <p className="text-gray-500 text-sm mt-1">
                Create and manage your availability for patients. Use intervals to auto-split your working window and add break time for rest between consultations.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingSlot(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold flex items-center gap-2"
            >
              <FaPlus /> Create Slots
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading slots...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create Slot Modal */}
              {isCreatingSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">Create Consultation Slot</h2>
                      <button
                        onClick={() => setIsCreatingSlot(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <form onSubmit={handleCreateSlot} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Select today or future date</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mode *
                          </label>
                          <select
                            name="mode"
                            value={formData.mode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          >
                            <option value="In-person">In-person</option>
                            <option value="Online">Online</option>
                            <option value="Phone">Phone</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From *
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Start time</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To *
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">End time</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interval (min) *
                          </label>
                          <select
                            name="intervalMinutes"
                            value={formData.intervalMinutes}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          >
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={45}>45</option>
                            <option value={60}>60</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Break Time (min) *
                          </label>
                          <select
                            name="breakTimeMinutes"
                            value={formData.breakTimeMinutes}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                          </select>
                        </div>
                      </div>

                      {formData.mode === 'In-person' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hospital/Clinic Name *
                          </label>
                          <input
                            type="text"
                            name="hospitalClinicName"
                            value={formData.hospitalClinicName}
                            onChange={handleInputChange}
                            placeholder="e.g., City Medical Center"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Required for in-person appointments</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsCreatingSlot(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                        >
                          Create Slots
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Slots Display */}
              {uniqueDates.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">No slots created</h2>
                  <p className="text-gray-600 mb-4">You haven't created any consultation slots yet.</p>
                  <button
                    onClick={() => setIsCreatingSlot(true)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    Create Your First Slot
                  </button>
                </div>
              ) : (
                uniqueDates.map(date => {
                  const dateSlots = getSlotsForDate(date);
                  const timeSlots = generateTimeSlots(
                    dateSlots[0].startTime,
                    dateSlots[0].endTime,
                    dateSlots[0].intervalMinutes,
                    dateSlots[0].breakTimeMinutes
                  );

                  return (
                    <div key={date} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                          Slots on {formatDate(date)}
                        </h2>
                        <button
                          onClick={() => handleDeleteSlot(dateSlots[0]._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Delete slot"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaClock className="text-green-500" />
                          <span>{dateSlots[0].startTime} - {dateSlots[0].endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-green-500">📅</span>
                          <span>{dateSlots[0].mode}</span>
                        </div>
                        {dateSlots[0].hospitalClinicName && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaHospital className="text-green-500" />
                            <span>{dateSlots[0].hospitalClinicName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-green-500">⏱️</span>
                          <span>{dateSlots[0].intervalMinutes}min slots, {dateSlots[0].breakTimeMinutes}min breaks</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Time Slots:</h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {timeSlots.map((slot, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center"
                            >
                              {slot.start}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotManagementPage;
