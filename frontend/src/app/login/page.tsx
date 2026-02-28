import LoginForm from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
            <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-void-accent/10 blur-[120px]" />

            <LoginForm />

            <p className="mt-8 text-sm text-void-muted">
                Don't have an account?{" "}
                <Link href="/register" className="text-void-accent hover:underline">
                    Join the Void
                </Link>
            </p>
        </div>
    );
}
