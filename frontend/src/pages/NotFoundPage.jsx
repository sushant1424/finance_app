import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
      <h1 className="text-7xl font-extrabold text-primary">404</h1>
      <h2 className="text-2xl font-medium text-slate-700 dark:text-slate-300">Page Not Found</h2>
      <p className="text-slate-500">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="pt-4">
        <Button size="lg">Go back home</Button>
      </Link>
    </div>
  );
}
