import React, { useEffect, useRef } from 'react';

interface TikTokEmbedProps {
  url: string;
  videoId: string;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ videoId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Post message hoặc tương tác khi iframe tải xong nếu cần
    const handleLoad = () => {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'play' }, '*');
        }
      } catch {
        // Safe catch cross-origin restriction
      }
    };

    const currentIframe = iframeRef.current;
    if (currentIframe) {
      currentIframe.addEventListener('load', handleLoad);
    }
    return () => {
      if (currentIframe) {
        currentIframe.removeEventListener('load', handleLoad);
      }
    };
  }, [videoId]);

  return (
    <div className="w-full flex justify-center items-center py-2">
      <div className="w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] max-h-[640px] rounded-lg overflow-hidden bg-black shadow-xl border border-slate-700 relative">
        <iframe
          ref={iframeRef}
          key={videoId}
          src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&mute=1&playsinline=1`}
          title={`TikTok Review - ${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 rounded-lg"
        />
      </div>
    </div>
  );
};
