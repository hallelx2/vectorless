import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export const metadata = {
  title: "Sign In | Vectorless",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Vectorless account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
        <SocialLoginButtons />
      </CardContent>
    </Card>
  );
}
