import { useState, useEffect } from 'react';
import { api } from '../api';

export default function RequestModal({ skill, user, onClose }) {
  const [mySkills, setMySkills] = useState([]);
  const [offeredSkill, setOfferedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load the logged-in student's own skills to suggest as offered skills
    const fetchMySkills = async () => {
      try {
        const res = await api.get('/skills?mine=true');
        const list = res.data.skills || [];
        setMySkills(list);
        if (list.length > 0) {
          setOfferedSkill(list[0].skillName);
        }
      } catch (err) {
        console.error('Could not load your skills:', err);
      }
    };
    if (user) {
      fetchMySkills();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredSkill.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter the skill you want to offer.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await api.post('/requests', {
        receiverId: skill.userId._id,
        offeredSkill: offeredSkill.trim(),
        requestedSkill: skill.skillName,
      });
      setStatusMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send request.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Skill Exchange</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="form-subtitle">
          Requesting <strong>{skill.skillName}</strong> from{' '}
          <strong>{skill.userId?.name}</strong>
        </p>

        {statusMessage.text && (
          <div className={`alert alert-${statusMessage.type}`}>{statusMessage.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mySkills.length > 0 && (
            <div className="form-group">
              <label htmlFor="quickPickSkill">Pick one of your added skills</label>
              <select
                id="quickPickSkill"
                className="form-control"
                value={mySkills.some((s) => s.skillName === offeredSkill) ? offeredSkill : ''}
                onChange={(e) => setOfferedSkill(e.target.value)}
              >
                <option value="">-- Select a skill or type below --</option>
                {mySkills.map((s) => (
                  <option key={s._id} value={s.skillName}>
                    {s.skillName} ({s.experienceLevel})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="offeredSkillInput">Skill You Will Teach in Exchange</label>
            <input
              id="offeredSkillInput"
              type="text"
              className="form-control"
              placeholder="e.g., Python, Photoshop, Public Speaking"
              value={offeredSkill}
              onChange={(e) => setOfferedSkill(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Skill You Want to Learn</label>
            <input
              type="text"
              className="form-control"
              value={skill.skillName}
              disabled
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

