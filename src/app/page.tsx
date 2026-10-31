import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";

export default async function HomePage() {
  const sesion = await obtenerSesion();
  if (sesion) {
    redirect("/inicio");
  }
  redirect("/login");
}
