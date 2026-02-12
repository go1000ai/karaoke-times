import { redirect } from "next/navigation";

export default function OwnerSignInPage() {
  redirect("/signin?role=owner");
}
