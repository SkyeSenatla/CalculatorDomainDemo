"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="p-4 bg-gray-900 text-white flex items-center justify-between">
      <Link href="/" className="font-bold text-lg hover:text-gray-300 transition-colors">
        Sentinel Calculator
      </Link>
      <div className="flex gap-4 items-center">
        {isAuthenticated ? (
          <>
            <Link href="/my-calculations" className="hover:text-gray-300 transition-colors">
              My Calculations
            </Link>
            <span className="text-gray-400 text-sm">Hi, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-gray-300 transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
