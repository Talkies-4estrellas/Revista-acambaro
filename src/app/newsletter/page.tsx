import { redirect } from "next/navigation";

/** «/newsletter» es la dirección que la gente escribe para suscribirse: lleva a la página de suscripción. */
export default function Newsletter() {
  redirect("/suscribirse");
}
