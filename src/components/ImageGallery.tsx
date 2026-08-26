import { useState } from "react";
import { trackEvent } from "@/lib/tracking";

const PLACEHOLDER = "/placeholder.svg";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  year: string;
  price: string;
}

const ImageGallery = ({ images, alt, year, price }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safeImages = images?.length > 0 ? images : [PLACEHOLDER];

  const goTo = (dir: -1 | 1) => {
    setActiveIndex((prev) => (prev + dir + safeImages.length) % safeImages.length);
  };

  const openLightbox = () => {
    setLightboxOpen(true);
    void trackEvent("gallery_open");
  };

  return (
    <>
      <div>
        <div
          className="relative aspect-[16/10] rounded-lg overflow-hidden group cursor-pointer"
          onClick={openLightbox}
        >

          <img
            src={safeImages[activeIndex]}
            alt={alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-on-surface/70 text-surface text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-pill backdrop-blur-sm">
              {year}
            </span>
          </div>
          <div className="absolute bottom-4 right-4">
            <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-black text-lg px-4 py-2 rounded-pill">
              R$ {price}
            </span>
          </div>
          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">chevron_left</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {safeImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden transition-all ${
                  i === activeIndex ? "ring-2 ring-primary opacity-100" : "opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container-lowest/80 flex items-center justify-center z-10"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface-container-lowest/80 flex items-center justify-center z-10"
              >
                <span className="material-symbols-outlined text-on-surface text-2xl">chevron_left</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface-container-lowest/80 flex items-center justify-center z-10"
              >
                <span className="material-symbols-outlined text-on-surface text-2xl">chevron_right</span>
              </button>
            </>
          )}

          <img
            src={safeImages[activeIndex]}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-container-lowest/80 backdrop-blur-sm px-4 py-2 rounded-pill text-on-surface text-sm font-medium">
            {activeIndex + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
