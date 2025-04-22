// app/api/auth/[...nextauth]/route.ts
import NextAuth, { DefaultSession, SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import prisma from "@/prisma/PrismaClient";
import { Session } from "inspector/promises";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
    } & DefaultSession["user"];
  }
}

export const authOptions ={
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        
        const passwordMatch = await bcrypt.compare(
          credentials.password, 
          user.password
        );
        
        if (!passwordMatch) return null;
        
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name
        };
      }
    }),
    // Add other providers like Google, GitHub, etc.
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id);
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,

};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };