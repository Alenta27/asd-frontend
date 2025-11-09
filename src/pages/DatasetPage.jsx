import React, { useState, useEffect } from 'react';
import { FiDownload, FiInfo, FiTrash2, FiRefreshCw, FiDatabase } from 'react-icons/fi';
import './DatasetPage.css';

export default function DatasetPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStats, setTotalStats] = useState({ count: 0, records: 0, size: 0 });
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/researcher/datasets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch datasets: ${response.status}`);
      
      const data = await response.json();
      setDatasets(data.datasets || []);
      setTotalStats({
        count: data.totalCount || 0,
        records: data.totalRecords || 0,
        size: formatFileSize(data.totalSize || 0)
      });
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleView = (dataset) => {
    setSelectedDataset(dataset);
    setShowModal(true);
  };

  const handleDownload = async (datasetId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/researcher/datasets/${datasetId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datasetId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download dataset: ' + err.message);
    }
  };

  const handleDelete = async (datasetId) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/researcher/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      // Remove from list
      setDatasets(datasets.filter(d => d.id !== datasetId));
      alert('Dataset deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete dataset: ' + err.message);
    }
  };

  return (
    <div className="dataset-page">
      {/* Header */}
      <div className="dataset-header">
        <div className="header-content">
          <h1>Dataset Management</h1>
          <p>Manage and analyze research datasets</p>
        </div>
        <button className="refresh-btn" onClick={fetchDatasets} disabled={loading}>
          <FiRefreshCw className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="stats-container">
          <div className="stat-card">
            <FiDatabase className="stat-icon" />
            <div>
              <div className="stat-value">{totalStats.count}</div>
              <div className="stat-label">Total Datasets</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-number">📊</span>
            <div>
              <div className="stat-value">{totalStats.records}</div>
              <div className="stat-label">Total Records</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-number">💾</span>
            <div>
              <div className="stat-value">{totalStats.size}</div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-number">✅</span>
            <div>
              <div className="stat-value">{datasets.length}</div>
              <div className="stat-label">Active Datasets</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading datasets...</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className="no-datasets">
          <p>No datasets available at the moment.</p>
        </div>
      ) : (
        <div className="datasets-table-wrapper">
          <table className="datasets-table">
            <thead>
              <tr>
                <th>DATASET NAME</th>
                <th>TYPE</th>
                <th>SIZE</th>
                <th>RECORDS</th>
                <th>LAST UPDATED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.id} className="dataset-row">
                  <td className="dataset-name">
                    <FiDatabase className="dataset-icon" />
                    <div>
                      <strong>{dataset.name}</strong>
                      <p className="dataset-desc">{dataset.description}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge type-${dataset.type.toLowerCase().replace(/\s+/g, '-')}`}>
                      {dataset.type}
                    </span>
                  </td>
                  <td>{dataset.size}</td>
                  <td>{dataset.records}</td>
                  <td>{dataset.lastUpdated}</td>
                  <td>
                    <span className={`status-badge status-${dataset.status.toLowerCase()}`}>
                      {dataset.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-icon view-icon" 
                      title="View Details"
                      onClick={() => handleView(dataset)}
                    >
                      <FiInfo />
                    </button>
                    <button 
                      className="action-icon download-icon" 
                      title="Download Dataset"
                      onClick={() => handleDownload(dataset.id)}
                    >
                      <FiDownload />
                    </button>
                    <button 
                      className="action-icon delete-icon" 
                      title="Delete Dataset"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for viewing details */}
      {showModal && selectedDataset && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDataset.name}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Description:</label>
                <p>{selectedDataset.description}</p>
              </div>
              <div className="detail-row">
                <label>Type:</label>
                <p>{selectedDataset.type}</p>
              </div>
              <div className="detail-row">
                <label>Format:</label>
                <p>{selectedDataset.format}</p>
              </div>
              <div className="detail-row">
                <label>Size:</label>
                <p>{selectedDataset.size}</p>
              </div>
              <div className="detail-row">
                <label>Records:</label>
                <p>{selectedDataset.records}</p>
              </div>
              {selectedDataset.subjects && (
                <div className="detail-row">
                  <label>Subjects:</label>
                  <p>{selectedDataset.subjects}</p>
                </div>
              )}
              {selectedDataset.asd !== undefined && (
                <>
                  <div className="detail-row">
                    <label>ASD Subjects:</label>
                    <p>{selectedDataset.asd}</p>
                  </div>
                  <div className="detail-row">
                    <label>Normal Subjects:</label>
                    <p>{selectedDataset.normal}</p>
                  </div>
                </>
              )}
              <div className="detail-row">
                <label>Acquisition Method:</label>
                <p>{selectedDataset.acquisitionMethod}</p>
              </div>
              <div className="detail-row">
                <label>Last Updated:</label>
                <p>{selectedDataset.lastUpdated}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="download-btn"
                onClick={() => {
                  handleDownload(selectedDataset.id);
                  setShowModal(false);
                }}
              >
                <FiDownload /> Download Dataset
              </button>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dataset-footer">
        <p>💾 Datasets are stored securely and accessible only to authorized researchers.</p>
      </div>
    </div>
  );
}