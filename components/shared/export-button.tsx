"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToJSON } from "@/lib/export-utils"

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  filename?: string
  label?: string
}

export default function ExportButton<T extends Record<string, any>>({
  data,
  filename = "export",
  label = "Export",
}: ExportButtonProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportToCSV(data, `${filename}.csv`)}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, `${filename}.json`)}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
