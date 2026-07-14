import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { getDocuments, uploadDocument, deleteDocument, requestUpload, uploadToS3,confirmUpload } from '../../services/api';
import { FileText, Upload, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

export default function DocumentPanel({ selectedDocs, setSelectedDocs }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState({});

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const socket=io({withCredentials:true});
    socket.on('embedding_progress', ({ documentId, progress }) => {
      setEmbeddingProgress(prev => ({ ...prev, [documentId]: progress }));
      if (progress === 100) fetchDocuments(); // refresh when done
    });
    return () => socket.disconnect();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // const formData = new FormData();
    // formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      // await uploadDocument(formData, setUploadProgress);
      // await fetchDocuments();
          // Step 1: Get presigned URL from backend
    const { data } = await requestUpload(
      file.name, 
      file.type, 
      file.size
    );

     const { presignedUrl, s3Key, documentId } = data;

      // Step 2: Upload directly to S3 — backend never touches the file
    await uploadToS3(presignedUrl, file, setUploadProgress);

    // Step 3: Tell backend upload is done — triggers validation + processing
    await confirmUpload(documentId, s3Key);

    await fetchDocuments();
    
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setSelectedDocs(prev => prev.filter(d => d !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const toggleSelect = (id) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const getStatusIcon = (doc) => {
    const progress = embeddingProgress[doc.id];
    if (progress !== undefined && progress < 100) {
      return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    }
    if (doc.status === 'ready') {
      return <CheckCircle size={14} className="text-green-400" />;
    }
    if (doc.status === 'processing') {
      return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    }
    return <AlertCircle size={14} className="text-yellow-400" />;
  };

  return (
    <div className="flex flex-col h-full p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">Documents</h2>
        <span className="text-gray-500 text-xs">{documents.length} files</span>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition mb-4
          ${isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload size={20} className="text-gray-500 mx-auto mb-2" />
        {uploading ? (
          <div>
            <p className="text-gray-400 text-xs mb-2">Uploading...</p>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-xs">
            {isDragActive ? 'Drop PDF here' : 'Drop PDF or click to upload'}
          </p>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {documents.length === 0 ? (
          <p className="text-gray-600 text-xs text-center mt-8">
            No documents yet. Upload a PDF to get started.
          </p>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => toggleSelect(doc.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition group
                ${selectedDocs.includes(doc.id)
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                }`}
            >
              <FileText size={16} className="text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{doc.filename}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {getStatusIcon(doc)}
                  <span className="text-gray-500 text-xs capitalize">
                    {embeddingProgress[doc.id] !== undefined && embeddingProgress[doc.id] < 100
                      ? `Embedding ${embeddingProgress[doc.id]}%`
                      : doc.status}
                  </span>
                </div>
              </div>

              {/* Delete — admin only */}
              {user?.role === 'admin' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected count */}
      {selectedDocs.length > 0 && (
        <div className="mt-3 bg-blue-600/10 border border-blue-500/20 rounded-lg p-2 text-center">
          <p className="text-blue-400 text-xs">
            {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected for search
          </p>
        </div>
      )}
    </div>
  );
}