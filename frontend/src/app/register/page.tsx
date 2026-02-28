import RegisterForm from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
            <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-void-purple/10 blur-[120px]" />

            <RegisterForm />

            <p className="mt-8 text-sm text-void-muted">
                Already part of the void?{" "}
                <Link href="/login" className="text-void-accent hover:underline">
                    Sign In
                </Link>
            </p>
        </div>
    );
}
