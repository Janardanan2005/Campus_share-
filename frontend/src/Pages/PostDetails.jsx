import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import API from "../api/axios";

function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    auth,
    items,
    myItems,
    outgoingRequestByItemId,
    busyAction,
    requestItem,
    deleteItem,
    markItemSold,
  } = useOutletContext();
  const [item, setItem] = useState(() => (
    items.find((entry) => entry._id === id) || myItems.find((entry) => entry._id === id) || null
  ));
  const [loading, setLoading] = useState(!item);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchItem = async () => {
      if (item) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await API.get(`/posts/${id}`);
        if (active) {
          setItem(data);
          setError("");
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.message || "Could not load post.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      active = false;
    };
  }, [id, item]);

  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <section className="panel">Loading post...</section>;
  }

  if (error || !item) {
    return (
      <section className="panel">
        <h2>Post unavailable</h2>
        <p>{error || "This post could not be found."}</p>
        <p className="form-footer-link">
          <Link className="text-link" to="/">Return to the feed</Link>
        </p>
      </section>
    );
  }

  const isOwner = item.owner?._id === auth.user?.id;
  const outgoingRequest = outgoingRequestByItemId[item._id];
  const requestStatus = outgoingRequest?.status || "";
  const requestBusy = busyAction === `request-${item._id}`;
  const soldBusy = busyAction === `sold-${item._id}`;
  const deleteBusy = busyAction === `delete-${item._id}`;
  const canRequest = !isOwner && requestStatus !== "pending" && requestStatus !== "accepted";
  const modeLabel = Number(item.price) <= 0
    ? "Free"
    : item.description?.toLowerCase().includes("rent")
      ? "Rent"
      : "Sell";

  return (
    <section className="panel detail-panel">
      <div className="detail-media">
        {item.imageUrl ? (
          <img className="detail-image" src={item.imageUrl} alt={item.title} />
        ) : (
          <div className="detail-placeholder">{item.category || "General"}</div>
        )}
      </div>
      <div className="detail-content">
        <div className="detail-header">
          <div>
            <div className="post-meta">
              <span>{item.category || "General"}</span>
              <span>{modeLabel}</span>
            </div>
            <h2>{item.title}</h2>
            <strong className="feed-price">
              {Number(item.price) > 0 ? `Rs. ${Number(item.price)}` : "Free"}
            </strong>
          </div>
          {outgoingRequest ? (
            <span className={`status status-${outgoingRequest.status || "pending"}`}>
              {outgoingRequest.status || "pending"}
            </span>
          ) : null}
        </div>
        <p className="detail-description">{item.description}</p>
        <div className="detail-meta-grid">
          <div className="detail-meta-card">
            <strong>Seller</strong>
            <span>{item.owner?.name || "Unknown seller"}</span>
          </div>
          <div className="detail-meta-card">
            <strong>Phone</strong>
            <span>{item.phoneNumber || "Not provided"}</span>
          </div>
          <div className="detail-meta-card">
            <strong>College details</strong>
            <span>{[item.owner?.collegeId, item.owner?.year].filter(Boolean).join(" / ") || "Campus seller"}</span>
          </div>
          <div className="detail-meta-card">
            <strong>Posted on</strong>
            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently"}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => navigate(isOwner ? "/my-posts" : "/")}
          >
            Back
          </button>
          {isOwner ? (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate(`/posts/${item._id}/edit`)}
              >
                Edit Post
              </button>
              <button
                type="button"
                className="secondary"
                disabled={soldBusy || item.available === false}
                onClick={async () => {
                  const result = await markItemSold(item._id);
                  if (result.ok) {
                    setItem((current) => ({ ...current, available: false }));
                  }
                }}
              >
                {soldBusy ? "Updating..." : item.available === false ? "Sold" : "Mark as Sold"}
              </button>
              <button
                type="button"
                className="danger"
                disabled={deleteBusy}
                onClick={async () => {
                  const result = await deleteItem(item._id);
                  if (result.ok) {
                    navigate("/my-posts");
                  }
                }}
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={!canRequest || requestBusy}
              onClick={() => requestItem(item._id)}
            >
              {requestBusy
                ? "Sending..."
                : requestStatus === "pending"
                  ? "Request Pending"
                  : requestStatus === "accepted"
                    ? "Request Accepted"
                    : requestStatus === "rejected"
                      ? "Send Again"
                      : "Send Request"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default PostDetailsPage;
