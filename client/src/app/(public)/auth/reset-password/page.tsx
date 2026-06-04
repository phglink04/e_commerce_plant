import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export const metadata = {
  title: "Reset Password - PlantWorld",
  description: "Reset your PlantWorld account password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center text-slate-500">Đang tải biểu mẫu...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
