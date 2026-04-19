import axios from "axios";

// Base instance
export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // Need this for refresh token in httpOnly cookie
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh
        const res = await axios.post(
          "http://localhost:8000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        
        if (res.data?.success && res.data.data?.access_token) {
          const newAccessToken = res.data.data.access_token;
          localStorage.setItem("accessToken", newAccessToken);
          
          // Re-run original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
