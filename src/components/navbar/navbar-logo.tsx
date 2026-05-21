import Image from "next/image";
import Link from "next/link";

export const NavbarLogo = () => {
  return (
    <div className="h-12 w-fit">
      <Link href={"/"} className="hover:cursor-pointer">
        <Image src="/rcecad-logo.png" alt="RCECAD" width={156} height={48} />
      </Link>
    </div>
  );
};
