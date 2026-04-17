"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import InviteUserModal from "@/components/invite-user-modal"

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<{type: 'host' | 'opponent', index: number} | null>(null)

  const handleInvite = async (selectedUser: any, slot: string) => {
    console.log("Inviting user:", selectedUser, "to slot:", slot)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log("Invite sent successfully!")
  }

  const openModal = (type: 'host' | 'opponent', index: number) => {
    setActiveSlot({ type, index })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setActiveSlot(null)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Invite Modal Demo</h1>
          <p className="text-gray-400">Click the buttons below to open the invite modal</p>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={() => openModal('host', 1)} 
            size="lg" 
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Invite Host 1
          </Button>
          
          <Button 
            onClick={() => openModal('host', 2)} 
            size="lg" 
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Invite Host 2
          </Button>
          
          <Button 
            onClick={() => openModal('opponent', 1)} 
            size="lg" 
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Invite Opponent 1
          </Button>
          
          <Button 
            onClick={() => openModal('opponent', 2)} 
            size="lg" 
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Invite Opponent 2
          </Button>
        </div>
      </div>

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onInvite={handleInvite}
        activeSlot={activeSlot}
        roomId="demo-room-123"
        roomMode="team-vs-team"
      />
    </div>
  )
}