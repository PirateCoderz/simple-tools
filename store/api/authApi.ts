import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

interface SignUpResponse {
    message: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api/auth" }),
    endpoints: (builder) => ({
        signUp: builder.mutation<SignUpResponse, SignUpRequest>({
            query: (body) => ({
                url: "/signup",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const { useSignUpMutation } = authApi;
