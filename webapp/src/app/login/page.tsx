import { getConsultora } from "@/lib/consultora";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const consultora = await getConsultora();
  return <LoginForm nombre={consultora.nombre} logoUrl={consultora.logoUrl} />;
}
