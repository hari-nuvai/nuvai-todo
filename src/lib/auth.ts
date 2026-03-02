import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "zoho",
      name: "Zoho",
      type: "oidc",
      issuer: "https://accounts.zoho.in",
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.zoho.in/oauth/v2/auth",
        params: { scope: "openid email profile" },
      },
      token: "https://accounts.zoho.in/oauth/v2/token",
      userinfo: "https://accounts.zoho.in/oauth/user/info",
      profile(profile) {
        return {
          id: profile.ZUID ?? profile.sub,
          name: profile.Display_Name ?? profile.name,
          email: profile.Email ?? profile.email,
        };
      },
    },
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ request, auth: session }) {
      const { pathname } = request.nextUrl;

      // Auth routes are always accessible
      if (pathname.startsWith("/api/auth") || pathname.startsWith("/auth")) {
        return true;
      }

      // API routes: allow if valid API key OR session
      if (pathname.startsWith("/api")) {
        const authHeader = request.headers.get("authorization");
        if (authHeader) {
          const token = authHeader.replace(/^Bearer\s+/i, "");
          if (token === process.env.MCP_API_KEY) {
            return true;
          }
        }
        // No API key — require session
        return !!session;
      }

      // All other routes require session
      return !!session;
    },
  },
});
