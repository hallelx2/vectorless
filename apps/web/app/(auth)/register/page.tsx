import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export const metadata = {
  title: "Create Account | Vectorless",
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">
          Create your account
        </CardTitle>
        <CardDescription>
          Get started with Vectorless in seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegisterForm />
        <SocialLoginButtons />
      </CardContent>
    </Card>
  );
}
