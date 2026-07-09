"use client";

import * as React from "react";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface UserAuthFormProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({
  className,
  ...props
}: UserAuthFormProps) {

  const [isLoading, setIsLoading] =
    React.useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);

      await signIn("google", {
        callbackUrl:
          typeof window !== "undefined" &&
          // @ts-ignore
          window?.toDesktop
            ? "/desktopLogin"
            : "/",
      });

    } catch (error) {
      console.error("Error signing in:", error);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInAzure = async () => {
    try {
      setIsLoading(true);

      await signIn(
        "azure-ad",
        {
          callbackUrl: "/",
        },
        {
          prompt: "login",
        }
      );

    } catch (error) {
      console.error(
        "Error signing in with Azure:",
        error
      );

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("grid gap-6", className)}
      {...props}
    >
      <Button
        variant="outline"
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}

        Ingresar con Google
      </Button>

      {/*
      <Button
        variant="outline"
        type="button"
        onClick={handleSignInAzure}
        disabled={isLoading}
      >
        <Icons.microsoft className="mr-2 h-4 w-4" />
        Usar Hotmail
      </Button>
      */}
    </div>
  );
}