"use server";

import { redirect } from "next/navigation";
import { setAdminCookie, clearAdminCookie } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  const configured = process.env.ADMIN_PASSWORD;

  if (!configured || password !== configured) {
    redirect("/admin/login?error=1");
  }

  await setAdminCookie();
  redirect("/");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/");
}
