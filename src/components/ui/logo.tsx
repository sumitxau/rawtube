interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 24 }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-violet-500/25 shadow-[0_0_12px_rgba(168,85,247,0.22)] transition-all duration-300 group-hover:ring-violet-400/50 group-hover:shadow-[0_0_18px_rgba(168,85,247,0.4)] ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="RawTube"
        width={size}
        height={size}
        className="w-full h-full object-cover select-none mix-blend-screen"
      />
    </div>
  );
}
