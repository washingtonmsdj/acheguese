// Type definitions for Deno environment
// This file provides type definitions for Deno APIs used in the project

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;

  // Signal handling
  export type Signal = "SIGINT" | "SIGTERM" | "SIGKILL" | "SIGHUP" | "SIGUSR1" | "SIGUSR2";
  
  export function addSignalListener(signal: Signal, handler: () => void): void;
  export function removeSignalListener(signal: Signal, handler: () => void): void;
  
  // Process control
  export function exit(code?: number): never;
  
  // HTTP server
  export interface ServeInit {
    port?: number;
    hostname?: string;
    onListen?: (params: { hostname: string; port: number }) => void;
  }
  
  export function serve(handler: (request: Request) => Response | Promise<Response>, options?: ServeInit): void;
}

// Declare the global Deno object
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  addSignalListener(signal: Deno.Signal, handler: () => void): void;
  removeSignalListener(signal: Deno.Signal, handler: () => void): void;
  exit(code?: number): never;
  serve?: (handler: (request: Request) => Response | Promise<Response>, options?: Deno.ServeInit) => void;
};

// Declare serve function from Deno std library
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>, options?: Deno.ServeInit): void;
}