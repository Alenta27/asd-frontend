import React, { useState, useEffect, useMemo } from 'react';
import { FaArrowLeft, FaUserTie, FaPhone, FaEnvelope, FaPlus, FaEdit, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ParentCareTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingCareTeam, setIsLoadingCareTeam] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [careTeam, setCareTeam] = useState([]);
  const [messageHistory, setMessageHistory] = useState([]);
  const [availableTherapists, setAvailableTherapists] = useState([]);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false);
  const [isLoadingMessageHistory, setIsLoadingMessageHistory] = useState(false);
  const [addModal, setAddModal] = useState({ open: false, therapistId: '' });
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
  const [threadReplyDrafts, setThreadReplyDrafts] = useState({});

  const childIdParam = searchParams.get('childId');
  const queryIdParam = searchParams.get('queryId');
  const sectionParam = searchParams.get('section');

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoadingChildren(true);
        const response = await fetch('http://localhost:5000/api/parent/children', {
          headers: authHeaders
        });

        if (!response.ok) {
          throw new Error('Failed to fetch children');
        }

        const data = await response.json();
        setChildren(Array.isArray(data) ? data : []);

        if (childIdParam) {
          const child = data.find((c) => c._id === childIdParam);
          setSelectedChild(child || data[0] || null);
        } else {
          setSelectedChild(data[0] || null);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        setFeedback({ type: 'error', text: 'Unable to load children. Please refresh.' });
      } finally {
        setIsLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [authHeaders, childIdParam]);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setIsLoadingTherapists(true);
        const response = await fetch('http://localhost:5000/api/parent/therapists', {
          headers: authHeaders
        });

        if (!response.ok) {
          throw new Error('Failed to fetch therapists');
        }

        const data = await response.json();
        setAvailableTherapists(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setIsLoadingTherapists(false);
      }
    };

    fetchTherapists();
  }, [authHeaders]);

  useEffect(() => {
    const fetchCareTeam = async () => {
      if (!selectedChild?._id) {
        setCareTeam([]);
        return;
      }

      try {
        setIsLoadingCareTeam(true);
        const response = await fetch(
          `http://localhost:5000/api/parent/care-team?childId=${selectedChild._id}`,
          { headers: authHeaders }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch care team');
        }

        const data = await response.json();
        setCareTeam(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching care team:', error);
        setFeedback({ type: 'error', text: 'Unable to load care team for this child.' });
      } finally {
        setIsLoadingCareTeam(false);
      }
    };

    fetchCareTeam();
  }, [authHeaders, selectedChild]);

  useEffect(() => {
    const fetchMessageHistory = async () => {
      if (!selectedChild?._id) {
        setMessageHistory([]);
        return;
      }

      try {
        setIsLoadingMessageHistory(true);
        const response = await fetch(
          `http://localhost:5000/api/parent/care-team/messages?childId=${selectedChild._id}`,
          { headers: authHeaders }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch message history');
        }

        const payload = await response.json();
        const normalizedMessages = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.messages) ? payload.messages : []);
        setMessageHistory(normalizedMessages);
      } catch (error) {
        console.error('Error fetching message history:', error);
        setMessageHistory([]);
      } finally {
        setIsLoadingMessageHistory(false);
      }
    };

    fetchMessageHistory();
  }, [authHeaders, selectedChild]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const openAddModal = () => {
    setAddModal({ open: true, therapistId: '' });
  };

  const closeAddModal = () => {
    setAddModal({ open: false, therapistId: '' });
  };

  const handleAddProvider = async (event) => {
    event.preventDefault();
    if (!selectedChild?._id || !addModal.therapistId) return;

    try {
      setIsSaving(true);
      const response = await fetch('http://localhost:5000/api/parent/care-team', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          childId: selectedChild._id,
          therapistId: addModal.therapistId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to add provider');
      }

      setCareTeam((prev) => {
        const withoutExisting = prev.filter((member) => member._id !== payload._id);
        return [payload, ...withoutExisting];
      });
      setFeedback({ type: 'success', text: `${payload.name} is now in this child's care team.` });
      closeAddModal();
    } catch (error) {
      console.error('Error adding provider:', error);
      setFeedback({ type: 'error', text: error.message || 'Unable to add provider.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openMessageModal = (provider) => {
    setMessageModal({ open: true, provider, subject: '', message: '' });
  };

  const closeMessageModal = () => {
    setMessageModal({ open: false, provider: null, subject: '', message: '' });
  };

  const handleMessageChange = (field, value) => {
    setMessageModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleThreadReplyDraftChange = (queryId, value) => {
    setThreadReplyDrafts((prev) => ({ ...prev, [queryId]: value }));
  };

  const handleSendThreadReply = async (queryId) => {
    const draft = threadReplyDrafts[queryId] || '';
    if (!queryId || !draft.trim()) return;

    try {
      setIsSaving(true);
      const response = await fetch(
        `http://localhost:5000/api/parent/care-team/messages/${queryId}/reply`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            message: draft.trim(),
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to send reply');
      }

      setMessageHistory((prev) =>
        prev.map((entry) =>
          entry._id === queryId
            ? {
                ...entry,
                status: payload?.query?.status || entry.status,
                readAt: payload?.query?.readAt ?? entry.readAt,
                replies: Array.isArray(payload?.query?.replies) ? payload.query.replies : entry.replies,
              }
            : entry
        )
      );
      setThreadReplyDrafts((prev) => ({ ...prev, [queryId]: '' }));
      setFeedback({ type: 'success', text: 'Reply sent to doctor.' });
    } catch (error) {
      console.error('Error sending thread reply:', error);
      setFeedback({ type: 'error', text: error.message || 'Unable to send reply.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSecureMessage = async (event) => {
    event.preventDefault();
    if (!messageModal.provider?._id || !selectedChild?._id) return;

    try {
      setIsSaving(true);
      const response = await fetch(
        `http://localhost:5000/api/parent/care-team/${messageModal.provider._id}/messages`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            childId: selectedChild._id,
            subject: messageModal.subject,
            message: messageModal.message,
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to send message');
      }

      setFeedback({ type: 'success', text: `Secure message sent to ${messageModal.provider.name}.` });
      if (selectedChild?._id) {
        const historyResponse = await fetch(
          `http://localhost:5000/api/parent/care-team/messages?childId=${selectedChild._id}`,
          { headers: authHeaders }
        );
        if (historyResponse.ok) {
          const historyPayload = await historyResponse.json();
          const normalizedMessages = Array.isArray(historyPayload)
            ? historyPayload
            : (Array.isArray(historyPayload?.messages) ? historyPayload.messages : []);
          setMessageHistory(normalizedMessages);
        }
      }
      closeMessageModal();
    } catch (error) {
      console.error('Error sending secure message:', error);
      setFeedback({ type: 'error', text: error.message || 'Unable to send secure message.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (provider) => {
    setEditModal({
      open: true,
      provider,
      name: provider.name || '',
      role: provider.role || '',
      specialty: provider.specialty || '',
      location: provider.location || '',
      phone: provider.phone || '',
      email: provider.email || '',
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

  const handleUpdateProvider = async (event) => {
    event.preventDefault();
    if (!editModal.provider?._id) return;

    try {
      setIsSaving(true);
      const response = await fetch(`http://localhost:5000/api/parent/care-team/${editModal.provider._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: editModal.name,
          role: editModal.role,
          specialty: editModal.specialty,
          location: editModal.location,
          phone: editModal.phone,
          email: editModal.email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to update provider');
      }

      setCareTeam((prev) => prev.map((member) => (member._id === payload._id ? payload : member)));
      setFeedback({ type: 'success', text: `${payload.name}'s details updated.` });
      closeEditModal();
    } catch (error) {
      console.error('Error updating provider:', error);
      setFeedback({ type: 'error', text: error.message || 'Unable to update provider.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProvider = async (provider) => {
    if (!provider?._id) return;
    if (!window.confirm(`Remove ${provider.name} from your care team?`)) return;

    try {
      setIsSaving(true);
      const response = await fetch(`http://localhost:5000/api/parent/care-team/${provider._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to remove provider');
      }

      setCareTeam((prev) => prev.filter((member) => member._id !== provider._id));
      setFeedback({ type: 'success', text: `${provider.name} removed from care team.` });
    } catch (error) {
      console.error('Error removing provider:', error);
      setFeedback({ type: 'error', text: error.message || 'Unable to remove provider.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectableTherapists = availableTherapists.filter(
    (therapist) => !careTeam.some((member) => String(member.therapistId) === String(therapist._id))
  );

  const isMessageValid = messageModal.subject.trim() && messageModal.message.trim();
  const isEditValid =
    editModal.name.trim() &&
    editModal.role.trim() &&
    editModal.specialty.trim() &&
    editModal.location.trim() &&
    editModal.phone.trim() &&
    editModal.email.trim();

  useEffect(() => {
    if ((sectionParam === 'messages' || queryIdParam) && messageHistory.length >= 0) {
      const el = document.getElementById('message-history-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [sectionParam, queryIdParam, messageHistory.length]);

  return (
    <div className="flex h-screen bg-gray-100">
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isLoadingChildren ? 'Loading...' : selectedChild ? `${selectedChild.name}'s Care Team` : 'Care Team'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">Centralized contact list for all healthcare providers</p>
        </div>

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

            {children.length > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child:</label>
                <select
                  value={selectedChild?._id || ''}
                  onChange={(e) => {
                    const child = children.find((c) => c._id === e.target.value);
                    setSelectedChild(child || null);
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

            {!isLoadingChildren && children.length > 0 && (
              <button
                onClick={openAddModal}
                className="w-full px-6 py-3 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <FaPlus /> Add New Provider
              </button>
            )}

            {!isLoadingChildren && children.length > 0 && isLoadingCareTeam && (
              <div className="bg-white rounded-lg shadow-md p-6 text-gray-600 text-sm">Loading care team...</div>
            )}

            {!isLoadingChildren && children.length > 0 && !isLoadingCareTeam && careTeam.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 text-gray-600 text-sm">
                No providers added yet. Use Add New Provider to connect this child with a therapist.
              </div>
            )}

            {!isLoadingChildren && children.length > 0 && !isLoadingCareTeam && careTeam.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careTeam.map((provider) => (
                  <div key={provider._id} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-400 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                          {(provider.name || 'P').split(' ').map((n) => n[0]).join('').slice(0, 3)}
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

            {!isLoadingChildren && children.length > 0 && (
              <div id="message-history-section" className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Message History</h3>
                <p className="text-sm text-gray-600 mb-4">View your sent queries and doctor replies for this child.</p>

                {isLoadingMessageHistory && (
                  <p className="text-sm text-gray-600">Loading message history...</p>
                )}

                {!isLoadingMessageHistory && messageHistory.length === 0 && (
                  <p className="text-sm text-gray-600">No messages yet.</p>
                )}

                {!isLoadingMessageHistory && messageHistory.length > 0 && (
                  <div className="space-y-4">
                    {messageHistory.map((entry) => (
                      <article
                        key={entry._id}
                        className={`rounded-lg border p-4 ${
                          queryIdParam && entry._id === queryIdParam
                            ? 'border-blue-400 ring-2 ring-blue-100'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-800">{entry.subject || 'No subject'}</h4>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {Array.isArray(entry.replies) && entry.replies.some((reply) => reply.senderRole === 'therapist') ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                  Doctor Replied
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  Awaiting Doctor
                                </span>
                              )}

                              {Array.isArray(entry.replies) && entry.replies.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                  {entry.replies.length} {entry.replies.length === 1 ? 'Reply' : 'Replies'}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{entry.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Sent to: {entry.provider?.name || 'Therapist'}
                        </p>

                        {Array.isArray(entry.replies) && entry.replies.length > 0 && (
                          <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/50 p-3 space-y-3">
                            {entry.replies.map((reply, index) => (
                              <div key={`${entry._id}-reply-${index}`}>
                                <p className="text-xs font-semibold text-blue-700">
                                  {reply.senderRole === 'therapist' ? 'Doctor Reply' : 'Parent Follow-up'}
                                  {' - '}
                                  {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}
                                </p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                            Reply to this thread
                          </label>
                          <textarea
                            value={threadReplyDrafts[entry._id] || ''}
                            onChange={(e) => handleThreadReplyDraftChange(entry._id, e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-24 resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="Write a follow-up message to your doctor"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSendThreadReply(entry._id)}
                              disabled={isSaving || !String(threadReplyDrafts[entry._id] || '').trim()}
                              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                                isSaving || !String(threadReplyDrafts[entry._id] || '').trim()
                                  ? 'bg-blue-300 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {addModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Add New Provider</h3>
              <p className="text-sm text-gray-600">Select a therapist to add for {selectedChild?.name}</p>
            </div>
            <form onSubmit={handleAddProvider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                <select
                  value={addModal.therapistId}
                  onChange={(e) => setAddModal((prev) => ({ ...prev, therapistId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select therapist</option>
                  {selectableTherapists.map((therapist) => (
                    <option key={therapist._id} value={therapist._id}>
                      {therapist.username} ({therapist.email})
                    </option>
                  ))}
                </select>
                {isLoadingTherapists && (
                  <p className="text-xs text-gray-500 mt-2">Loading therapists...</p>
                )}
                {!isLoadingTherapists && selectableTherapists.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">No additional therapists available to add.</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !addModal.therapistId}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isSaving || !addModal.therapistId ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Add Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  disabled={isSaving || !isMessageValid}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isSaving || !isMessageValid ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
                  disabled={isSaving || !isEditValid}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isSaving || !isEditValid ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
