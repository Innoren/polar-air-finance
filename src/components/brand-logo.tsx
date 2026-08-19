import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
};

export function BrandLogo({ className, imgClassName }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/logo.png"
        alt="Polar Air Heating & Cooling LLC"
        className={cn("h-12 w-auto max-w-full object-contain", imgClassName)}
      />
    </div>
  );
}
