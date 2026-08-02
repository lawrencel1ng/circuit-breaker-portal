// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    
    interface Locals {
      user: {
        id: string;
        username: string;
        email: string;
        roles: import('./lib/server/auth/rbac').Role[];
      } | null;
      session: {
        id: string;
        roles: import('./lib/server/auth/rbac').Role[];
      } | null;
      ipAddress: string;
    }
    
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
