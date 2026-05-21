"use client";

import type { Table } from "@tanstack/react-table";
import { createContext, useContext } from "react";

type DataLayerContextValue = {
  // biome-ignore lint/suspicious/noExplicitAny: <needs to be any>
  table: Table<any>;
};

export const DataLayerContext = createContext<DataLayerContextValue | null>(
  null,
);

export function useDataLayer<TData>() {
  const context = useContext(DataLayerContext);

  if (!context) {
    throw new Error("useDataLayer must be used inside DataLayer");
  }

  return context as {
    table: Table<TData>;
  };
}
