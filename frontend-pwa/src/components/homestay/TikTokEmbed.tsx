import React, { useEffect, useRef } from 'react';

interface TikTokEmbedProps {
  url: string;
  videoId: string;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ url, videoId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tải script nhúng chính thức của TikTok
    const scriptId = 'tiktok-embed-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Khi component render lại hoặc URL thay đổi, yêu cầu TikTok load lại iframe
    const win = window as unknown as { tiktok?: { embed?: { load?: () => void } } };
    if (win.tiktok?.embed?.load) {
      win.tiktok.embed.load();
    }
  }, [url, videoId]);

  return (
    <div ref={containerRef} className="w-full flex justify-center items-center">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '400px', minWidth: '288px', width: '100%', margin: '0 auto' }}
      >
        <section>
          <a
            target="_blank"
            rel="noreferrer noopener"
            title="Xem video trên TikTok"
            href={url}
            className="text-xs text-slate-400 hover:text-white"
          >
            Đang tải video TikTok...
          </a>
        </section>
      </blockquote>
    </div>
  );
};
