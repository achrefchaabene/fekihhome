import User from "../models/User.js";

export async function ensureAdminAccount() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Admin auto-create skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing");
    return;
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.name = ADMIN_NAME || existing.name || "FK Home Admin";
    existing.role = "admin";
    existing.password = ADMIN_PASSWORD;
    await existing.save();
    console.log("Admin account ready");
    return;
  }

  await User.create({
    name: ADMIN_NAME || "FK Home Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin"
  });
  console.log("Admin account created");
}
