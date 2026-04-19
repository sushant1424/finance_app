import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/AuthContext";
import { Wallet } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirm_password: z.string().min(6),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authRegister(data);
      if (res.success) {
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary">
          <Wallet className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-800">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="mt-1">
                <Input id="name" type="text" {...register("name")} />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="mt-1">
                <Input id="confirm_password" type="password" {...register("confirm_password")} />
                {errors.confirm_password && <p className="mt-1 text-sm text-destructive">{errors.confirm_password.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
