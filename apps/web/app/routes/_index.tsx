import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if onboarding was completed
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (onboardingCompleted) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 border-4 border-terracotta-200 border-t-terracotta-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}
