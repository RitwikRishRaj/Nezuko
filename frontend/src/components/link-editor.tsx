"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LinkEditorProps {
  enabled: boolean;
  onChange?: (links: string[]) => void;
}

export default function LinkEditor({ enabled, onChange }: LinkEditorProps) {
  const [links, setLinks] = useState<string[]>([""])

  const handleChange = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    setLinks(newLinks)
    onChange?.(newLinks)
  }

  const handleAddLine = () => {
    const newLinks = [...links, ""]
    setLinks(newLinks)
    onChange?.(newLinks)
  }

  const handleRemoveLine = (index: number) => {
    if (links.length > 1) {
      const newLinks = links.filter((_, i) => i !== index)
      setLinks(newLinks)
      onChange?.(newLinks)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLine()
    }
  }

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">

      {/* Editor */}
      <div className="divide-y divide-white/10">
        <AnimatePresence mode="popLayout">
          {links.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center hover:bg-white/5 transition-colors"
            >
              {/* Line Number */}
              <div className="w-12 flex-shrink-0 px-3 py-3 bg-black/20 text-right border-r border-white/10">
                <span className="text-xs font-mono text-white/70">{index + 1}</span>
              </div>

              {/* Input */}
              <input
                type="text"
                value={link}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => enabled && handleKeyDown(e, index)}
                placeholder={enabled ? "https://codeforces.com/problemset/problem/1234/A" : "Enable to edit"}
                disabled={!enabled}
                className={`flex-1 px-4 py-3 bg-transparent border-0 outline-none font-mono text-sm ${
                  enabled ? 'text-white/90 placeholder-white/40 focus:bg-white/5' : 'text-white/50 placeholder-white/20'
                } transition-colors`}
              />

              {links.length > 1 && (
                <motion.button
                  onClick={() => handleRemoveLine(index)}
                  whileHover={{ scale: 1.1, color: 'white' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 text-white/60 hover:text-white transition-colors flex-shrink-0 text-lg font-mono"
                  aria-label="Remove line"
                >
                  ×
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between">
        <span className="text-xs font-mono text-white/70">
          {links.length} line{links.length !== 1 ? "s" : ""}
        </span>
        <motion.button
          onClick={handleAddLine}
          disabled={!enabled}
          whileHover={{ scale: enabled ? 1.05 : 1 }}
          whileTap={{ scale: enabled ? 0.95 : 1 }}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border ${
            enabled 
              ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white/90' 
              : 'border-white/10 bg-white/5 text-white/40 cursor-not-allowed'
          } transition-all shadow-lg shadow-blue-500/10`}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={!enabled ? 'opacity-50' : ''}
          >
            <path d="M4.49858 18.7493C4.49858 18.0593 3.93925 17.5 3.24929 17.5C2.55933 17.5 2 18.0593 2 18.7493C2 19.4393 2.55933 19.9986 3.24929 19.9986C3.93925 19.9986 4.49858 19.4393 4.49858 18.7493ZM12.019 18H6.75L6.64823 18.0068C6.28215 18.0565 6 18.3703 6 18.75C6 19.1642 6.33579 19.5 6.75 19.5H12.3137C12.1591 19.0218 12.0585 18.5195 12.019 18ZM13.8091 13H6.75C6.33579 13 6 12.6642 6 12.25C6 11.8703 6.28215 11.5565 6.64823 11.5068L6.75 11.5H15.9944C15.1647 11.8469 14.4222 12.3609 13.8091 13ZM4.49858 12.2493C4.49858 11.5593 3.93925 11 3.24929 11C2.55933 11 2 11.5593 2 12.2493C2 12.9393 2.55933 13.4986 3.24929 13.4986C3.93925 13.4986 4.49858 12.9393 4.49858 12.2493ZM4.49858 5.74929C4.49858 5.05933 3.93925 4.5 3.24929 4.5C2.55933 4.5 2 5.05933 2 5.74929C2 6.43925 2.55933 6.99858 3.24929 6.99858C3.93925 6.99858 4.49858 6.43925 4.49858 5.74929ZM21.25 5H6.75L6.64823 5.00685C6.28215 5.05651 6 5.3703 6 5.75C6 6.16421 6.33579 6.5 6.75 6.5H21.25L21.3518 6.49315C21.7178 6.44349 22 6.1297 22 5.75C22 5.33579 21.6642 5 21.25 5ZM24 17.4995C24 14.4619 21.5376 11.9995 18.5 11.9995C15.4624 11.9995 13 14.4619 13 17.4995C13 20.5371 15.4624 22.9995 18.5 22.9995C21.5376 22.9995 24 20.5371 24 17.4995ZM19.0006 17.9995L19.0011 20.503C19.0011 20.7792 18.7773 21.003 18.5011 21.003C18.225 21.003 18.0011 20.7792 18.0011 20.503L18.0006 17.9995H15.4956C15.2197 17.9995 14.9961 17.7757 14.9961 17.4995C14.9961 17.2234 15.2197 16.9995 15.4956 16.9995H18.0005L18 14.4988C18 14.2226 18.2239 13.9988 18.5 13.9988C18.7761 13.9988 19 14.2226 19 14.4988L19.0005 16.9995H21.4966C21.7725 16.9995 21.9961 17.2234 21.9961 17.4995C21.9961 17.7757 21.7725 17.9995 21.4966 17.9995H19.0006Z" fill="currentColor"/>
          </svg>
          <span className={`${enabled ? 'bg-gradient-to-r from-blue-300 to-purple-300' : 'text-current'} bg-clip-text text-transparent`}>
            Add Line
          </span>
        </motion.button>
      </div>
    </div>
  )
}
