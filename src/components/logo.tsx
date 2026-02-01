import { cn } from "@/lib/utils";
import Image from "next/image";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/icons/icon-512x512.png"
        alt="F.Mecal Insp. Logo"
        width={64}
        height={64}
        className={cn("h-8 w-8 rounded-xl", className)}
      />
    </div>
  );
};

export default Logo;
