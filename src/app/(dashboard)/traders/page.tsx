import Header from '@/components/layout/Header'
import InventorySheet from '@/components/traders/InventorySheet'
import { listTraderClients, listAllTraderInventory } from '@/lib/db/traders'

export default async function TradersPage() {
  const [clients, inventory] = await Promise.all([
    listTraderClients(),
    listAllTraderInventory(),
  ])

  return (
    <div className="space-y-4">
      <Header
        title="매매사업자 물건 목록"
        subtitle={`총 ${inventory.length}건`}
      />
      <InventorySheet initialData={inventory} clients={clients} />
    </div>
  )
}
