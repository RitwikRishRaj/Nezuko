"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Command as CommandPrimitive } from "cmdk"
import { Search, Check, ChevronsUpDown, X } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md",
      "bg-black text-gray-200",
      "border border-gray-800",
      "shadow-lg",
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <div className="overflow-hidden p-0 bg-transparent">
      <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-300 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </div>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-gray-800 px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg bg-black py-3 text-sm outline-none px-3",
        "placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
        "text-gray-200 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50",
        className,
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />)

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "data-[selected='true']:bg-gray-800 data-[selected=true]:text-white",
      "hover:bg-gray-800/80 hover:text-white",
      "text-gray-300",
      className,
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
}
CommandShortcut.displayName = "CommandShortcut"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-black p-0 text-gray-200 shadow-2xl outline-none",
        "border-gray-800",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

interface TagSelectorProps<T> {
  availableTags: T[]
  selectedTags: T[]
  onTagsChange: (tags: T[]) => void
  getValue?: (tag: T) => string
  getLabel?: (tag: T) => string
  placeholder?: string
  className?: string
  disabled?: boolean
}

function TagSelector<T extends { id: string; name: string }>({
  availableTags,
  selectedTags,
  onTagsChange,
  getValue = (tag: any) => tag.id,
  getLabel = (tag: any) => tag.name,
  placeholder = "Search tags...",
  className,
  disabled = false,
}: TagSelectorProps<T>) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  
  // Create a simple search index for tags
  const searchIndex = React.useMemo(() => {
    const index: Record<string, T> = {}
    
    availableTags.forEach(tag => {
      const value = getValue(tag)
      const label = getLabel(tag).toLowerCase()
      
      // Index by ID and label
      index[value.toLowerCase()] = tag
      if (value.toLowerCase() !== label) {
        index[label] = tag
      }
    })
    
    return index
  }, [availableTags, getValue, getLabel])
  
  // Create a set of selected tag IDs for quick lookup
  const selectedTagIds = React.useMemo(() => {
    return new Set(selectedTags.map(tag => getValue(tag)))
  }, [selectedTags, getValue])

  const colors = [
    "bg-blue-900 text-blue-100",
    "bg-purple-900 text-purple-100",
    "bg-pink-900 text-pink-100",
    "bg-green-900 text-green-100",
    "bg-yellow-900 text-yellow-100",
    "bg-red-900 text-red-100",
    "bg-indigo-900 text-indigo-100",
    "bg-cyan-900 text-cyan-100",
  ]

  // Filter tags based on search input and selected state
  const filteredTags = React.useMemo(() => {
    const searchTerm = inputValue.trim().toLowerCase()
    
    // If no search term, show all unselected tags
    if (!searchTerm) {
      return availableTags.filter(tag => !selectedTagIds.has(getValue(tag)))
    }
    
    // First, try to find exact matches
    const exactMatches = availableTags.filter(tag => {
      if (selectedTagIds.has(getValue(tag))) return false
      const tagId = getValue(tag).toLowerCase()
      const tagLabel = getLabel(tag).toLowerCase()
      return tagId === searchTerm || tagLabel === searchTerm
    })
    
    if (exactMatches.length > 0) {
      return exactMatches
    }
    
    // Then try partial matches
    const partialMatches = availableTags.filter(tag => {
      if (selectedTagIds.has(getValue(tag))) return false
      const tagId = getValue(tag).toLowerCase()
      const tagLabel = getLabel(tag).toLowerCase()
      return tagId.includes(searchTerm) || tagLabel.includes(searchTerm)
    })
    
    return partialMatches
  }, [availableTags, inputValue, selectedTagIds, searchIndex, getValue, getLabel])

  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current
    if (!input) return

    if (e.key === 'Backspace' && !input.value && selectedTags.length > 0) {
      onTagsChange(selectedTags.slice(0, -1))
    }
  }

  const handleRemove = (value: string) => {
    onTagsChange(selectedTags.filter((tag) => getValue(tag) !== value))
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex flex-wrap gap-2 mt-1 py-2 pl-2 pr-3 h-auto w-full text-left items-center justify-start min-h-9",
            "border border-input rounded-md bg-transparent",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            className
          )}
        >
          <AnimatePresence mode="popLayout">
            {selectedTags.map((tag, index) => (
              <motion.span
                key={getValue(tag)}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-1 py-1 text-sm font-medium break-words",
                  colors[index % colors.length],
                )}
              >
                <motion.span whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                  {getLabel(tag)}
                </motion.span>
                <motion.span
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer hover:opacity-70 p-0.5 rounded-full transition-opacity"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(getValue(tag))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation()
                      handleRemove(getValue(tag))
                    }
                  }}
                >
                  <X size={14} />
                </motion.span>
              </motion.span>
            ))}
          </AnimatePresence>
          <span className="flex-grow" />
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </motion.div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          <Command>
            <CommandInput
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={selectedTags.length === 0 ? placeholder : ""}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
            <CommandList>
              <CommandEmpty>
                {inputValue.trim() ? 'No matching tags found' : 'No available tags'}
              </CommandEmpty>
              <CommandGroup heading="Tags">
                <AnimatePresence>
                  {filteredTags.map((tag) => (
                    <motion.div
                      key={getValue(tag)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CommandItem 
                        key={`${getValue(tag)}-${getLabel(tag)}`}
                        value={`${getValue(tag)} ${getLabel(tag)}`}
                        onSelect={() => {
                          const tagToToggle = availableTags.find(t => getValue(t) === getValue(tag));
                          if (tagToToggle) {
                            const isSelected = selectedTags.some(t => getValue(t) === getValue(tag));
                            if (isSelected) {
                              onTagsChange(selectedTags.filter(t => getValue(t) !== getValue(tag)));
                            } else {
                              onTagsChange([...selectedTags, tagToToggle]);
                            }
                            setInputValue('');
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.some((selected) => getValue(selected) === getValue(tag))
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {getLabel(tag)}
                      </CommandItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CommandGroup>
            </CommandList>
          </Command>
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}

export {
  Button,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  TagSelector,
}
