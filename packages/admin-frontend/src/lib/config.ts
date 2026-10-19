export const CONFIG = {
  // Public URL used by browser-side fetch calls
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
  // Internal URL used by Next.js Server Components / SSR
  API_INTERNAL_URL:
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000",
  // Cookie names
  TOKEN_COOKIE_NAME: "vv_admin_access_token",
  USER_COOKIE_NAME: "vv_admin_user",
};
