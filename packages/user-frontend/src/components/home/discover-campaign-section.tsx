import Image from "next/image";
import Link from "next/link";

interface DiscoverCampaignSectionProps {
  imageSrc?: string;
  brandTitle?: string;
  tagline?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export function DiscoverCampaignSection({
  imageSrc = "/images/discover.webp",
  brandTitle = "VENDOR VOGUE",
  tagline = "An Eternal Perspective.",
  buttonText = "DISCOVER",
  buttonHref = "/catalog",
  className,
}: DiscoverCampaignSectionProps) {
  return (
    <section
      aria-label="Discover Campaign"
      className={`relative w-full overflow-hidden select-none bg-black h-[420px] sm:h-[520px] md:h-[640px] lg:h-[760px] xl:h-[840px] ${
        className || ""
      }`}
    >
      {/* Background Campaign Visual using discover.webp */}
      <Image
        src={imageSrc}
        alt={`${brandTitle} - ${tagline}`}
        fill
        sizes="(max-width: 768px) 100vw, 100vw"
        quality={75}
        className="object-cover object-center transform-gpu"
      />

      {/* Editorial Content Layer */}
      <div className="relative z-10 w-full h-full max-w-[1720px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-between py-10 sm:py-14 md:py-18 lg:py-20">
        {/* Top Spacer for balanced vertical symmetry */}
        <div className="h-4 sm:h-8" aria-hidden="true" />

        {/* Middle Row: Brand Wordmark (Left) & Poetic Tagline (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-12 w-full my-auto">
          {/* Left: Brand Title */}
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium uppercase tracking-[0.25em] text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
              {brandTitle}
            </h2>
          </div>

          {/* Right: Editorial Tagline */}
          <div className="text-left md:text-right">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-white tracking-wide font-normal leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
              {tagline}
            </p>
          </div>
        </div>

        {/* Bottom Center: Editorial CTA Button */}
        <div className="flex justify-center w-full pt-6 sm:pt-8">
          <Link
            href={buttonHref}
            className="group inline-flex items-center gap-2.5 px-8 sm:px-11 py-3 sm:py-3.5 rounded-full bg-white text-black hover:bg-black hover:text-white border border-white text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95"
          >
            <span>{buttonText}</span>
            <span className="text-sm font-light transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
