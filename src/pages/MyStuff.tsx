import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";

export default function MyStuff() {
  const { role } = useRole();

  if (role === "publisher") {
    return <Navigate to="/my-channels" replace />;
  }

  return <Navigate to="/my-briefs" replace />;
}
