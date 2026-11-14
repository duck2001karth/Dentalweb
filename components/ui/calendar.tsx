"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={props.locale || es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none w-full bg-card rounded-2xl relative", className)}
      classNames={{
        months: "w-full space-y-3",
        month: "space-y-3 w-full relative",

        // ENCABEZADO Y TÍTULO DEL MES
        month_caption: "flex justify-center items-center h-9 relative mb-2 w-full px-8",
        caption_label: "text-sm font-semibold text-foreground capitalize block text-center select-none",

        // FLECHAS DE NAVEGACIÓN VISIBLES A LOS LADOS
        nav: "flex items-center justify-between absolute top-0 inset-x-0 h-9 z-10 pointer-events-none px-0.5",
        button_previous: "h-7 w-7 rounded-xl border border-border/80 text-foreground pointer-events-auto cursor-pointer flex items-center justify-center bg-card shadow-2xs transition-all hover:bg-[var(--doctor-accent,#008bcd)]/10 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]",
        button_next: "h-7 w-7 rounded-xl border border-border/80 text-foreground pointer-events-auto cursor-pointer flex items-center justify-center bg-card shadow-2xs transition-all hover:bg-[var(--doctor-accent,#008bcd)]/10 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]",

        month_grid: "w-full border-collapse space-y-1 mt-1",
        weekdays: "flex justify-between w-full mb-1",
        weekday: "text-muted-foreground font-medium text-[11px] uppercase text-center w-9",
        week: "flex w-full justify-between mt-1",
        day: "p-0 text-center text-sm relative flex items-center justify-center",

        // DÍAS
        day_button: "h-9 w-9 p-0 font-medium text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center text-foreground hover:bg-primary/10 hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]",
        range_end: "day-range-end",

        // DÍA SELECCIONADO
        selected: "[&_.rdp-day_button]:!bg-primary [&_.rdp-day_button]:!text-primary-foreground dark:[&_.rdp-day_button]:!text-slate-950 [&>button]:!bg-primary [&>button]:!text-primary-foreground dark:[&>button]:!text-slate-950 [&>button]:!font-semibold [&>button]:!rounded-lg [&>button]:hover:!bg-primary/90 [&>button]:hover:!text-primary-foreground",
        today: "[&>button]:font-semibold [&>button]:text-primary [&>button]:underline [&>button]:underline-offset-4 aria-selected:[&>button]:!text-primary-foreground dark:aria-selected:[&>button]:!text-slate-950",
        outside: "[&>button]:text-muted-foreground/50 [&>button]:hover:text-foreground",
        disabled: "[&>button]:text-muted-foreground/30 [&>button]:cursor-not-allowed",
        range_middle: "aria-selected:bg-accent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          }
          return <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }