"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Search, UserPlus, Loader2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { useApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (selectedUser: any, slot: string) => Promise<void>
  activeSlot?: { type: 'host' | 'opponent', index: number } | null
  roomId?: string
  roomMode?: string
}

const getRankColor = (rank: string) => {
  const colors: Record<string, string> = {
    Newbie: "text-gray-400",
    Pupil: "text-green-400",
    Specialist: "text-cyan-400",
    Expert: "text-blue-400",
    "Candidate Master": "text-violet-400",
    Master: "text-orange-400",
    "International Master": "text-orange-300",
    Grandmaster: "text-red-400",
    "International Grandmaster": "text-red-300",
    "Legendary Grandmaster": "text-red-500",
  }
  return colors[rank] || "text-gray-400"
}

export default function InviteUserModal({ 
  isOpen, 
  onClose, 
  onInvite, 
  activeSlot
}: InviteUserModalProps) {
  const { user } = useUser()
  const apiClient = useApiClient()
  
  const [handle, setHandle] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  // Debounce timer ref and search cache
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchCacheRef = useRef<Map<string, any[]>>(new Map<string, any[]>())

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setHandle("")
      setSearchResults([])
      setIsSearching(false)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim().toLowerCase()
      
      if (!trimmedQuery || trimmedQuery.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      
      // Check cache first
      if (searchCacheRef.current.has(trimmedQuery)) {
        console.log('Using cached search results for:', trimmedQuery)
        const cachedResults = searchCacheRef.current.get(trimmedQuery) || []
        // Filter out current user from cached results too
        const filteredCachedResults = cachedResults.filter((searchUser: any) => searchUser.clerk_id !== user?.id)
        setSearchResults(filteredCachedResults)
        setIsSearching(false)
        return
      }
      
      setIsSearching(true)
      
      try {
        console.log('Searching for handle:', query.trim())
        
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER.SEARCH, { handle: query.trim() })
        console.log('Response status:', response.status, response.statusText)
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          toast.warning('Search rate limited', {
            description: 'Please wait a moment before searching again.',
            duration: 3000,
          })
          setSearchResults([])
          return
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          
          // Handle rate limiting in text response
          if (text.includes('Too many requests')) {
            toast.warning('Search rate limited', {
              description: 'Please wait a moment before searching again.',
              duration: 3000,
            })
          } else {
            toast.error('Server returned invalid response')
          }
          setSearchResults([])
          return
        }
        
        const data = await response.json()
        console.log('Search response:', { status: response.status, data })
        
        if (response.ok) {
          console.log('Found users:', data.users)
          const users = data.users || []
          
          // Filter out current user from search results
          const filteredUsers = users.filter((searchUser: any) => searchUser.clerk_id !== user?.id)
          
          // Cache the results (limit cache size to 50 entries)
          if (searchCacheRef.current.size >= 50) {
            const firstKey = searchCacheRef.current.keys().next().value
            if (firstKey !== undefined) {
              searchCacheRef.current.delete(firstKey)
            }
          }
          searchCacheRef.current.set(trimmedQuery, filteredUsers)
          
          setSearchResults(filteredUsers)
          if (filteredUsers.length === 0) {
            toast.info('No users found with that handle')
          }
        } else {
          console.error('Search failed:', { status: response.status, error: data.error, details: data.details })
          toast.error(data.error || `Failed to search users (${response.status})`)
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        toast.error(`Error searching users: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [apiClient, user?.id]
  )

  // Search users by Codeforces handle with debounce
  const handleSearch = useCallback(
    (query: string) => {
      setHandle(query)
      
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      // If query is empty or too short, clear results immediately
      if (!query.trim() || query.trim().length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      
      // Set loading state immediately for better UX
      setIsSearching(true)
      
      // Debounce the actual search by 800ms
      searchTimeoutRef.current = setTimeout(() => {
        debouncedSearch(query)
      }, 800)
    },
    [debouncedSearch]
  )

  const handleManualSearch = async () => {
    if (!handle.trim()) return
    await debouncedSearch(handle)
  }

  const handleInviteUser = async (selectedUser: any) => {
    if (!activeSlot) return
    
    try {
      // Prevent inviting yourself
      if (selectedUser.clerk_id === user?.id) {
        toast.error('You cannot invite yourself')
        return
      }

      const slot = `${activeSlot.type}${activeSlot.index}`
      await onInvite(selectedUser, slot)
      
      // Close modal and reset state
      onClose()
      setHandle("")
      setSearchResults([])
      
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invite')
    }
  }

  if (!isOpen || !activeSlot) return null

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && activeSlot && (
          <motion.div 
            key={`invite-modal-${activeSlot.type}-${activeSlot.index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md mx-auto bg-black rounded-2xl border border-white/20 shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h2 className="text-lg font-medium text-white">
                  Invite {activeSlot.type === 'host' ? `Host ${activeSlot.index}` : `Opponent ${activeSlot.index}`}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search Codeforces handle..."
                    value={handle}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    className="w-full pl-10 pr-20 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                    style={{ backgroundColor: '#000000' }}
                    autoFocus
                  />
                  <button
                    onClick={handleManualSearch}
                    disabled={isSearching || !handle.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>

                {/* Search Results */}
                <div className="min-h-[200px] max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <motion.div
                          key={result.clerk_id || result.id || `search-result-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                          style={{ backgroundColor: '#000000' }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${result.codeforces_handle}&background=000000&color=ffffff&size=32`}
                              alt={result.codeforces_handle}
                              className="w-8 h-8 rounded-full ring-1 ring-white/20"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate text-sm">
                                {result.codeforces_handle}
                              </p>
                            </div>
                            <button
                              onClick={() => handleInviteUser(result)}
                              className="px-3 py-1.5 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              Invite
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : !isSearching && handle.trim().length >= 2 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                      <Search className="w-8 h-8 mb-3 text-white/30" />
                      <p className="text-sm">No users found</p>
                      <p className="text-xs text-white/30 mt-1">Try a different handle</p>
                    </div>
                  ) : !isSearching ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                      <UserPlus className="w-8 h-8 mb-3 text-white/30" />
                      <p className="text-sm">Enter a Codeforces handle to search</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                      <p className="text-sm text-white/60">Searching...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}