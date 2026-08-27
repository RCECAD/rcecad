"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UnsavedChangesContextValue = {
  requestNavigation: (navigate: () => void) => void;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export function UnsavedChangesProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const requestNavigation = useCallback(
    (navigate: () => void) => {
      if (!hasUnsavedChanges) {
        navigate();
        return;
      }

      setPendingNavigation(() => navigate);
    },
    [hasUnsavedChanges],
  );

  const discardChanges = useCallback(() => {
    const navigate = pendingNavigation;

    setHasUnsavedChanges(false);
    setPendingNavigation(null);
    navigate?.();
  }, [pendingNavigation]);

  const value = useMemo(
    () => ({ requestNavigation, setHasUnsavedChanges }),
    [requestNavigation],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <Dialog
        open={Boolean(pendingNavigation)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingNavigation(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Existem alterações não salvas. Se você sair agora, elas serão
              perdidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingNavigation(null)}
            >
              Continuar editando
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={discardChanges}
            >
              Descartar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used inside an UnsavedChangesProvider.",
    );
  }

  return context;
}

export function useOptionalUnsavedChanges(): UnsavedChangesContextValue | null {
  return useContext(UnsavedChangesContext);
}
