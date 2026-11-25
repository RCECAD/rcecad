"use client";

import { Info } from "lucide-react";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const HOVER_CLOSE_DELAY_MS = 150;

type FieldHintProps = {
  id: string;
  label: string;
  children: ReactNode;
};

export function FieldHint({ id, label, children }: FieldHintProps) {
  const [isOpen, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Touch keeps tap-to-toggle; only a mouse opens on hover.
  function openOnHover(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeOnLeave(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    closeTimer.current = window.setTimeout(
      () => setOpen(false),
      HOVER_CLOSE_DELAY_MS,
    );
  }

  return (
    <>
      {/* Popover content unmounts when closed; this copy keeps aria-describedby valid. */}
      <div id={id} className="sr-only">
        {children}
      </div>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Sobre ${label}`}
            className="text-muted-foreground hover:text-foreground"
            onPointerEnter={openOnHover}
            onPointerLeave={closeOnLeave}
            // Radix skips its toggle when prevented; a click after hover-open would otherwise close it.
            onClick={(event) => {
              if (isOpen) event.preventDefault();
            }}
          >
            <Info aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="gap-2 text-muted-foreground"
          // Hover must not pull focus away from the field being edited.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerEnter={openOnHover}
          onPointerLeave={closeOnLeave}
        >
          {children}
        </PopoverContent>
      </Popover>
    </>
  );
}
