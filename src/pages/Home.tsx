import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";

export default function Home() {
  const { role } = useRole();

  if (role === "publisher") {
    return <Navigate to="/briefs" replace />;
  }

  return <Navigate to="/listings" replace />;
}
