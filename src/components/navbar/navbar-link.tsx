import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  label: string;
  href: string;
  variant: "default" | "outline" | "link";
  className?: string;
}

export const NavbarLink = ({ label, href, variant, className }: Props) => {
  return (
    <Link href={href}>
      <Button variant={variant} className={className}>
        {label}
      </Button>
    </Link>
  );
};
