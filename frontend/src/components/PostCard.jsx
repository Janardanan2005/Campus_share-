const fallbackGradients = [
  "linear-gradient(135deg, #f97316, #fb7185)",
  "linear-gradient(135deg, #0f766e, #22c55e)",
  "linear-gradient(135deg, #2563eb, #06b6d4)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
];

function PostCard({
  item,
  auth,
  busyAction,
  onRequest,
  onDelete,
  onMarkSold,
  onEdit,
  onView,
  requestRecord,
}) {
  const isOwner = item.owner?._id === auth.user?.id;
  const requestBusy = busyAction === `request-${item._id}`;
  const deleteBusy = busyAction === `delete-${item._id}`;
  const soldBusy = busyAction === `sold-${item._id}`;
  const editBusy = busyAction === `edit-${item._id}`;
  const isSold = item.available === false;
  const requestStatus = requestRecord?.status || "";
  const accent = fallbackGradients[item.title.length % fallbackGradients.length];

  return (
    <article className="post-card">
      {item.imageUrl ? (
        <div className="post-image-wrap">
          <img className="post-image" src={item.imageUrl} alt={item.title} />
        </div>
      ) : (
        <div className="post-image-wrap placeholder" style={{ background: accent }}>
          <span>{item.category || "General"}</span>
        </div>
      )}
      <strong className="feed-price">
        {Number(item.price) > 0 ? `Rs. ${Number(item.price)}` : "Free"}
      </strong>
      <h3>{item.title}</h3>
      <div className="post-footer">
        <div>
          <strong>{item.owner?.name || "Unknown lender"}</strong>
        </div>
        <div className="post-actions">
          {isOwner ? (
            <div className="post-action-row">
              <button
                type="button"
                className="secondary"
                onClick={() => onView?.(item._id)}
              >
                View Details
              </button>
              <button
                type="button"
                className="secondary"
                disabled={editBusy}
                onClick={() => onEdit?.(item._id)}
              >
                Edit
              </button>
              <button
                type="button"
                className="secondary"
                disabled={soldBusy || isSold}
                onClick={() => onMarkSold(item._id)}
              >
                {soldBusy ? "Updating..." : isSold ? "Sold" : "Mark as Sold"}
              </button>
              <button
                type="button"
                className="danger"
                disabled={deleteBusy}
                onClick={() => onDelete(item._id)}
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : (
            <div className="post-action-row">
              <button
                type="button"
                className="secondary"
                onClick={() => onView?.(item._id)}
              >
                View Details
              </button>
              <button
                type="button"
                disabled={!auth.token || requestBusy || requestStatus === "pending" || requestStatus === "accepted"}
                onClick={() => onRequest(item._id)}
              >
                {requestBusy
                  ? "Sending..."
                  : !auth.token
                    ? "Login to Send Request"
                    : requestStatus === "pending"
                      ? "Request Pending"
                      : requestStatus === "accepted"
                        ? "Request Accepted"
                        : requestStatus === "rejected"
                          ? "Send Again"
                          : "Send Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default PostCard;
