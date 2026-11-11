export default function SkillCard({
  skill,
  currentUser,
  onRequestClick,
  showManageActions = false,
  onEdit,
  onDelete,
}) {
  const ownerId = skill.userId?._id || skill.userId;
  const isOwner = currentUser && String(ownerId) === String(currentUser._id);

  return (
    <div className="card skill-card">
      <div>
        <div className="skill-card-top">
          <h3>{skill.skillName}</h3>
        </div>

        <div className="badge-row">
          <span className="badge badge-primary">{skill.category}</span>
          <span className="badge badge-level">{skill.experienceLevel}</span>
        </div>

        <p className="skill-desc">{skill.description}</p>
      </div>

      <div className="skill-card-footer">
        <div className="student-meta">
          <div className="student-name">{skill.userId?.name || 'Student'}</div>
          {skill.userId?.college && (
            <div className="student-college">
              {skill.userId.department} • {skill.userId.college}
            </div>
          )}
        </div>

        {showManageActions ? (
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(skill)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => onDelete(skill._id)}
            >
              Delete
            </button>
          </div>
        ) : isOwner ? (
          <span className="badge badge-accepted">Your Skill</span>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onRequestClick(skill)}
          >
            Request Exchange
          </button>
        )}
      </div>
    </div>
  );
}

