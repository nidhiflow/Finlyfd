import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg-deep)] flex flex-col">
      <div className="max-w-md md:max-w-xl mx-auto w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
}
