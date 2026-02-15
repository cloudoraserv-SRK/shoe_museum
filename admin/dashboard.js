import { supabase } from "./supabaseClient.js";

const ADMIN_EMAIL = "shoemuseumonline@gmail.com";

supabase.auth.onAuthStateChange((event, session) => {
  if (!session?.user) {
    location.href = "login.html";
    return;
  }

  if (session.user.email !== ADMIN_EMAIL) {
    supabase.auth.signOut();
    location.href = "login.html";
    return;
  }

  // ✅ user authenticated → load dashboard
  console.log("Admin logged in:", session.user.email);
});
