import { getSessionUser } from "@/lib/auth";

import { NavbarClient } from "@/components/navbar-client";

export async function Navbar() {
  const user = await getSessionUser();

  return <NavbarClient user={user} />;
}
