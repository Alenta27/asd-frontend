import React from 'react';
import { FiBookmark, FiCheckCircle, FiThumbsUp } from 'react-icons/fi';

const VideoCard = ({
  video,
  isBookmarked,
  isUseful,
  onToggleBookmark,
  onToggleUseful
}) => {
  return (
    <article className="awareness-video-card">
      <div className="awareness-video-frame-wrap">
        <iframe
          className="awareness-video-frame"
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="awareness-video-content">
        <div className="awareness-video-meta">
          <span className="awareness-category-tag">{video.category}</span>
        </div>

        <h4 className="awareness-video-title">{video.title}</h4>
        <p className="awareness-video-description">{video.description}</p>

        <div className="awareness-video-actions">
          <button
            type="button"
            className={`awareness-action-btn ${isBookmarked ? 'active' : ''}`}
            onClick={() => onToggleBookmark(video.id)}
          >
            {isBookmarked ? <FiCheckCircle /> : <FiBookmark />}
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            className={`awareness-action-btn ${isUseful ? 'active useful' : ''}`}
            onClick={() => onToggleUseful(video.id)}
          >
            <FiThumbsUp />
            <span>{isUseful ? 'Marked Useful' : 'Mark as Useful'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
