import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import PostCard from "../components/PostCard";

function MyPostsPage() {
  const navigate = useNavigate();
  const {
    auth,
    myItems,
    busyAction,
    deleteItem,
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
            <h2>My Posts</h2>
            <p>Manage your active and sold listings in one place.</p>
          </div>
        </div>
        {myItems.length ? (
          <div className="card-grid items-grid">
            {myItems.map((item) => (
              <PostCard
                key={item._id}
                item={item}
                auth={auth}
                busyAction={busyAction}
                onDelete={deleteItem}
                onMarkSold={markItemSold}
                onView={(itemId) => navigate(`/posts/${itemId}`)}
                onEdit={(itemId) => navigate(`/posts/${itemId}/edit`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">You have not created any posts yet.</div>
        )}
      </div>
    </section>
  );
}

export default MyPostsPage;
