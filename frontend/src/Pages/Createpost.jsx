import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";

const categoryChoices = ["Books", "Electronics", "Furniture", "Fashion", "Cycles", "Notes", "Hostel"];
const listingModes = ["Sell", "Rent", "Free"];
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.78;

const getModeFromItem = (item) => {
  if (Number(item.price) <= 0) {
    return "Free";
  }

  return item.description?.toLowerCase().includes("rent") ? "Rent" : "Sell";
};

const getDescriptionForPost = (mode, category) => {
  const description = mode === "Free"
    ? "Free pickup on campus."
    : mode === "Rent"
      ? "Available to rent on campus."
      : "Available for sale on campus.";

  return `${description} ${category} listing.`;
};

const resizeImageFile = (file) => new Promise((resolve, reject) => {
  const fileReader = new FileReader();

  fileReader.onerror = () => reject(new Error("Could not read the selected image."));
  fileReader.onload = () => {
    const img = new Image();

    img.onerror = () => reject(new Error("Could not process the selected image."));
    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(img.width, img.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not prepare the image for upload."));
        return;
      }

      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };

    img.src = fileReader.result;
  };

  fileReader.readAsDataURL(file);
});

function CreatePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, createItem, updateItem, myItems, busyAction } = useOutletContext();
  const isEditing = Boolean(id);
  const [post, setPost] = useState({
    title: "",
    category: "Books",
    imageUrl: "",
    price: "",
    mode: "Sell",
    phoneNumber: "",
  });
  const [dragActive, setDragActive] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const currentItem = isEditing ? myItems.find((item) => item._id === id) : null;

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    setPost({
      title: currentItem.title || "",
      category: currentItem.category || "Books",
      imageUrl: currentItem.imageUrl || "",
      price: Number(currentItem.price) > 0 ? String(currentItem.price) : "",
      mode: getModeFromItem(currentItem),
      phoneNumber: currentItem.phoneNumber || "",
    });
  }, [currentItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...post,
      price: post.mode === "Free" ? 0 : post.price,
      description: getDescriptionForPost(post.mode, post.category),
    };
    const result = isEditing
      ? await updateItem(id, payload)
      : await createItem(payload);

    if (result.ok) {
      setPost({
        title: "",
        category: "Books",
        imageUrl: "",
        price: "",
        mode: "Sell",
        phoneNumber: "",
      });
      navigate("/");
    }
  };

  const applyImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    try {
      setImageBusy(true);
      setImageError("");
      const imageUrl = await resizeImageFile(file);
      setPost((current) => ({ ...current, imageUrl }));
    } catch (error) {
      setImageError(error.message || "Could not prepare the image.");
    } finally {
      setImageBusy(false);
    }
  };

  const handleImageDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    await applyImageFile(file);
  };

  const handleImagePick = async (event) => {
    const file = event.target.files?.[0];
    await applyImageFile(file);
  };

  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  if (isEditing && !currentItem && myItems.length > 0) {
    return <Navigate to="/my-posts" replace />;
  }

  return (
    <section className="panel form-panel compact-form-panel">
      <h2>{isEditing ? "Edit Post" : "Add Post"}</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label
          className={`upload-dropzone${dragActive ? " active" : ""}`}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleImageDrop}
          htmlFor="imageUpload"
        >
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImagePick}
          />
          {imageBusy ? (
            <div>
              <strong>Preparing image...</strong>
              <p>Compressing it for a faster post.</p>
            </div>
          ) : post.imageUrl ? (
            <img src={post.imageUrl} alt="Preview" />
          ) : (
            <div>
              <strong>Big image upload</strong>
              <p>Drag and drop or tap to pick a photo.</p>
            </div>
          )}
        </label>
        {imageError ? <p className="field-help">{imageError}</p> : null}
        <div>
          <label className="field-label" htmlFor="title">Title</label>
          <input
            id="title"
            placeholder="Engineering drawing kit"
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
          />
        </div>
        <div className="dual-field-grid">
          <div>
            <label className="field-label" htmlFor="category">Category</label>
            <select
              id="category"
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
            >
              {categoryChoices.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="price">Price or deposit</label>
            <input
              id="price"
              type="number"
              min="0"
              placeholder={post.mode === "Rent" ? "Price per day" : "Price"}
              value={post.price}
              onChange={(e) => setPost({ ...post, price: e.target.value })}
              disabled={post.mode === "Free"}
            />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="phoneNumber">Phone number</label>
          <input
            id="phoneNumber"
            type="tel"
            placeholder="Contact number (optional)"
            value={post.phoneNumber}
            onChange={(e) => setPost({ ...post, phoneNumber: e.target.value })}
          />
        </div>
        <div>
          <span className="field-label">Listing type</span>
          <div className="toggle-row">
            {listingModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`toggle-pill${post.mode === mode ? " active" : ""}`}
                onClick={() => setPost((current) => ({
                  ...current,
                  mode,
                  price: mode === "Free" ? "" : current.price,
                }))}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={busyAction === "create-item" || busyAction === `edit-${id}` || imageBusy}
        >
          {busyAction === "create-item"
            ? "Publishing..."
            : busyAction === `edit-${id}`
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add Post"}
        </button>
      </form>
      <p className="form-footer-link">
        <Link className="text-link" to={isEditing ? "/my-posts" : "/"}>Return</Link>
      </p>
    </section>
  );
}

export default CreatePost;
