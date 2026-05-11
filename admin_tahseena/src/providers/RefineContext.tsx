"use client";

import { Refine } from "@refinedev/core";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { authProvider } from "./auth-provider";
import routerProvider from "@refinedev/nextjs-router/app";
import { supabaseClient } from "@/lib/supabaseClient";
import React from "react";

const dataProviderInstance = dataProvider(supabaseClient);
const liveProviderInstance = liveProvider(supabaseClient);
const refineOptions = {
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  liveMode: "auto",
};

export const RefineContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <Refine
      dataProvider={dataProviderInstance}
      liveProvider={liveProviderInstance}
      authProvider={authProvider}
      routerProvider={routerProvider}
      options={refineOptions as any}
    >
      {children}
    </Refine>
  );
};
