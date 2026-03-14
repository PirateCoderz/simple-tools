"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { store } from "@/store/store";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </Provider>
    );
}
