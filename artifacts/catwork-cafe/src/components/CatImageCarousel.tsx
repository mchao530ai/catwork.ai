import { useState, useEffect, useRef, useCallback } from "react";

interface CatImageCarouselProps {
  image: string;
  images?: string[];
  alt: string;
  className?: string;
  aspectClassName?: string;
  loading?: "lazy" | "eager";
}

export default function CatImageCarousel({
  image,
  images = [],
  alt,
  className = "w-full h-full object-cover",
  aspectClassName = "",
  loading = "lazy",
}: CatImageCarouselProps) {
  const allImages = [image, ...images.slice(0, 14)].filter(Boolean);
  const hasMultiple = allImages.length > 1;

  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allImages.length);
    }, 600);
  }, [allImages.length]);

  const stopCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (isHovered && hasMultiple) {
      startCycle();
    } else {
      stopCycle();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, hasMultiple, startCycle, stopCycle]);

  if (!hasMultiple) {
    return (
      <img
        src={image}
        alt={alt}
        loading={loading}
        className={`${className} group-hover:scale-105 transition-transform duration-700`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${aspectClassName}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {allImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
          loading={i === 0 ? loading : "lazy"}
          className={`absolute inset-0 ${className} transition-opacity duration-300 ${
            i === activeIndex ? "opacity-100" : "opacity-0"
          } ${!isHovered ? "group-hover:scale-105 transition-transform duration-700" : ""}`}
        />
      ))}

      {isHovered && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-10">
          {allImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Photo ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={`w-7 h-7 flex items-center justify-center transition-all duration-200 group`}
            >
              <span className={`block w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 group-hover:bg-white/75"
              }`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
