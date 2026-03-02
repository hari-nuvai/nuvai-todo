"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to NuvaiTodo</CardTitle>
          <CardDescription>
            Use your Zoho account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => signIn("zoho", { callbackUrl: "/" })}
          >
            Sign in with Zoho
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
