import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import API from "./api/axios";
import Navbar from "./components/Navbar";
import Home from "./Pages/homepage";
import Login from "./Pages/Login";
import Register from "./Pages/Regester";
import CreatePost from "./Pages/Createpost";
import RequestsPage from "./Pages/Requests";
import MyPostsPage from "./Pages/MyPosts";
import PostDetailsPage from "./Pages/PostDetails";

const emptyAuth = { token: "", user: null };
const unauthorizedMessage = "Your session expired. Please log in again.";
const categoryOptions = [
  "All",
  "Books",
  "Electronics",
  "Furniture",
  "Fashion",
  "Cycles",
  "Notes",
  "Hostel",
  "Free Stuff",
];

const parseStoredAuth = () => {
  try {
    const savedAuth = localStorage.getItem("campusShareAuth");

    if (!savedAuth) {
      return emptyAuth;
    }

    const parsedAuth = JSON.parse(savedAuth);
    return {
      token: parsedAuth?.token || "",
      user: parsedAuth?.user || null,
    };
  } catch {
    return emptyAuth;
  }
};

function App() {
  const [auth, setAuth] = useState(parseStoredAuth);
  const [items, setItems] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [status, setStatus] = useState({ message: "", type: "info" });
  const [busyAction, setBusyAction] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    localStorage.setItem("campusShareAuth", JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus({ message: "", type: "info" });
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const pushStatus = useCallback((message, type = "info") => {
    setStatus({ message, type });
  }, []);

  const resetAuth = useCallback((message = "") => {
    setAuth(emptyAuth);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setMyItems([]);

    if (message) {
      pushStatus(message, "error");
    }
  }, [pushStatus]);

  const handleProtectedRequestError = useCallback((error, fallbackMessage) => {
    if (error.status === 401) {
      resetAuth(unauthorizedMessage);
      return;
    }

    pushStatus(error.message || fallbackMessage, "error");
  }, [pushStatus, resetAuth]);

  const loadItems = useCallback(async () => {
    try {
      const data = await API.get("/posts");
      setItems(data);
    } catch (error) {
      pushStatus(error.message || "Could not load items.", "error");
    }
  }, [pushStatus]);

  const loadRequests = useCallback(async (token = auth.token) => {
    if (!token) return;

    try {
      const data = await API.get("/requests", token);
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (error) {
      handleProtectedRequestError(error, "Could not load requests.");
    }
  }, [auth.token, handleProtectedRequestError]);

  const loadMyItems = useCallback(async (token = auth.token) => {
    if (!token) return;

    try {
      const data = await API.get("/posts/mine", token);
      setMyItems(data);
    } catch (error) {
      handleProtectedRequestError(error, "Could not load your posts.");
    }
  }, [auth.token, handleProtectedRequestError]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (auth.token) {
      loadRequests(auth.token);
      loadMyItems(auth.token);
    } else {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setMyItems([]);
    }
  }, [auth.token, loadMyItems, loadRequests]);

  const handleMutationError = (error, fallbackMessage) => {
    if (error.status === 401) {
      resetAuth(unauthorizedMessage);
      return { ok: false, message: unauthorizedMessage };
    }

    const message = error.message || fallbackMessage;
    pushStatus(message, "error");
    return { ok: false, message };
  };

  const registerUser = async (formData) => {
    setBusyAction("register");
    try {
      const result = await API.post("/auth/register", formData);
      setAuth(result);
      pushStatus("Account created successfully.", "success");
      await Promise.all([loadItems(), loadRequests(result.token), loadMyItems(result.token)]);
      return { ok: true };
    } catch (error) {
      const message = error.message || "Registration failed.";
      pushStatus(message, "error");
      return { ok: false, message };
    } finally {
      setBusyAction("");
    }
  };

  const loginUser = async (formData) => {
    setBusyAction("login");
    try {
      const result = await API.post("/auth/login", formData);
      setAuth(result);
      pushStatus(`Welcome back, ${result.user.name}.`, "success");
      await Promise.all([loadRequests(result.token), loadMyItems(result.token)]);
      return { ok: true };
    } catch (error) {
      const message = error.message || "Login failed.";
      pushStatus(message, "error");
      return { ok: false, message };
    } finally {
      setBusyAction("");
    }
  };

  const logoutUser = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) {
      return;
    }

    setAuth(emptyAuth);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setMyItems([]);
    pushStatus("You have been logged out.", "success");
  };

  const createItem = async (formData) => {
    setBusyAction("create-item");
    try {
      await API.post(
        "/posts",
        {
          ...formData,
          price: formData.price === "" ? 0 : Number(formData.price),
        },
        auth.token
      );
      pushStatus("Post created successfully.", "success");
      await Promise.all([loadItems(), loadMyItems()]);
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not create item.");
    } finally {
      setBusyAction("");
    }
  };

  const requestItem = async (itemId) => {
    setBusyAction(`request-${itemId}`);
    try {
      await API.post(`/requests/${itemId}`, {}, auth.token);
      pushStatus("Borrow request sent.", "success");
      await loadRequests();
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not request this item.");
    } finally {
      setBusyAction("");
    }
  };

  const updateRequestStatus = async (requestId, nextStatus) => {
    setBusyAction(`${nextStatus}-${requestId}`);
    try {
      await API.put(`/requests/${requestId}`, { status: nextStatus }, auth.token);
      pushStatus(`Request ${nextStatus}.`, "success");
      await Promise.all([loadItems(), loadRequests(), loadMyItems()]);
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not update request.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) {
      return { ok: false, message: "Delete cancelled." };
    }

    setBusyAction(`delete-${itemId}`);
    try {
      await API.delete(`/posts/${itemId}`, auth.token);
      pushStatus("Post deleted successfully.", "success");
      await Promise.all([loadItems(), loadRequests(), loadMyItems()]);
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not delete item.");
    } finally {
      setBusyAction("");
    }
  };

  const markItemSold = async (itemId) => {
    const confirmed = window.confirm("Mark this item as sold? Pending requests will be closed.");
    if (!confirmed) {
      return { ok: false, message: "Mark as sold cancelled." };
    }

    setBusyAction(`sold-${itemId}`);
    try {
      await API.put(`/posts/${itemId}/sold`, {}, auth.token);
      pushStatus("Item marked as sold.", "success");
      await Promise.all([loadItems(), loadRequests(), loadMyItems()]);
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not mark item as sold.");
    } finally {
      setBusyAction("");
    }
  };

  const updateItem = async (itemId, formData) => {
    setBusyAction(`edit-${itemId}`);
    try {
      await API.put(
        `/posts/${itemId}`,
        {
          ...formData,
          price: formData.price === "" ? 0 : Number(formData.price),
        },
        auth.token
      );
      pushStatus("Post updated successfully.", "success");
      await Promise.all([loadItems(), loadMyItems()]);
      return { ok: true };
    } catch (error) {
      return handleMutationError(error, "Could not update item.");
    } finally {
      setBusyAction("");
    }
  };

  const filteredItems = items.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = normalizedQuery
      ? [item.title, item.category, item.description, item.owner?.name, item.owner?.collegeId]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      : true;
    const matchesCategory = activeCategory === "All"
      ? true
      : (item.category || "General").toLowerCase() === activeCategory.toLowerCase();

    return matchesQuery && matchesCategory;
  });

  const outgoingRequestByItemId = outgoingRequests.reduce((accumulator, request) => {
    if (request.item?._id) {
      accumulator[request.item._id] = request;
    }
    return accumulator;
  }, {});

  const appContext = {
    auth,
    items,
    filteredItems,
    incomingRequests,
    outgoingRequests,
    myItems,
    outgoingRequestByItemId,
    status,
    busyAction,
    categoryOptions,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    registerUser,
    loginUser,
    logoutUser,
    createItem,
    updateItem,
    requestItem,
    updateRequestStatus,
    deleteItem,
    markItemSold,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout context={appContext} />}>
          <Route path="/" element={auth.token ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path="/posts/:id/edit" element={<CreatePost />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={auth.token ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout({ context }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const showSidebar = context.auth.token && !isAuthPage;
  const showFeedHero = location.pathname === "/" && context.auth.token;

  return (
    <div className={`app-shell${showSidebar ? " app-shell-with-sidebar" : ""}`}>
      <div className="background-mesh" />
      {showSidebar ? (
        <Navbar auth={context.auth} requests={context.incomingRequests} onLogout={context.logoutUser} />
      ) : null}
      <main className={`content${isAuthPage ? " auth-content" : ""}`}>
        {showFeedHero ? (
          <section className="market-hero">
            <div className="market-copy">
              <p className="eyebrow">Student Hub</p>
              <h1>Buy, rent, or grab free stuff from students around you.</h1>
              <p className="hero-copy">
                Fast feed, short post forms, and a simple deal flow that keeps things moving.
              </p>
            </div>
            <div className="hero-pill-row">
              <span className="owner-tag">{context.filteredItems.length} live listings</span>
              <span className="owner-tag subtle-tag">
                {context.auth.user ? `${context.auth.user.name} is browsing` : "Browse in guest mode"}
              </span>
            </div>
          </section>
        ) : null}
        {context.status.message ? (
          <div className={`toast toast-${context.status.type}`}>{context.status.message}</div>
        ) : null}
        <Outlet context={context} />
      </main>
    </div>
  );
}

export default App;
