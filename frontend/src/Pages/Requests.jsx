import { Navigate, useNavigate, useOutletContext } from "react-router-dom";

function RequestsPage() {
  const navigate = useNavigate();
  const {
    auth,
    incomingRequests,
    outgoingRequests,
    updateRequestStatus,
    busyAction,
    markItemSold,
  } = useOutletContext();

  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="feed-shell">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Incoming Requests</h2>
          </div>
        </div>
        {incomingRequests.length ? (
          <div className="card-grid request-list">
            {incomingRequests.map((request) => (
              <article key={request._id} className="request-card">
                <div className="chat-header">
                  <div>
                    <h3>{request.item?.title || "Untitled item"}</h3>
                    <p>
                      Requested by {request.borrower?.name || "Unknown student"}
                      {" | "}
                      {[request.borrower?.collegeId, request.borrower?.year]
                        .filter(Boolean)
                        .join(" / ") || "Campus borrower"}
                    </p>
                  </div>
                  <span className={`status status-${request.status || "pending"}`}>
                    {request.status || "pending"}
                  </span>
                </div>
                <p>
                  Review this request and approve it when you're ready to share the item.
                </p>
                {request.item?.phoneNumber ? <p>Phone: {request.item.phoneNumber}</p> : null}
                <div className="request-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => navigate(`/posts/${request.item?._id}`)}
                  >
                    View Post
                  </button>
                  <button
                    type="button"
                    disabled={
                      request.status !== "pending"
                      || busyAction === `accepted-${request._id}`
                    }
                    onClick={() => updateRequestStatus(request._id, "accepted")}
                  >
                    {busyAction === `accepted-${request._id}` ? "Updating..." : "Accept Request"}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={
                      request.status !== "pending"
                      || busyAction === `rejected-${request._id}`
                    }
                    onClick={() => updateRequestStatus(request._id, "rejected")}
                  >
                    {busyAction === `rejected-${request._id}` ? "Updating..." : "Reject Request"}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={!request.item?._id || busyAction === `sold-${request.item?._id}`}
                    onClick={() => markItemSold(request.item._id)}
                  >
                    {busyAction === `sold-${request.item?._id}` ? "Updating..." : "Mark as Sold"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No incoming requests yet.</div>
        )}
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>My Sent Requests</h2>
          </div>
        </div>
        {outgoingRequests.length ? (
          <div className="card-grid request-list">
            {outgoingRequests.map((request) => (
              <article key={request._id} className="request-card">
                <div className="chat-header">
                  <div>
                    <h3>{request.item?.title || "Untitled item"}</h3>
                    <p>
                      Owner: {request.owner?.name || "Unknown owner"}
                      {" | "}
                      {[request.owner?.collegeId, request.owner?.year]
                        .filter(Boolean)
                        .join(" / ") || "Campus owner"}
                    </p>
                  </div>
                  <span className={`status status-${request.status || "pending"}`}>
                    {request.status || "pending"}
                  </span>
                </div>
                {request.item?.phoneNumber ? <p>Phone: {request.item.phoneNumber}</p> : null}
                <p>
                  Sent on {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "recently"}.
                </p>
                <div className="request-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => navigate(`/posts/${request.item?._id}`)}
                  >
                    View Post
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">You have not sent any requests yet.</div>
        )}
      </div>
    </section>
  );
}

export default RequestsPage;
