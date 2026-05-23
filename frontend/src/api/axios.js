import axios from "axios";

const apiBaseUrl = import.meta.env.MODE == "development" ? "http://localhost:5000/api": "/api";

const rawApi = axios.create({
  baseURL: apiBaseUrl,
});

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

rawApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message
      || error.response?.data
      || "Request failed";
    const status = error.response?.status;

    return Promise.reject(new ApiError(message, status));
  }
);

const withAuth = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const API = {
  get: async (path, token) => {
    const response = token
      ? await rawApi.get(path, withAuth(token))
      : await rawApi.get(path);
    return response.data;
  },

  post: async (path, body, token) => {
    const response = token
      ? await rawApi.post(path, body, withAuth(token))
      : await rawApi.post(path, body);
    return response.data;
  },

  put: async (path, body, token) => {
    const config = token ? withAuth(token) : undefined;
    const response = await rawApi.put(path, body, config);
    return response.data;
  },

  delete: async (path, token) => {
    const config = token ? withAuth(token) : undefined;
    const response = await rawApi.delete(path, config);
    return response.data;
  },
};

export default API;
