# Social Attention Test - Video Configuration

## Overview
The Social Attention Test uses two videos displayed side-by-side to assess a child's preference for social vs. non-social stimuli through gaze tracking.

## Video Requirements

### Left Video (Social)
- **Content**: Human face, social interaction, people talking
- **Format**: MP4 (H.264 codec recommended)
- **Aspect Ratio**: 16:9 or 4:3
- **Duration**: Any (videos loop automatically)
- **Audio**: Not required (videos are muted during test)

### Right Video (Non-Social)
- **Content**: Abstract patterns, shapes, geometric motion
- **Format**: MP4 (H.264 codec recommended)
- **Aspect Ratio**: Should match left video
- **Duration**: Any (videos loop automatically)
- **Audio**: Not required (videos are muted during test)

## Configuration Methods

### Method 1: Environment Variables (Recommended)
Add these variables to your `.env` file:

```env
REACT_APP_SOCIAL_VIDEO_URL=https://your-cdn.com/social-video.mp4
REACT_APP_NON_SOCIAL_VIDEO_URL=https://your-cdn.com/non-social-video.mp4
```

### Method 2: Direct Code Modification
Edit `src/components/games/SocialAttentionGame.jsx`:

```javascript
const SOCIAL_VIDEO_URL = "https://your-domain.com/social.mp4";
const NON_SOCIAL_VIDEO_URL = "https://your-domain.com/non-social.mp4";
```

### Method 3: Backend Override
Your backend API can return custom video URLs in the `/api/social-attention/start` response:

```json
{
  "sessionId": "...",
  "leftVideo": "https://custom-url.com/social.mp4",
  "rightVideo": "https://custom-url.com/non-social.mp4"
}
```

## Default Videos
If no custom URLs are provided, the component uses these defaults:
- **Social**: Google Cloud sample video (human content)
- **Non-Social**: Google Cloud sample video (abstract content)

## Video Hosting Recommendations

### CDN Requirements
- **CORS enabled**: Videos must allow cross-origin requests
- **HTTPS**: Recommended for production
- **Fast delivery**: Low latency improves user experience

### Suggested Hosting Options
1. **AWS S3 + CloudFront** (with CORS configuration)
2. **Google Cloud Storage** (public access enabled)
3. **Cloudinary** (video hosting service)
4. **Azure Blob Storage** (with CDN)

### CORS Configuration Example (AWS S3)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Video Behavior

### During Preview (Start Screen)
- Both videos load and display thumbnails
- Videos are muted and looped
- Users can see what content will be shown

### During Test (30 seconds)
- Both videos start playing simultaneously
- Videos are muted (required for browser autoplay)
- Videos loop continuously
- No controls are shown
- Fullscreen mode is automatically enabled (if supported)
- Gaze tracking measures which video the child looks at

## Browser Compatibility

### Supported Formats
- **Chrome/Edge**: MP4 (H.264, H.265)
- **Firefox**: MP4 (H.264), WebM
- **Safari**: MP4 (H.264)

### Autoplay Policy
Modern browsers require videos to be:
- ✅ Muted (handled automatically)
- ✅ User-initiated (start button provides this)
- ✅ HTTPS in production (recommended)

## Testing Your Videos

### 1. Verify Video URLs
Open each URL in a browser to ensure they play correctly:
```
https://your-cdn.com/social-video.mp4
https://your-cdn.com/non-social-video.mp4
```

### 2. Check CORS Headers
Use browser DevTools (Network tab) to verify CORS headers:
```
Access-Control-Allow-Origin: *
```

### 3. Test Autoplay
Ensure videos can autoplay when muted (Chrome DevTools → Console):
```javascript
const video = document.createElement('video');
video.src = 'https://your-cdn.com/social-video.mp4';
video.muted = true;
video.play().then(() => console.log('✓ Autoplay works'));
```

## Troubleshooting

### Issue: Videos don't load
- Check CORS configuration on your CDN
- Verify URLs are accessible (try opening in browser)
- Check browser console for error messages

### Issue: Videos don't autoplay
- Ensure videos are muted (`muted` attribute is set)
- Check browser's autoplay policy settings
- Test with user interaction (click Start button)

### Issue: Videos are out of sync
- Both videos start simultaneously after 800ms delay
- Ensure both videos are same duration (or use looping)
- Check network speed - slow loading may cause delays

### Issue: Fullscreen not working
- Requires user gesture (Start button provides this)
- May be blocked by browser settings
- Not all mobile browsers support fullscreen

## Security & Privacy

### No Login Required
- Videos load and play without authentication
- Gaze tracking works locally in browser
- Backend integration is optional

### Data Collection
- Gaze data is processed locally using MediaPipe
- Backend logging is optional (only if authenticated)
- No personal data is embedded in videos

## Performance Optimization

### Video Size
- Recommended: 1280×720 (720p) or 1920×1080 (1080p)
- File size: < 10MB per video for fast loading
- Compression: H.264 with moderate bitrate (2-5 Mbps)

### Preloading
- Videos preload during the start screen
- Use CDN with edge caching for faster delivery
- Consider video compression/optimization services

## Example URLs

### Public Test Videos (Development Only)
```javascript
// Social content examples:
"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"

// Non-social content examples:
"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
```

⚠️ **Note**: These are Google Cloud sample videos for testing only. Replace with clinically appropriate content for production use.

## Clinical Considerations

### Content Guidelines
- **Social Video**: Should clearly show faces, eye contact, social interaction
- **Non-Social Video**: Engaging but abstract - shapes, patterns, movement
- **Duration**: 30+ seconds recommended (videos loop)
- **Visual Quality**: High contrast, clear visibility
- **Cultural Sensitivity**: Consider diverse representation

### Research-Backed Content
For clinical validity, consult research literature on:
- Preferential looking paradigm studies
- Social attention assessment protocols
- ASD screening visual stimuli

## Support

For issues or questions about video configuration:
1. Check browser console for error messages
2. Verify CORS and video URL accessibility
3. Test with default videos first
4. Review this documentation for troubleshooting steps

---

**Last Updated**: January 2026  
**Component**: `src/components/games/SocialAttentionGame.jsx`
