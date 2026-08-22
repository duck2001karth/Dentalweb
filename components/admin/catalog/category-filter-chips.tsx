"use client"

import React from "react"

interface CategoryFilterChipsProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
  itemsCountByCategory: Record<string, number>
}

export function CategoryFilterChips({
  categories,
  selectedCategory,
  onSelectCategory,
  itemsCountByCategory
}: CategoryFilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => onSelectCategory("ALL")}
        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
          selectedCategory === "ALL"
            ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20"
            : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <span>Todas</span>
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
          {Object.values(itemsCountByCategory).reduce((a, b) => a + b, 0)}
        </span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat
        const count = itemsCountByCategory[cat] || 0

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              isSelected
                ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{cat}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}