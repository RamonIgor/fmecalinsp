import { cn } from "@/lib/utils";
import Image from "next/image";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/icons/icon-192x192.png"
        alt="F.Mecal Insp. Logo"
        width={32}
        height={32}
        className={cn("h-8 w-8", className)}
      />
    </div>
  );
};

export default Logo;
