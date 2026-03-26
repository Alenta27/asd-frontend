import React, { useEffect, useMemo, useState } from 'react';
import { FiBookOpen } from 'react-icons/fi';
import FilterBar from './FilterBar';
import VideoCard from './VideoCard';
import { awarenessVideos } from './awarenessVideos';

const BOOKMARK_STORAGE_KEY = 'teacher_awareness_bookmarks';
const USEFUL_STORAGE_KEY = 'teacher_awareness_useful';

const AwarenessHub = () => {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(awarenessVideos.map((video) => video.category)));
    return ['All', ...unique];
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState([]);
  const [usefulVideoIds, setUsefulVideoIds] = useState([]);

  useEffect(() => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || '[]');
      const savedUseful = JSON.parse(localStorage.getItem(USEFUL_STORAGE_KEY) || '[]');
      if (Array.isArray(savedBookmarks)) setBookmarkedVideoIds(savedBookmarks);
      if (Array.isArray(savedUseful)) setUsefulVideoIds(savedUseful);
    } catch (error) {
      setBookmarkedVideoIds([]);
      setUsefulVideoIds([]);
    }
  }, []);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') return awarenessVideos;
    return awarenessVideos.filter((video) => video.category === selectedCategory);
  }, [selectedCategory]);

  const toggleBookmark = (videoId) => {
    setBookmarkedVideoIds((prev) => {
      const updated = prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId];
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleUseful = (videoId) => {
    setUsefulVideoIds((prev) => {
      const updated = prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId];
      localStorage.setItem(USEFUL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <section className="awareness-hub-section" aria-label="Awareness Hub">
      <div className="awareness-hub-header">
        <div className="awareness-title-wrap">
          <span className="awareness-title-icon"><FiBookOpen /></span>
          <div>
            <h3 className="awareness-hub-title">Awareness Hub</h3>
            <p className="awareness-hub-subtitle">
              Curated educational videos for autism, ADHD, developmental support, and therapy strategies.
            </p>
          </div>
        </div>

        <div className="awareness-stats-pills">
          <span className="awareness-pill">Saved: {bookmarkedVideoIds.length}</span>
          <span className="awareness-pill useful">Useful: {usefulVideoIds.length}</span>
        </div>
      </div>

      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="awareness-videos-grid">
        {filteredVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isBookmarked={bookmarkedVideoIds.includes(video.id)}
            isUseful={usefulVideoIds.includes(video.id)}
            onToggleBookmark={toggleBookmark}
            onToggleUseful={toggleUseful}
          />
        ))}
      </div>
    </section>
  );
};

export default AwarenessHub;
