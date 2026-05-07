"use client";

import { Refine } from "@refinedev/core";
import { dataProvider } from "@refinedev/supabase";
import { authProvider } from "./auth-provider";
import routerProvider from "@refinedev/nextjs-router/app";
import { supabaseClient } from "@/lib/supabaseClient";
import React from "react";

export const RefineContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <Refine
      dataProvider={dataProvider(supabaseClient)}
      authProvider={authProvider}
      routerProvider={routerProvider}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      {children}
    </Refine>
  );
};
