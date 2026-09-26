import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Copy, Check, Video, Maximize2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TikTokLogoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.48 6.34 6.34 0 0 0 1.86-4.48V8.71a8.16 8.16 0 0 0 4.71 1.48V6.74a4.85 4.85 0 0 1-.8-.05z" />
    </svg>
  );
}

interface TikTokEmbedPlayerProps {
  url: string;
  homestayName: string;
  authorName?: string;
  onOpenModal?: () => void;
  className?: string;
}

export default function TikTokEmbedPlayer({
  url,
  homestayName,
  authorName,
  onOpenModal,
  className = '',
}: TikTokEmbedPlayerProps) {
  const [copied, setCopied] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Normalize TikTok URL
  const cleanUrl = useMemo(() => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('@')) return `https://www.tiktok.com/${trimmed}`;
    return `https://${trimmed}`;
  }, [url]);

  // Extract TikTok video ID if present (e.g. /video/1234567890123456789)
  const videoId = useMemo(() => {
    if (!cleanUrl) return null;
    const match = cleanUrl.match(/\/video\/(\d+)/i) || cleanUrl.match(/\/v\/(\d+)/i);
    return match ? match[1] : null;
  }, [cleanUrl]);

  // Handle TikTok script embed for vt.tiktok.com shortlinks or profile/video embeds
  useEffect(() => {
    if (!cleanUrl) return;

    setEmbedLoaded(false);
    setEmbedError(false);

    // If direct video ID, we use standard TikTok iframe embed
    if (videoId) {
      setEmbedLoaded(true);
      return;
    }

    // Otherwise load TikTok official embed script
    const SCRIPT_ID = 'tiktok-embed-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const onScriptLoaded = () => {
      setEmbedLoaded(true);
      const win = window as unknown as { tiktokEmbed?: { load?: () => void } };
      win.tiktokEmbed?.load?.();
    };

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = onScriptLoaded;
      script.onerror = () => {
        setEmbedError(true);
        setEmbedLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      onScriptLoaded();
    }

    // Timeout safety
    const timer = setTimeout(() => {
      setEmbedLoaded(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [cleanUrl, videoId]);

  const handleCopyLink = () => {
    if (!cleanUrl) return;
    navigator.clipboard.writeText(cleanUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!cleanUrl) {
    return (
      <div className="p-4 rounded-md border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
        Chưa có liên kết video TikTok được gán cho chỗ nghỉ này.
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-sm transition-shadow ${className}`}
    >
      {/* Header thanh công cụ video */}
      <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-sm bg-black border border-slate-700 flex items-center justify-center text-[#25f4ee] shrink-0">
            <TikTokLogoIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">Video Review Trải Nghiệm</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-xs bg-[#fe2c55] text-white">
                TikTok
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {authorName ? `Bởi @${authorName} · ` : ''}Được đính kèm cho {homestayName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
              title="Phóng to video"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Toàn cảnh</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Sao chép link TikTok"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#fe2c55] hover:bg-[#e0264b] text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            <span>Mở TikTok</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Vùng Embed Player */}
      <div className="p-3 sm:p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[440px] relative">
        {videoId ? (
          /* Trực tiếp TikTok Iframe Embed khi có videoId */
          <div className="w-full max-w-[340px] h-[580px] rounded-md overflow-hidden bg-black shadow-lg border border-slate-800">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${videoId}`}
              title={`TikTok video review ${homestayName}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          /* TikTok Blockquote Embed cho link rút gọn / link profile / link custom */
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-[340px] flex justify-center">
              <blockquote
                className="tiktok-embed"
                cite={cleanUrl}
                data-video-id=""
                style={{ maxWidth: '340px', minWidth: '280px', width: '100%', margin: '0 auto' }}
              >
                <section>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Video review ${homestayName}`}
                    href={cleanUrl}
                    className="text-xs text-cyan-400 hover:underline block text-center py-2"
                  >
                    Đang kết nối video review trên TikTok...
                  </a>
                </section>
              </blockquote>
            </div>

            {/* Thẻ fallback trực quan nếu mạng chặn iframe hoặc embed đang tải */}
            {(!embedLoaded || embedError) && (
              <div className="mt-3 p-3.5 rounded-md bg-slate-900 border border-slate-800 text-center max-w-[340px] w-full text-slate-300">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center mb-2 text-[#25f4ee]">
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Video Review Đã Sẵn Sàng</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Bấm nút bên dưới để mở và xem video review trải nghiệm thực tế ngay trên TikTok:
                </p>
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#fe2c55] hover:bg-[#e0264b] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <TikTokLogoIcon className="w-3.5 h-3.5" />
                  <span>Xem video trên TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer ghi chú & CTA */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <AlertCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <span className="text-[11px]">
            Video review thực tế được gán trực tiếp từ kênh truyền thông của chỗ nghỉ
          </span>
        </div>

        {onOpenModal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenModal}
            className="text-[11px] h-7 font-bold rounded-md border-slate-300 hover:bg-slate-100 cursor-pointer self-end sm:self-auto"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Xem dạng Reels / Toàn màn hình
          </Button>
        )}
      </div>
    </div>
  );
}
