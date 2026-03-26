import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaFile,
  FaEnvelope, FaCalendarAlt, FaIdCard, FaUserMd,
  FaSpinner, FaExclamationTriangle, FaSearch, FaTimes
} from 'react-icons/fa';

/* ── helper: initials avatar ─────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
];
const avatarColor = (id = '') =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

/* ── inline toast ────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${bg} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-bounce-in`}>
      {type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><FaTimes /></button>
    </div>
  );
};

/* ── modal for reject reason ─────────────────────────────────────── */
const RejectModal = ({ therapist, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Reject Application</h3>
        <p className="text-sm text-gray-500 mb-4">
          You are about to reject <span className="font-semibold text-gray-700">{therapist.username}</span>.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection <span className="text-red-500">*</span></label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Explain why this application is being rejected…"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
const AdminTherapistRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => { fetchRequests(); }, []);

  /* auto-select first when list loads */
  useEffect(() => {
    if (requests.length > 0 && !selectedRequest) {
      setSelectedRequest(requests[0]);
    }
  }, [requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/therapist-requests', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/admin/therapist-requests/${selectedRequest._id}/approve`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        showToast(`${selectedRequest.username} approved successfully!`, 'success');
        const remaining = requests.filter(r => r._id !== selectedRequest._id);
        setRequests(remaining);
        setSelectedRequest(remaining[0] || null);
      } else {
        showToast('Failed to approve therapist', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/admin/therapist-requests/${selectedRequest._id}/reject`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        }
      );
      if (res.ok) {
        showToast(`${selectedRequest.username}'s application rejected.`, 'error');
        const remaining = requests.filter(r => r._id !== selectedRequest._id);
        setRequests(remaining);
        setSelectedRequest(remaining[0] || null);
        setShowRejectModal(false);
      } else {
        showToast('Failed to reject therapist', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter(r =>
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">

      {/* ── Top Header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-500 transition-all"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">Therapist Requests</h1>
          <p className="text-xs text-slate-400">Review and manage pending therapist applications</p>
        </div>
        {/* pending badge */}
        {!loading && (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {requests.length} Pending
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto p-6">

        {loading ? (
          /* Loading */
          <div className="flex items-center justify-center h-72">
            <div className="text-center">
              <FaSpinner className="text-4xl text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading applications…</p>
            </div>
          </div>

        ) : requests.length === 0 ? (
          /* Empty */
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <FaCheckCircle className="text-4xl text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">All Clear!</h3>
            <p className="text-slate-400 text-sm">No pending therapist applications right now.</p>
          </div>

        ) : (
          <div className="flex gap-6 min-h-[calc(100vh-140px)]">

            {/* ── Left Panel: List ── */}
            <div className="w-80 flex-shrink-0">
              {/* Search */}
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search applicants…"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              {/* Card list */}
              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">No matches found.</p>
                )}
                {filtered.map((req, idx) => (
                  <button
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all group ${selectedRequest?._id === req._id
                        ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(req._id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {getInitials(req.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${selectedRequest?._id === req._id ? 'text-white' : 'text-slate-800'}`}>
                          {req.username}
                        </p>
                        <p className={`text-xs truncate ${selectedRequest?._id === req._id ? 'text-blue-200' : 'text-slate-400'}`}>
                          {req.email}
                        </p>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${selectedRequest?._id === req._id ? 'text-blue-200' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                    </div>
                    <div className={`mt-2.5 flex items-center gap-1.5 text-xs ${selectedRequest?._id === req._id ? 'text-blue-200' : 'text-slate-400'}`}>
                      <FaCalendarAlt className="text-xs" />
                      Applied {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Right Panel: Detail ── */}
            {selectedRequest ? (
              <div className="flex-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                  {/* Detail Header */}
                  <div className={`bg-gradient-to-r ${avatarColor(selectedRequest._id)} p-8`}>
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                        {getInitials(selectedRequest.username)}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedRequest.username}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                          <span className="flex items-center gap-1.5">
                            <FaEnvelope className="text-xs" /> {selectedRequest.email}
                          </span>
                          {selectedRequest.phone && (
                            <span className="flex items-center gap-1.5">
                              📱 {selectedRequest.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
                        Pending Review
                      </span>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="p-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                          <FaCalendarAlt /> Application Date
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                          <FaIdCard /> License Number
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {selectedRequest.licenseNumber || <span className="text-slate-400 font-normal italic">Not provided</span>}
                        </p>
                      </div>

                      {selectedRequest.specialization && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                            <FaUserMd /> Specialization
                          </p>
                          <p className="text-sm font-semibold text-slate-700">{selectedRequest.specialization}</p>
                        </div>
                      )}

                      {selectedRequest.experience && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs text-slate-400 font-medium mb-1.5">Experience</p>
                          <p className="text-sm font-semibold text-slate-700">{selectedRequest.experience} years</p>
                        </div>
                      )}
                    </div>

                    {/* Credentials */}
                    {selectedRequest.doctoraldegreeUrl && (
                      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FaFile className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Doctoral Degree Certificate</p>
                            <p className="text-xs text-slate-400">Official credential document</p>
                          </div>
                        </div>
                        <a
                          href={selectedRequest.doctoraldegreeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-4 py-2 rounded-lg transition hover:shadow-sm"
                        >
                          View Document ↗
                        </a>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-slate-100 mb-8" />

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {actionLoading
                          ? <FaSpinner className="animate-spin" />
                          : <FaCheckCircle />
                        }
                        Approve Application
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2.5 bg-white hover:bg-red-50 border-2 border-red-300 hover:border-red-400 text-red-500 hover:text-red-600 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                      >
                        <FaTimesCircle />
                        Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FaUserMd className="text-5xl mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select an application to review</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && selectedRequest && (
        <RejectModal
          therapist={selectedRequest}
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          loading={actionLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Bounce-in keyframe (inline style) ── */}
      <style>{`
        @keyframes bounce-in {
          0%   { transform: translateY(20px); opacity:0; }
          60%  { transform: translateY(-4px); opacity:1; }
          100% { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity:0; transform:scale(.97); }
          to   { opacity:1; transform:scale(1); }
        }
        .animate-bounce-in { animation: bounce-in .4s ease forwards; }
        .animate-fade-in   { animation: fade-in  .2s ease forwards; }
      `}</style>
    </div>
  );
};

export default AdminTherapistRequestsPage;