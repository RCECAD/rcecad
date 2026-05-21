"use client";
import { ChartNoAxesGantt } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Props {
  children: ReactNode | Array<ReactNode>;
}

export const NavbarMenu = ({ children }: Props) => {
  return (
    <div className="flex h-auto w-fit lg:gap-8">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant={"link"} size={"icon"} className="lg:hidden">
            <ChartNoAxesGantt />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-full px-10 pb-10">
          <DrawerHeader>
            <DrawerTitle>Navegação</DrawerTitle>
          </DrawerHeader>
          <div className={"flex flex-col gap-2"}>{children}</div>
        </DrawerContent>
      </Drawer>
      <div className="hidden lg:flex h-auto w-fit ">{children}</div>
    </div>
  );
};
