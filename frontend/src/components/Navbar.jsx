import { NavLink } from "react-router-dom";

function Navbar({ auth, requests, onLogout }) {
  const getLinkClassName = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <aside className="navbar">
      <div className="nav-brand-block">
        <p className="brand">CampusShare</p>
        <span className="sub-brand">Student marketplace</span>
      </div>
      <nav className="nav-actions">
        <NavLink to="/" className={getLinkClassName}>
          Student Hub
        </NavLink>
        <NavLink to="/create" className={getLinkClassName}>
          Add Post
        </NavLink>
        <NavLink to="/my-posts" className={getLinkClassName}>
          My Posts
        </NavLink>
        {auth.token ? (
          <>
            <NavLink to="/requests" className={getLinkClassName}>
              Requests
              <span className="nav-badge">{requests.length}</span>
            </NavLink>
            <button type="button" className="secondary" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : null}
      </nav>
    </aside>
  );
}

export default Navbar;
