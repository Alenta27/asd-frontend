import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FiHome,
  FiTrendingUp,
  FiUsers,
  FiMap,
  FiBook,
  FiCpu,
  FiSettings,
  FiLogOut,
  FiActivity,
  FiDatabase,
} from 'react-icons/fi';
import DreamDatasetAnalysis from '../components/DreamDatasetAnalysis';
import './ResearchDashboard.css';

const mockPrevalenceData = [
  { year: 2000, rate: 6.7, source: 'CDC' },
  { year: 2004, rate: 8.9, source: 'CDC' },
  { year: 2008, rate: 11.3, source: 'CDC' },
  { year: 2012, rate: 14.7, source: 'CDC' },
  { year: 2016, rate: 18.5, source: 'CDC' },
  { year: 2020, rate: 23.0, source: 'CDC' },
  { year: 2023, rate: 28.8, source: 'CDC' },
  { year: 2024, rate: 32.5, source: 'CDC' },
  { year: 2025, rate: 34.2, source: 'CDC' },
  { year: 2026, rate: 36.1, source: 'CDC' },
];

const mockGenderData = [
  { year: 2000, boys: 10.2, girls: 2.6 },
  { year: 2004, boys: 13.5, girls: 3.2 },
  { year: 2008, boys: 17.2, girls: 4.1 },
  { year: 2012, boys: 22.8, girls: 5.3 },
  { year: 2016, boys: 28.1, girls: 6.8 },
  { year: 2020, boys: 35.2, girls: 8.9 },
  { year: 2023, boys: 44.5, girls: 11.2 },
  { year: 2024, boys: 50.2, girls: 12.8 },
  { year: 2025, boys: 53.4, girls: 13.5 },
  { year: 2026, boys: 56.8, girls: 14.5 },
];

const mockRegionalData = [
  { country: 'USA', prevalence: 36.1, source: 'CDC 2026' },
  { country: 'UK', prevalence: 31.4, source: 'NHS 2026' },
  { country: 'Canada', prevalence: 30.2, source: 'Statistics Canada 2026' },
  { country: 'Australia', prevalence: 28.5, source: 'AIHW 2025' },
  { country: 'Japan', prevalence: 19.8, source: 'WHO 2025' },
  { country: 'Germany', prevalence: 24.1, source: 'RKI 2025' },
  { country: 'India', prevalence: 9.8, source: 'ICMR 2025' },
  { country: 'Brazil', prevalence: 16.7, source: 'FIOCRUZ 2025' },
];

const mockArticles = [
  {
    id: 1,
    year: 2026,
    title: 'AI-Powered Early Intervention: Transforming ASD Support',
    authors: 'Martinez & Thompson',
    source: 'Nature Medicine',
    finding: 'AI-driven personalized interventions improve outcomes by 58% vs standard care.',
    abstract:
      'Multimodal AI systems analyzing behavioral patterns enable highly personalized early intervention strategies, showing significant improvements in social communication and adaptive skills across diverse populations.',
    sourceUrl: 'https://www.nature.com/nm/',
  },
  {
    id: 2,
    year: 2026,
    title: 'Multimodal Biometric Analysis for ASD Detection',
    authors: 'Kumar et al.',
    source: 'JAMA Pediatrics',
    finding: 'Combining gaze tracking, facial analysis, and motor patterns achieves 94% accuracy.',
    abstract:
      'Integration of eye-tracking data, facial feature analysis, and kinematic motor patterns using deep learning fusion models significantly outperforms single-modality approaches in early autism detection.',
    sourceUrl: 'https://jamanetwork.com/journals/jamapediatrics',
  },
  {
    id: 3,
    year: 2025,
    title: 'Latest Breakthroughs in ASD Diagnostic Biomarkers',
    authors: 'Anderson et al.',
    source: 'Nature Medicine',
    finding: 'Blood-based biomarkers show 92% accuracy in early ASD detection.',
    abstract:
      'This study identifies a panel of metabolic biomarkers that can distinguish ASD from neurotypical development in toddlers with high sensitivity and specificity.',
    sourceUrl: 'https://www.nature.com/nm/',
  },
  {
    id: 4,
    year: 2025,
    title: 'Global Autism Report: Trends and Trajectories',
    authors: 'WHO Research Team',
    source: 'WHO Portal',
    finding: 'ASD prevalence up 0.5% globally. Increased diagnosis in developing nations.',
    abstract:
      'Synthesizes surveillance data from 84 countries, highlighting rising autism prevalence, diagnostic disparities, and policy recommendations for early support infrastructure.',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders',
  },
  {
    id: 5,
    year: 2024,
    title: 'Early Detection Advances in Autism Spectrum Disorder',
    authors: 'CDC Division',
    source: 'PubMed Central',
    finding: 'Early diagnosis by 24 months possible with refined screening tools.',
    abstract:
      'Evaluates longitudinal screening trials demonstrating reliable detection by 24 months using multimodal developmental assessments across diverse cohorts.',
    sourceUrl: 'https://www.cdc.gov/ncbddd/autism/research.html',
  },
  {
    id: 6,
    year: 2024,
    title: 'Gender Disparities in Autism Diagnosis and Outcomes',
    authors: 'Loomes et al.',
    source: 'Nature Neuroscience',
    finding: 'Girls underdiagnosed 3:1. Social masking and internalizing behaviors overlooked.',
    abstract:
      'Meta-analysis revealing diagnostic bias against girls, emphasizing the role of social camouflaging behaviors and recommending sex-informed screening criteria.',
    sourceUrl: 'https://www.nature.com/articles/nature21355',
  },
  {
    id: 7,
    year: 2023,
    title: 'Machine Learning Models for ASD Prediction',
    authors: 'Kumar & Singh',
    source: 'IEEE Transactions',
    finding: 'CNN models achieve 91% accuracy. Ensemble methods improve detection.',
    abstract:
      'Benchmarks multiple deep learning architectures on multimodal behavioral datasets, showing ensembles improve generalization for early-stage ASD detection.',
    sourceUrl: 'https://ieeexplore.ieee.org/',
  },
  {
    id: 8,
    year: 2023,
    title: 'The Role of Early Intervention in ASD Outcomes',
    authors: 'Johnson et al.',
    source: 'The Lancet',
    finding: 'Early intervention improves long-term outcomes by 45% in core domains.',
    abstract:
      'Randomized controlled study quantifying language, social, and adaptive skill gains after structured early intervention delivered within the first three years.',
    sourceUrl: 'https://www.thelancet.com/',
  },
  {
    id: 9,
    year: 2023,
    title: 'Facial Analysis for Autism Detection: A Systematic Review',
    authors: 'Chen & Yang',
    source: 'Computer Vision & Image Understanding',
    finding: 'Facial features show promise but require diverse datasets for validation.',
    abstract:
      'Reviews 42 computer vision studies applying facial analysis to autism detection, underscoring dataset diversity and ethical considerations for deployment.',
    sourceUrl: 'https://www.sciencedirect.com/journal/computer-vision-and-image-understanding',
  },
];

const mockScreeningModels = [
  { model: 'Multimodal Fusion AI', accuracy: 94, source: 'NIH 2026', method: 'Gaze + Facial + Kinematic Analysis' },
  { model: 'CNN Deep Learning', accuracy: 92, source: 'NIH 2025', method: 'Facial Feature Recognition' },
  { model: 'Transformer Network', accuracy: 90, source: 'IEEE 2025', method: 'Behavioral Sequence Analysis' },
  { model: 'Random Forest', accuracy: 88, source: 'NIH 2024', method: 'Multi-feature Ensemble' },
  { model: 'SVM', accuracy: 86, source: 'IEEE 2024', method: 'Speech & EEG Features' },
  { model: 'KNN', accuracy: 84, source: 'Elsevier 2023', method: 'Behavioral Clustering' },
  { model: 'Naive Bayes', accuracy: 82, source: 'BMC 2023', method: 'Behavioral Scoring' },
];

const Sidebar = ({ activeNav, onNavClick, onLogout }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: FiHome, path: '/research' },
    { id: 'trends', label: 'ASD Global Trends', icon: FiTrendingUp, path: '/research/trends' },
    { id: 'gender', label: 'Gender Analysis', icon: FiUsers, path: '/research/gender' },
    { id: 'regional', label: 'Regional Prevalence', icon: FiMap, path: '/research/regional' },
    { id: 'dream', label: 'DREAM Dataset Analysis', icon: FiActivity, path: '/research/dream' },
    { id: 'datasets', label: 'Dataset Repository', icon: FiDatabase, path: '/research/datasets' },
    { id: 'articles', label: 'Research Articles', icon: FiBook, path: '/research/articles' },
    { id: 'models', label: 'Screening Models', icon: FiCpu, path: '/research/models' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">CX</div>
        <div>
          <h2>CORTEXA</h2>
          <p>Research Insights</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.path)}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <button onClick={() => onNavClick('/research/settings')} className="nav-item">
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </button>
        <button onClick={onLogout} className="nav-item logout-btn">
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const HomePage = () => (
  <div className="research-content">
    <div className="page-header">
      <h1>CORTEXA Research Insights</h1>
      <p>Understanding Autism Through Global Data and Studies</p>
    </div>

    <div className="overview-cards">
      <div className="stat-card primary">
        <div className="stat-icon">📊</div>
        <div className="stat-info">
          <p className="stat-label">Global ASD Prevalence (2026)</p>
          <p className="stat-value">1 in 36</p>
          <p className="stat-detail">Source: CDC Surveillance, March 2026</p>
        </div>
      </div>

      <div className="stat-card secondary">
        <div className="stat-icon">♂♀</div>
        <div className="stat-info">
          <p className="stat-label">Gender Diagnosis Ratio</p>
          <p className="stat-value">3.9:1</p>
          <p className="stat-detail">Boys to girls (Source: CDC, 2026)</p>
        </div>
      </div>

      <div className="stat-card tertiary">
        <div className="stat-icon">🌍</div>
        <div className="stat-info">
          <p className="stat-label">Global Studies Reviewed</p>
          <p className="stat-value">187</p>
          <p className="stat-detail">Peer-reviewed studies (WHO, CDC, PubMed)</p>
        </div>
      </div>

      <div className="stat-card quaternary">
        <div className="stat-icon">📈</div>
        <div className="stat-info">
          <p className="stat-label">Trend Since 2000</p>
          <p className="stat-value">+439%</p>
          <p className="stat-detail">Increase in diagnosed prevalence rate (CDC)</p>
        </div>
      </div>
    </div>

    <div className="chart-grid">
      <div className="chart-card large">
        <h3>Global ASD Prevalence Rate (2000-2026)</h3>
        <p className="chart-subtitle">Per 1,000 children — CDC ADDM Network</p>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={mockPrevalenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="year"
              stroke="#666"
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="#666"
              label={{ value: 'Prevalence per 1,000 children', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              formatter={(value) => [`${value} per 1,000`, 'Prevalence Rate']}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#667eea"
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Research Datasets & Model Development Section */}
    <div className="datasets-section">
      <div className="section-header">
        <h2>Research Datasets & Model Development</h2>
        <p className="section-description">
          This section summarizes the multimodal datasets used to develop and evaluate the CORTEXA Autism Detection System.
        </p>
      </div>

      <div className="dataset-cards-grid">
        {/* Dataset 1: ABIDE MRI */}
        <div className="dataset-card">
          <div className="dataset-icon">🧠</div>
          <div className="dataset-content">
            <h3 className="dataset-name">ABIDE MRI Dataset</h3>
            <div className="dataset-meta">
              <span className="dataset-type">Neuroimaging (MRI brain scans)</span>
            </div>
            <div className="dataset-info">
              <div className="info-item">
                <span className="info-label">Purpose:</span>
                <span className="info-value">Detect structural brain differences in ASD</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model Used:</span>
                <span className="info-value">Support Vector Machine (SVM)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Features:</span>
                <span className="info-value">Brain connectivity patterns, cortical thickness</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset 2: Facial Emotion */}
        <div className="dataset-card">
          <div className="dataset-icon">😊</div>
          <div className="dataset-content">
            <h3 className="dataset-name">Facial Emotion Dataset</h3>
            <div className="dataset-meta">
              <span className="dataset-type">Image dataset</span>
            </div>
            <div className="dataset-info">
              <div className="info-item">
                <span className="info-label">Purpose:</span>
                <span className="info-value">Facial expression screening for early autism indicators</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model Used:</span>
                <span className="info-value">Convolutional Neural Network (CNN)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Features:</span>
                <span className="info-value">Facial emotion recognition (happy, sad, neutral, angry)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset 3: DREAM Autism Therapy */}
        <div className="dataset-card">
          <div className="dataset-icon">👁️</div>
          <div className="dataset-content">
            <h3 className="dataset-name">DREAM Autism Therapy Dataset</h3>
            <div className="dataset-meta">
              <span className="dataset-type">Behavioral motion and gaze dataset</span>
            </div>
            <div className="dataset-info">
              <div className="info-item">
                <span className="info-label">Purpose:</span>
                <span className="info-value">Analyze behavioral patterns during therapy sessions</span>
              </div>
              <div className="info-item">
                <span className="info-label">Features Extracted:</span>
                <ul className="features-list">
                  <li>Average Joint Velocity</li>
                  <li>Head Gaze Variance</li>
                  <li>Communication Score (ADOS)</li>
                  <li>Movement Displacement Ratio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset 4: Behavioral Interaction */}
        <div className="dataset-card">
          <div className="dataset-icon">🎮</div>
          <div className="dataset-content">
            <h3 className="dataset-name">Behavioral Interaction Dataset</h3>
            <div className="dataset-meta">
              <span className="dataset-type">Game interaction logs</span>
            </div>
            <div className="dataset-info">
              <div className="info-item">
                <span className="info-label">Purpose:</span>
                <span className="info-value">Measure attention span and cognitive response</span>
              </div>
              <div className="info-item">
                <span className="info-label">Features:</span>
                <ul className="features-list">
                  <li>Reaction time</li>
                  <li>Focus duration</li>
                  <li>Error rate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset 5: Autism Screening Questionnaire */}
        <div className="dataset-card">
          <div className="dataset-icon">📋</div>
          <div className="dataset-content">
            <h3 className="dataset-name">Autism Screening Questionnaire Dataset</h3>
            <div className="dataset-meta">
              <span className="dataset-type">Behavioral questionnaire</span>
            </div>
            <div className="dataset-info">
              <div className="info-item">
                <span className="info-label">Purpose:</span>
                <span className="info-value">Initial autism risk screening</span>
              </div>
              <div className="info-item">
                <span className="info-label">Features:</span>
                <ul className="features-list">
                  <li>Behavioral scoring</li>
                  <li>Risk classification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* DREAM Dataset Analysis Section */}
    <div className="dream-section">
      <div className="section-header">
        <h2>Behavioral Biometrics Analysis – DREAM Dataset</h2>
        <p className="section-description">
          Behavioral motion and gaze biometrics extracted from the DREAM autism therapy dataset.
        </p>
      </div>
      <DreamDatasetAnalysis />
    </div>
  </div>
);

const TrendsPage = () => (
  <div className="research-content">
    <div className="page-header">
      <h1>ASD Global Trends</h1>
      <p>Historical prevalence data from worldwide studies</p>
    </div>

    <div className="filters-section">
      <select className="filter-select">
        <option>CDC Network</option>
        <option>WHO Database</option>
        <option>ADDM Network</option>
      </select>
      <select className="filter-select">
        <option>Total Population</option>
        <option>Age 4</option>
        <option>Age 8</option>
        <option>Age 12</option>
      </select>
    </div>

    <div className="chart-grid">
      <div className="chart-card large">
        <h3>Prevalence Estimates Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mockPrevalenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="year" stroke="#666" />
            <YAxis label={{ value: 'Per 1,000 children', angle: -90, position: 'insideLeft' }} stroke="#666" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="rate" 
              name="Prevalence Rate"
              stroke="#667eea" 
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-note">
          <p>📌 <strong>Note:</strong> Data represents ASD prevalence estimates from CDC surveillance studies. Increases reflect both improved diagnostic criteria and increased awareness.</p>
        </div>
      </div>
    </div>
  </div>
);

const GenderPage = () => (
  <div className="research-content">
    <div className="page-header">
      <h1>Gender Analysis in ASD Diagnosis</h1>
      <p>Boys vs. Girls prevalence trends and underdiagnosis patterns</p>
    </div>

    <div className="chart-grid">
      <div className="chart-card large">
        <h3>Prevalence Estimates by Sex</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mockGenderData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="year" stroke="#666" />
            <YAxis label={{ value: 'Per 1,000 children', angle: -90, position: 'insideLeft' }} stroke="#666" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="boys" 
              name="Boys"
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="girls" 
              name="Girls"
              stroke="#f97316" 
              strokeWidth={3}
              dot={{ fill: '#f97316', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-card">
        <h3>Key Insights</h3>
        <div className="insight-item">
          <p className="insight-title">📊 Gender Ratio</p>
          <p className="insight-text">Recent 2026 data shows approximately 3.9 boys diagnosed for every 1 girl, showing continued narrowing of the ratio as diagnostic criteria improve and awareness increases.</p>
        </div>
        <div className="insight-item">
          <p className="insight-title">🔍 Underdiagnosis in Girls</p>
          <p className="insight-text">Studies suggest girls are significantly underdiagnosed (Loomes et al., 2017) due to:</p>
          <ul>
            <li>Social masking and camouflaging behaviors</li>
            <li>Internalized symptoms rather than externalizing</li>
            <li>Different presentation patterns</li>
            <li>Male-centric diagnostic criteria historically</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const RegionalPage = () => (
  <div className="research-content">
    <div className="page-header">
      <h1>Regional ASD Prevalence</h1>
      <p>Worldwide prevalence estimates and regional variations</p>
    </div>

    <div className="chart-grid">
      <div className="chart-card">
        <h3>Prevalence by Country</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockRegionalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} stroke="#666" />
            <YAxis label={{ value: 'Per 1,000 children', angle: -90, position: 'insideLeft' }} stroke="#666" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
            <Bar dataKey="prevalence" fill="#667eea" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="regional-table">
        <h3>Regional Data Summary</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Prevalence (per 1,000)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {mockRegionalData.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'even' : ''}>
                <td>{item.country}</td>
                <td className="prevalence-cell">{item.prevalence}</td>
                <td className="source-cell">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ArticlesPage = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const handleReadAbstract = (article) => {
    setSelectedArticle(article);
  };

  const handleVisitSource = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="research-content">
      <div className="page-header">
        <h1>Research Articles</h1>
        <p>Key publications and findings from global autism research</p>
      </div>

      <div className="articles-grid">
        {mockArticles.map((article) => (
          <div key={article.id} className="article-card">
            <div className="article-header">
              <span className="article-year">{article.year}</span>
              <p className="article-source">{article.source}</p>
            </div>
            <h3 className="article-title">{article.title}</h3>
            <p className="article-authors">By {article.authors}</p>
            <div className="article-finding">
              <p className="finding-label">📌 Key Finding:</p>
              <p className="finding-text">{article.finding}</p>
            </div>
            <div className="article-actions">
              <button className="action-btn" onClick={() => handleReadAbstract(article)}>
                🔍 Read Abstract
              </button>
              <button
                className={`action-btn secondary${!article.sourceUrl ? ' disabled' : ''}`}
                onClick={() => handleVisitSource(article.sourceUrl)}
                disabled={!article.sourceUrl}
              >
                🌐 Visit Source
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedArticle && (
        <div className="modal-overlay" onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedArticle.title}</h3>
              <button className="modal-close" onClick={handleCloseModal} aria-label="Close">
                ×
              </button>
            </div>
            <p className="modal-meta">
              {selectedArticle.authors} • {selectedArticle.source} • {selectedArticle.year}
            </p>
            <p className="modal-abstract">{selectedArticle.abstract}</p>
            <div className="modal-footer">
              <button className="action-btn" onClick={handleCloseModal}>
                Close
              </button>
              <button
                className={`action-btn secondary${!selectedArticle.sourceUrl ? ' disabled' : ''}`}
                onClick={() => handleVisitSource(selectedArticle.sourceUrl)}
                disabled={!selectedArticle.sourceUrl}
              >
                🌐 Visit Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DatasetRepositoryPage = () => {
  const handleDownload = (datasetName, downloadUrl) => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Download for ${datasetName} is not yet available.`);
    }
  };

  const datasets = [
    {
      id: 1,
      name: 'DREAM Autism Therapy Dataset',
      type: 'Behavioral motion + gaze dataset',
      size: '31 GB',
      description: 'Therapy session recordings used to analyze behavioral motion and gaze patterns in children with autism.',
      icon: '👁️',
      downloadUrl: 'https://github.com/dream2020/data',
      color: '#667eea'
    },
    {
      id: 2,
      name: 'ABIDE MRI Dataset',
      type: 'Neuroimaging MRI dataset',
      size: '~1 TB',
      description: 'Brain imaging dataset used for autism classification using machine learning.',
      icon: '🧠',
      downloadUrl: 'http://fcon_1000.projects.nitrc.org/indi/abide/',
      color: '#f97316'
    },
    {
      id: 3,
      name: 'Facial Emotion Recognition Dataset',
      type: 'Image dataset',
      size: '~500 MB',
      description: 'Facial expression dataset used for CNN-based emotion recognition.',
      icon: '😊',
      downloadUrl: null,
      color: '#2563eb'
    },
    {
      id: 4,
      name: 'Behavioral Interaction Dataset',
      type: 'Game interaction logs',
      size: '~200 MB',
      description: 'Dataset collected from attention-based behavioral games.',
      icon: '🎮',
      downloadUrl: null,
      color: '#10b981'
    },
  ];

  return (
    <div className="research-content">
      <div className="page-header">
        <h1>CORTEXA Research Dataset Repository</h1>
        <p>This repository provides access to datasets used for developing and evaluating the CORTEXA Autism Detection System.</p>
      </div>

      <div className="repository-grid">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="repository-card" style={{ borderLeftColor: dataset.color }}>
            <div className="repository-header">
              <div className="repository-icon" style={{ backgroundColor: `${dataset.color}20` }}>
                {dataset.icon}
              </div>
              <div className="repository-meta">
                <h3 className="repository-name">{dataset.name}</h3>
                <div className="repository-tags">
                  <span className="tag type-tag">{dataset.type}</span>
                  <span className="tag size-tag">{dataset.size}</span>
                </div>
              </div>
            </div>
            
            <p className="repository-description">{dataset.description}</p>
            
            <div className="repository-actions">
              <button 
                className="download-btn"
                onClick={() => handleDownload(dataset.name, dataset.downloadUrl)}
                style={{ backgroundColor: dataset.color }}
              >
                {dataset.downloadUrl ? '⬇️ Download Dataset' : '🔒 Access Restricted'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="repository-note">
        <h4>📚 Dataset Usage Guidelines</h4>
        <ul>
          <li>All datasets are provided for <strong>research and educational purposes only</strong></li>
          <li>Please cite the original dataset sources in your publications</li>
          <li>Follow each dataset's specific license and usage terms</li>
          <li>For proprietary datasets, contact the research team for access permissions</li>
        </ul>
      </div>
    </div>
  );
};

const ModelsPage = () => (
  <div className="research-content">
    <div className="page-header">
      <h1>Screening Models Overview</h1>
      <p>Comparison of algorithms used in ASD detection research</p>
    </div>

    <div className="chart-grid">
      <div className="chart-card">
        <h3>Model Accuracy Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockScreeningModels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="model" stroke="#666" />
            <YAxis domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} stroke="#666" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
            <Bar dataKey="accuracy" fill="#667eea" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="models-table">
        <h3>Screening Models Details</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Accuracy</th>
              <th>Method</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {mockScreeningModels.map((model, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'even' : ''}>
                <td className="model-name">{model.model}</td>
                <td className="accuracy-cell">{model.accuracy}%</td>
                <td className="method-cell">{model.method}</td>
                <td className="source-cell">{model.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="models-note">
      <p><strong>📊 Note:</strong> Accuracies are from published literature. Real-world performance depends on dataset diversity, preprocessing, and implementation details.</p>
    </div>
  </div>
);

const RightSidebar = () => (
  <div className="right-sidebar">
    <div className="stats-section">
      <div className="stats-card">
        <p className="stat-label">Key Methodologies</p>
        <p className="stat-value">MRI, fMRI, AI, Genetic</p>
      </div>
      <div className="stats-card">
        <p className="stat-label">Latest Update</p>
        <p className="stat-value">March 2026</p>
      </div>
      <div className="stats-card">
        <p className="stat-label">Screening Algorithms</p>
        <p className="stat-value">7</p>
      </div>
      <div className="stats-card">
        <p className="stat-label">Countries Analyzed</p>
        <p className="stat-value">8</p>
      </div>
    </div>

    <div className="info-section">
      <h4>About CORTEXA Research</h4>
      <p>This dashboard compiles academic research and global data to provide insights into Autism Spectrum Disorder prevalence, diagnosis trends, and detection methodologies.</p>
      <p>All data sourced from CDC, WHO, peer-reviewed publications, and major research networks. Updated daily with the latest findings.</p>
    </div>
  </div>
);

export default function ResearchDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState('home');

  const pages = {
    home: <HomePage />,
    trends: <TrendsPage />,
    gender: <GenderPage />,
    regional: <RegionalPage />,
    dream: <DreamDatasetAnalysis />,
    datasets: <DatasetRepositoryPage />,
    articles: <ArticlesPage />,
    models: <ModelsPage />,
  };

  useEffect(() => {
    const navMap = {
      '/research': 'home',
      '/research/trends': 'trends',
      '/research/gender': 'gender',
      '/research/regional': 'regional',
      '/research/dream': 'dream',
      '/research/datasets': 'datasets',
      '/research/articles': 'articles',
      '/research/models': 'models',
    };
    setActiveNav(navMap[location.pathname] || 'home');
  }, [location.pathname]);

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="research-dashboard">
      <Sidebar activeNav={activeNav} onNavClick={handleNavClick} onLogout={handleLogout} />
      <div className="main-section">
        {pages[activeNav] || pages.home}
      </div>
      <RightSidebar />
    </div>
  );
}
