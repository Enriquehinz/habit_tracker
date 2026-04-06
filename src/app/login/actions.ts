"use server";

import { redirect } from "next/navigation";

import { isAllowedEmail } from "@/lib/auth/session";
import { getAuthServer } from "@/lib/auth/server";

export type LoginActionState = {
  error: string | null;
  message: string | null;
};

export async function submitLogin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const auth = getAuthServer();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "signin");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
      message: null,
    };
  }

  if (!isAllowedEmail(email)) {
    return {
      error: "This email is not allowed to access the app.",
      message: null,
    };
  }

  if (password.length < 8) {
    return {
      error: "Use a password with at least 8 characters.",
      message: null,
    };
  }

  if (mode === "signup") {
    const { error } = await auth.signUp.email({
      email,
      name: email.split("@")[0],
      password,
    });

    if (error) {
      return {
        error: error.message || "Unable to create the account.",
        message: null,
      };
    }

    redirect("/dashboard");
  }

  const { error } = await auth.signIn.email({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message || "Unable to sign in.",
      message: null,
    };
  }

  redirect("/dashboard");
}
