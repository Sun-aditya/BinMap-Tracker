import AdminDashboard from "@/components/admin/admin-dashboard";

export const metadata = {
  title: "Admin | BinMap",
  description: "Review BinMap dustbin submissions and reports.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
