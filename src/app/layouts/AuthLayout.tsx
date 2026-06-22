import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
}
