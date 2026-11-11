import { useState, useEffect } from 'react';
import { api } from '../api';

export default function RequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [directionFilter, setDirectionFilter] = useState('all'); // all | received | sent
  const [statusFilter, setStatusFilter] = useState('All'); // All | Pending | Accepted | Rejected
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initRequests = async () => {
      try {
        const res = await api.get('/requests');
        if (!ignore) {
          setRequests(res.data.requests || []);
        }
      } catch (err) {
        if (!ignore) {
          setMessage({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load requests.',
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    initRequests();
    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put(`/requests/${requestId}`, { status: newStatus });
      setMessage({ type: 'success', text: res.data.message });
      await fetchRequests();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not update request.',
      });
    }
  };

  const filteredRequests = requests.filter((reqItem) => {
    const isSent = reqItem.senderId?._id === user._id;
    const isReceived = reqItem.receiverId?._id === user._id;

    if (directionFilter === 'sent' && !isSent) return false;
    if (directionFilter === 'received' && !isReceived) return false;
    if (statusFilter !== 'All' && reqItem.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadgeClass = (status) => {
    if (status === 'Accepted') return 'badge-accepted';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <h1>My Exchange Requests</h1>
          <p>View sent and received requests, and accept or reject incoming skill swaps.</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="tabs-row">
          <div className="tab-group">
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('all')}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'received' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('received')}
            >
              Received (
              {requests.filter((r) => r.receiverId?._id === user._id).length})
            </button>
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'sent' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('sent')}
            >
              Sent ({requests.filter((r) => r.senderId?._id === user._id).length})
            </button>
          </div>

          <div className="tab-group">
            {['All', 'Pending', 'Accepted', 'Rejected'].map((st) => (
              <button
                key={st}
                type="button"
                className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <h3>No requests match this filter</h3>
            <p>Explore skills from other students to start a skill exchange.</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map((reqItem) => {
              const isIncoming = reqItem.receiverId?._id === user._id;
              const otherStudent = isIncoming ? reqItem.senderId : reqItem.receiverId;

              return (
                <div key={reqItem._id} className="card request-card">
                  <div className="request-info">
                    <div className="badge-row">
                      <span className="badge badge-primary">
                        {isIncoming ? 'Received Request' : 'Sent Request'}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(reqItem.status)}`}>
                        {reqItem.status}
                      </span>
                    </div>

                    <h3>
                      {isIncoming
                        ? `${otherStudent?.name} wants to learn ${reqItem.requestedSkill} and offers ${reqItem.offeredSkill}`
                        : `You offered ${reqItem.offeredSkill} to learn ${reqItem.requestedSkill} from ${otherStudent?.name}`}
                    </h3>

                    <p className="request-meta">
                      {otherStudent?.department} • {otherStudent?.college}
                      {reqItem.status === 'Accepted' && otherStudent?.email
                        ? ` • Contact: ${otherStudent.email}`
                        : ''}
                    </p>
                  </div>

                  {isIncoming && reqItem.status === 'Pending' && (
                    <div className="request-actions">
                      <button
                        type="button"
                        className="btn btn-accent btn-sm"
                        onClick={() => handleStatusUpdate(reqItem._id, 'Accepted')}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => handleStatusUpdate(reqItem._id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

