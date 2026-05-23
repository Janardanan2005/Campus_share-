import { useNavigate, useOutletContext } from "react-router-dom";
import PostCard from "../components/PostCard";

function Home() {
  const navigate = useNavigate();
  const {
    auth,
    filteredItems,
    busyAction,
    requestItem,
    deleteItem,
    markItemSold,
    outgoingRequestByItemId,
    searchQuery,
    setSearchQuery,
    categoryOptions,
    activeCategory,
    setActiveCategory,
  } = useOutletContext();

  return (
    <section className="feed-shell">
      <div className="feed-toolbar panel">
        <div className="feed-toolbar-head">
          <div>
            <h2>Explore Listings</h2>
            <p>Search and filter the feed from one place.</p>
          </div>
        </div>
        <div className="feed-search-bar">
          <input
            className="search-input"
            placeholder="Search books, electronics, hostel stuff..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="chip-row">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip-button${activeCategory === category ? " active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="card-grid items-grid">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <PostCard
              key={item._id}
              item={item}
              auth={auth}
              busyAction={busyAction}
              onRequest={requestItem}
              onDelete={deleteItem}
              onMarkSold={markItemSold}
              onView={(itemId) => navigate(`/posts/${itemId}`)}
              onEdit={(itemId) => navigate(`/posts/${itemId}/edit`)}
              requestRecord={outgoingRequestByItemId[item._id]}
            />
          ))
        ) : (
          <div className="empty-state">No matching listings yet. Try another search or post the first one.</div>
        )}
      </div>
    </section>
  );
}

export default Home;
