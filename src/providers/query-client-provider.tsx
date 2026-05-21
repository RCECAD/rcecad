"use client";

import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from "@tanstack/react-query";
import * as React from "react";

type QueryClientProviderProps = {
  children: React.ReactNode;
};

export const QueryClientProvider = ({
  children,
}: QueryClientProviderProps): React.JSX.Element => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
};
