import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Choose a new password — Immo Tunisia" };

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
