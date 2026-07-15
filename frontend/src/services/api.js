import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshTokenFn = null;
export const setRefreshFn = (fn) => { refreshTokenFn = fn; };

let currentAccessToken = null;
export const setAccessToken = (token) => { currentAccessToken = token; };

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokenFn?.();
        if (!newToken) throw new Error('Refresh failed');

        currentAccessToken = newToken;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        currentAccessToken = null;
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// API functions — these were all commented out, add them back
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (email, password) =>
  api.post('/auth/register', { email, password });

export const uploadDocument = (formData, onProgress) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
export const requestUpload = (filename, mimeType, fileSize) =>
  api.post('/documents/upload/request', { filename, mimeType, fileSize });

export const confirmUpload = (documentId, s3Key) =>
  api.post('/documents/upload/confirm', { documentId, s3Key });

// Direct S3 upload using presigned URL
export const uploadToS3 = async (presignedUrl, file, onProgress) => {
  return axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  });
};

export const getDocuments = () => api.get('/documents');

export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const sendMessage = (query, documentIds,history=[]) =>
  api.post('/search/query', { query, documentIds, history });

export const handleDelete = async (documentId) => {
  if (!window.confirm("Are you sure you want to delete this document? All related chat contexts will be detached.")) return;

  try {
  
    await api.delete(`/documents/${documentId}`);
    
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
    
    alert("Document deleted successfully!");
  } catch (error) {
    console.error("Failed to delete document:", error);
    alert("Error deleting file.");
  }
};

export default api;