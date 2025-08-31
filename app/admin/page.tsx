import AdminGuard from "@/components/admin/admin-guard"
import { DisputesManager } from "@/components/admin/disputes-manager"

const AdminPage = () => {
  return (
    <AdminGuard>
      <div>
        {/* ... existing code here ... */}
        <section className="mt-8">
          <DisputesManager />
        </section>
        {/* ... existing code here ... */}
      </div>
    </AdminGuard>
  )
}

export default AdminPage
