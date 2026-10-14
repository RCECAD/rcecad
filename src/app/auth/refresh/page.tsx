import { redirect } from "next/navigation";
import { hasAuthSession } from "@/api/server/session";
import { RefreshSession } from "./client";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!(await hasAuthSession())) redirect("/auth/login");
  const { next } = await searchParams;
  // Allow only known app routes; never navigate to a user-supplied origin.
  const returnTo =
    typeof next === "string" &&
    /^\/(?:home|project\/[a-zA-Z0-9-]+(?:\/[a-z-]+)?)$/.test(next)
      ? next
      : "/home";
  return <RefreshSession returnTo={returnTo} />;
}
