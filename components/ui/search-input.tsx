"use client"

import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type SearchInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "className" | "type"
> & {
  className?: string
  inputClassName?: string
  clearLabel?: string
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      inputClassName,
      value,
      disabled,
      clearLabel = "Clear search",
      onClear,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const hasValue = value !== undefined && String(value).length > 0
    const showClearButton = Boolean(onClear && hasValue && !disabled)

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node

        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const handleClear = () => {
      onClear?.()
      requestAnimationFrame(() => inputRef.current?.focus())
    }

    return (
      <InputGroup className={className}>
        <InputGroupInput
          ref={setInputRef}
          type="search"
          value={value}
          disabled={disabled}
          className={cn(
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden",
            inputClassName
          )}
          {...props}
        />
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        {showClearButton ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handleClear}
              aria-label={clearLabel}
              title={clearLabel}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
