import fs from "fs";
import path from "path";
import Image from "next/image";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];

function getMediaFiles() {
  try {
    if (!fs.existsSync(MEDIA_DIR)) return [];
    return fs
      .readdirSync(MEDIA_DIR)
      .filter((f) => EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
      .map((f) => ({
        name: f,
        isVideo: /\.(mp4|webm)$/i.test(f),
        src: `/media/${f}`,
      }));
  } catch {
    return [];
  }
}

export default function Gallery() {
  const files = getMediaFiles();

  return (
    <section id="gallery" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-surface/20 to-bg" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-ember" />
            <span className="text-ember text-xs tracking-[0.3em] uppercase font-medium">Gallery</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-ember" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl">
            MOMENTS FROM THE <span className="fire-text">STREETS</span>
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-surface/30">
            <div className="text-text-muted mb-3">
              <svg className="w-12 h-12 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text-dim text-sm">No media yet</p>
            <p className="text-text-muted text-xs mt-2">
              Drop screenshots or videos into <code className="bg-surface px-2 py-0.5 rounded text-ember">public/media/</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.name}
                className="aspect-video rounded-lg overflow-hidden bg-surface border border-border group cursor-pointer relative"
              >
                {file.isVideo ? (
                  <video
                    src={file.src}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                ) : (
                  <Image
                    src={file.src}
                    alt={file.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
