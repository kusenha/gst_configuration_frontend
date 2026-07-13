import Image from "next/image";

export function GstLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-black shadow-sm ${className}`}
      aria-label="Geological Survey of Tanzania"
    >
      <Image src="/logo/gst.png" alt="Geological Survey of Tanzania" fill sizes="48px" className="object-cover" />
    </div>
  );
}
