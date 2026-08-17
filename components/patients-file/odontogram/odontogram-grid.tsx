"use client"
import React from "react"
import { ToothPiece } from "./odontooth-piece"

export function OdontogramGrid({ 
  dentition, 
  getRecordsForTooth, 
  selectedTooth, 
  currentSurfaces, 
  handleSurfaceClick, 
  canEdit 
}: any) {
  const arcada1 = [18, 17, 16, 15, 14, 13, 12, 11]; const arcada2 = [21, 22, 23, 24, 25, 26, 27, 28]
  const arcada4 = [48, 47, 46, 45, 44, 43, 42, 41]; const arcada3 = [31, 32, 33, 34, 35, 36, 37, 38]
  const arcadaTemp1 = [55, 54, 53, 52, 51]; const arcadaTemp2 = [61, 62, 63, 64, 65]
  const arcadaTemp4 = [85, 84, 83, 82, 81]; const arcadaTemp3 = [71, 72, 73, 74, 75]

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[800px] flex flex-col gap-10">
        <div className="flex justify-center gap-8">
          <div className="flex gap-2">
            {(dentition === "permanente" ? arcada1 : arcadaTemp1).map(num => (
              <ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEdit} />
            ))}
          </div>
          <div className="flex gap-2 border-l border-border pl-8">
            {(dentition === "permanente" ? arcada2 : arcadaTemp2).map(num => (
              <ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEdit} />
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-8">
          <div className="flex gap-2">
            {(dentition === "permanente" ? arcada4 : arcadaTemp4).map(num => (
              <ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEdit} />
            ))}
          </div>
          <div className="flex gap-2 border-l border-border pl-8">
            {(dentition === "permanente" ? arcada3 : arcadaTemp3).map(num => (
              <ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEdit} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}