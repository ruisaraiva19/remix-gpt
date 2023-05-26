/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

declare module "@remix-run/server-runtime" {
  interface AppLoadContext {
    OPENAI_API_KEY: string;
  }

  export interface DataFunctionArgs {
    request: Request;
    context: AppLoadContext;
    params: Params;
  }
}
