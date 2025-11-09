import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUserTie, FaPhone, FaEnvelope, FaPlus, FaEdit, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ParentCareTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [careTeam, setCareTeam] = useState([
    {
      id: 1,
      name: 'Yuvraj Singh',
      role: 'Therapist',
      specialty: 'ASD Therapy & Support',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4567',
      email: 'yuvrajsingh04@gmail.com',
    },
    {
      id: 2,
      name: 'Dr. Ravi Mohan',
      role: 'Therapist',
      specialty: 'Behavioral Therapy',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4568',
      email: 'ravimohan0@gmail.com',
    },
    {
      id: 3,
      name: 'Alby Biju',
      role: 'Therapist',
      specialty: 'Speech & Language Therapy',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4569',
      email: 'albymbiju2002@gmail.com',
    },
    {
      id: 4,
      name: 'Dr. Rao Thomas',
      role: 'Therapist',
      specialty: 'Occupational Therapy',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4570',
      email: 'raothomas2003@gmail.com',
    },
    {
      id: 5,
      name: 'Alen Tom',
      role: 'Therapist',
      specialty: 'Social Skills Development',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4571',
      email: 'alentatom2026@mca.ajce.in',
    },
    {
      id: 6,
      name: 'Dr. Mathews V Pothen',
      role: 'Therapist',
      specialty: 'Cognitive Behavioral Therapy',
      location: 'CORTEXA Therapy Center',
      phone: '(555) 123-4572',
      email: 'mathewsvp00@gmail.com',
    },
  ]);
  const [messageModal, setMessageModal] = useState({ open: false, provider: null, subject: '', message: '' });
  const [editModal, setEditModal] = useState({
    open: false,
    provider: null,
    name: '',
    role: '',
    specialty: '',
    location: '',
    phone: '',
    email: '',
  });
  const [feedback, setFeedback] = useState(null);

  const childIdParam = searchParams.get('childId');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoadingChildren(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/parent/children', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch children');
        const data = await response.json();
        setChildren(data);
        
        // Set selected child based on URL parameter or first child
        if (childIdParam) {
          const child = data.find(c => c._id === childIdParam);
          setSelectedChild(child || data[0]);
        } else if (data.length > 0) {
          setSelectedChild(data[0]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        setIsLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [childIdParam]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const openMessageModal = (provider) => {
    setMessageModal({ open: true, provider, subject: '', message: '' });
  };

  const closeMessageModal = () => {
    setMessageModal({ open: false, provider: null, subject: '', message: '' });
  };

  const handleMessageChange = (field, value) => {
    setMessageModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendSecureMessage = (event) => {
    event.preventDefault();
    if (!messageModal.provider) return;
    setFeedback({ type: 'success', text: `Secure message sent to ${messageModal.provider.name}.` });
    closeMessageModal();
  };

  const openEditModal = (provider) => {
    setEditModal({
      open: true,
      provider,
      name: provider.name,
      role: provider.role,
      specialty: provider.specialty,
      location: provider.location,
      phone: provider.phone,
      email: provider.email,
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      provider: null,
      name: '',
      role: '',
      specialty: '',
      location: '',
      phone: '',
      email: '',
    });
  };

  const handleEditFieldChange = (field, value) => {
    setEditModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProvider = (event) => {
    event.preventDefault();
    if (!editModal.provider) return;
    setCareTeam((prev) =>
      prev.map((member) =>
        member.id === editModal.provider.id
          ? {
              ...member,
              name: editModal.name,
              role: editModal.role,
              specialty: editModal.specialty,
              location: editModal.location,
              phone: editModal.phone,
              email: editModal.email,
            }
          : member
      )
    );
    setFeedback({ type: 'success', text: `${editModal.name}'s details updated.` });
    closeEditModal();
  };

  const handleRemoveProvider = (provider) => {
    if (!window.confirm(`Remove ${provider.name} from your care team?`)) return;
    setCareTeam((prev) => prev.filter((member) => member.id !== provider.id));
    setFeedback({ type: 'success', text: `${provider.name} removed from care team.` });
  };

  const isMessageValid = messageModal.subject.trim() && messageModal.message.trim();
  const isEditValid =
    editModal.name.trim() &&
    editModal.role.trim() &&
    editModal.specialty.trim() &&
    editModal.location.trim() &&
    editModal.phone.trim() &&
    editModal.email.trim();

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
          <h1 className="text-3xl font-bold text-gray-800">
            {isLoadingChildren ? 'Loading...' : selectedChild ? `${selectedChild.name}'s Care Team` : 'Care Team'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">Centralized contact list for all healthcare providers</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-8 max-w-5xl">
            {feedback && (
              <div
                className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {feedback.text}
              </div>
            )}
            {/* Child Selector */}
            {children.length > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child:</label>
                <select
                  value={selectedChild?._id || ''}
                  onChange={(e) => {
                    const child = children.find(c => c._id === e.target.value);
                    setSelectedChild(child);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name} (Age {child.age})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* No Children Message */}
            {!isLoadingChildren && children.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Child Profiles Found</h3>
                <p className="text-gray-600 mb-4">Please add a child profile first to view their care team.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* Add Provider Button - Only show if children exist */}
            {!isLoadingChildren && children.length > 0 && (
              <button className="w-full px-6 py-3 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold flex items-center justify-center gap-2 shadow-md">
                <FaPlus /> Add New Provider
              </button>
            )}

            {/* Care Team Cards Grid - Only show if children exist */}
            {!isLoadingChildren && children.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {careTeam.map((provider) => (
                <div key={provider.id} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-400 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">{provider.name}</h3>
                        <p className="text-blue-600 font-semibold text-sm">{provider.role}</p>
                        <p className="text-gray-600 text-xs mt-1">{provider.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-gray-700">
                      <FaPhone size={14} className="text-blue-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{provider.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700">
                      <FaEnvelope size={14} className="text-blue-500 mt-1 flex-shrink-0" />
                      <span className="text-sm break-all">{provider.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700">
                      <FaUserTie size={14} className="text-blue-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{provider.location}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <button
                      onClick={() => openMessageModal(provider)}
                      className="w-full px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <FaPaperPlane size={14} /> Send Secure Message
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(provider)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold text-xs flex items-center justify-center gap-1"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleRemoveProvider(provider)}
                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold text-xs flex items-center justify-center gap-1"
                      >
                        <FaTrash size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Send Secure Message</h3>
              <p className="text-sm text-gray-600">To {messageModal.provider?.name}</p>
            </div>
            <form onSubmit={handleSendSecureMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={messageModal.subject}
                  onChange={(e) => handleMessageChange('subject', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter message subject"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={messageModal.message}
                  onChange={(e) => handleMessageChange('message', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-32 resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Write your secure message"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeMessageModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isMessageValid}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isMessageValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                  }`}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Edit Provider Details</h3>
              <p className="text-sm text-gray-600">Update contact information for {editModal.provider?.name}</p>
            </div>
            <form onSubmit={handleUpdateProvider} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => handleEditFieldChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={editModal.role}
                  onChange={(e) => handleEditFieldChange('role', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={editModal.specialty}
                  onChange={(e) => handleEditFieldChange('specialty', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editModal.location}
                  onChange={(e) => handleEditFieldChange('location', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editModal.phone}
                  onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editModal.email}
                  onChange={(e) => handleEditFieldChange('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isEditValid}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isEditValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentCareTeamPage;
