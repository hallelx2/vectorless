"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Sparkles, Building2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PlanCard {
  key: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: PlanCard[] = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring Vectorless and building prototypes.",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { label: "500 queries / month", included: true },
      { label: "500 pages ingested / month", included: true },
      { label: "25 documents stored", included: true },
      { label: "100 MB storage", included: true },
      { label: "20 queries / min rate limit", included: true },
      { label: "Community support", included: true },
      { label: "MCP server access", included: true },
    ],
    cta: "Current Plan",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    period: "/ month",
    description:
      "For teams and individuals using Vectorless in production.",
    icon: <CreditCard className="h-5 w-5" />,
    popular: true,
    features: [
      { label: "20,000 queries / month", included: true },
      { label: "10,000 pages ingested / month", included: true },
      { label: "500 documents stored", included: true },
      { label: "10 GB storage", included: true },
      { label: "200 queries / min rate limit", included: true },
      { label: "Priority email support", included: true },
      { label: "OAuth app integrations", included: true },
    ],
    cta: "Upgrade to Pro",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description:
      "For organizations with custom requirements, SLAs, and dedicated support.",
    icon: <Building2 className="h-5 w-5" />,
    features: [
      { label: "Unlimited queries", included: true },
      { label: "Unlimited ingestion", included: true },
      { label: "Unlimited documents", included: true },
      { label: "Unlimited storage", included: true },
      { label: "1,000 queries / min rate limit", included: true },
      { label: "Dedicated support + SLA", included: true },
      { label: "Custom integrations", included: true },
    ],
    cta: "Contact Sales",
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const [currentPlan] = useState("free"); // TODO: Fetch from API

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Billing & Plans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and view your current plan details.
        </p>
      </div>

      {/* Current Plan Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <span className="font-semibold text-foreground capitalize">
                  {currentPlan}
                </span>{" "}
                plan.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="text-sm font-medium capitalize"
            >
              {currentPlan}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlan;

          return (
            <Card
              key={plan.key}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-md"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {plan.icon}
                </div>
                <CardTitle className="font-display text-xl">
                  {plan.name}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold font-data">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={
                    isCurrent
                      ? "outline"
                      : plan.popular
                        ? "default"
                        : "outline"
                  }
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground">
            Questions about billing?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All plans include access to the MCP server, REST API, and TypeScript
            SDK. Upgrading takes effect immediately and your quota resets at the
            start of each billing period. Enterprise plans include custom SLAs
            and dedicated onboarding.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact us at{" "}
            <a
              href="mailto:support@vectorless.store"
              className="text-primary underline underline-offset-2"
            >
              support@vectorless.store
            </a>{" "}
            for enterprise inquiries or billing questions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
