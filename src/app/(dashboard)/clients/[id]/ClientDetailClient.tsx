'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, LogOut } from 'lucide-react'
import type { Client } from '@/types/database'
import { deleteClientAction, terminateClientAction } from '../actions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast, { type ToastType } from '@/components/ui/Toast'
import ClientForm from '@/components/clients/ClientForm'

interface Props {
  client: Client
}

export default function ClientDetailClient({ client }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteClientAction(client.id)
        router.push('/clients')
      } catch {
        setToast({ message: '삭제에 실패했습니다.', type: 'error' })
      }
    })
  }

  const handleTerminate = () => {
    startTransition(async () => {
      try {
        await terminateClientAction(client.id, terminationDate)
        router.push('/clients')
      } catch {
        setToast({ message: '해지 처리에 실패했습니다.', type: 'error' })
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
          <Pencil size={14} />
          수정
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowTerminate(true)}>
          <LogOut size={14} />
          해지
        </Button>
        <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 size={14} />
          삭제
        </Button>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="고객 수정" size="lg">
        <ClientForm
          client={client}
          onSuccess={() => {
            setShowEdit(false)
            setToast({ message: '고객 정보가 수정되었습니다.', type: 'success' })
            router.refresh()
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal isOpen={showTerminate} onClose={() => setShowTerminate(false)} title="고객 해지" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{client.company_name}</strong> 고객을 해지 처리하시겠습니까?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해지일</label>
            <input
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTerminate(false)}>취소</Button>
            <Button variant="danger" onClick={handleTerminate} disabled={isPending}>해지 처리</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="고객 삭제" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{client.company_name}</strong> 고객을 삭제하시겠습니까?
            <br />
            <span className="text-red-500 text-xs">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>취소</Button>
            <Button variant="danger" onClick={handleDelete} disabled={isPending}>삭제</Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}
