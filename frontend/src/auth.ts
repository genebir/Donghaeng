import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const res = await fetch(`${API_URL}/api/v1/auth/oauth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: account.provider,
            subject: account.providerAccountId,
            // 카카오는 이메일 동의 없이 null일 수 있음 — synthetic 주소로 fallback
            email: user.email ?? `${account.provider}_${account.providerAccountId}@noemail.local`,
            name: user.name ?? account.providerAccountId,
            profile_image_url: user.image ?? null,
          }),
        });
        if (!res.ok) {
          throw new Error(`OAuth exchange failed: ${res.status}`);
        }
        const { data } = await res.json();
        token.accessToken = data.access_token;
        token.userId = data.user.id;
        token.userName = data.user.name;
        token.userImage = data.user.profile_image_url ?? user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.userId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
