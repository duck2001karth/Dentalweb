"use client"

import React, { useState, useEffect } from "react"
import { Send, Download, Phone, Loader2, MessageSquare, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { useClinicSettings } from "@/config/clinic-settings"

interface RecipeShareModalProps {
  isOpen: boolean
  onClose: () => void
  patientName: string
  patientPhone: string
  patientAge: string | number
  patientDocId: string
  patientAllergies: string
  recipeData: any
  doctorSignature?: string | null
  doctorLicense?: string
  doctorName?: string
  doctorSpecialty?: string
}

function parseHtmlToCleanLines(html: string): string {
  if (!html) return ""
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, "").trim()
  }
  const container = document.createElement("div")
  container.innerHTML = html
  container.querySelectorAll("br").forEach((br) => br.replaceWith("\n"))
  container.querySelectorAll("p").forEach((p) => p.after("\n"))
  container.querySelectorAll("div").forEach((d) => d.after("\n"))
  container.querySelectorAll("li").forEach((li) => {
    li.textContent = `• ${li.textContent}\n`
  })
  return (container.textContent || container.innerText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
}

function loadImageData(
  urlOrBase64?: string | null
): Promise<{ base64: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!urlOrBase64 || urlOrBase64.trim() === "") return resolve(null)

    if (urlOrBase64.startsWith("data:")) {
      const img = new Image()
      img.onload = () => {
        resolve({
          base64: urlOrBase64,
          width: img.naturalWidth || 200,
          height: img.naturalHeight || 80,
        })
      }
      img.onerror = () => {
        resolve({
          base64: urlOrBase64,
          width: 200,
          height: 80,
        })
      }
      img.src = urlOrBase64
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        resolve({
          base64: canvas.toDataURL("image/png"),
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = urlOrBase64
  })
}

export function RecipeShareModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  patientAge,
  patientDocId,
  patientAllergies,
  recipeData,
  doctorSignature,
  doctorLicense,
  doctorName,
  doctorSpecialty,
}: RecipeShareModalProps) {
  const { toast } = useToast()
  const { settings } = useClinicSettings()
  const [phone, setPhone] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      let clean = patientPhone ? patientPhone.replace(/\D/g, "") : ""
      if (clean.length > 0 && !clean.startsWith("593")) {
        if (clean.startsWith("0")) clean = clean.substring(1)
        setPhone(`+593 ${clean}`)
      } else if (clean.startsWith("593")) {
        setPhone(`+${clean}`)
      } else {
        setPhone(patientPhone || "+593 ")
      }
    }
  }, [isOpen, patientPhone])

  const clinicName = settings?.clinicName?.trim() || "No registrado"
  const clinicSlogan = settings?.slogan?.trim() || "No registrado"
  const clinicRuc = settings?.ruc?.trim() || "0000000000001"
  const clinicHolder = settings?.razonSocial?.trim() || "Razón Social No Registrada"
  const clinicAddress = settings?.address?.trim() || "Dirección No Registrada"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "0000000000"
  const clinicEmail = settings?.email?.trim() || "no registrado"
  const logoUrl = settings?.logoUrl || ""
  const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl || ""
  const watermarkOpacity = ((settings as any)?.watermarkOpacity ?? 12) / 100

  // ==========================================
  // MOTOR DE GENERACIÓN DEL PDF
  // ==========================================
  const generateRecipePDF = async (): Promise<{ doc: jsPDF; fileName: string }> => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" })
    const fileName = `Receta_${patientName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`
    const middleX = 148.5
    const margin = 14
    const leftColX = margin
    const rightColX = middleX + margin
    const colWidth = 120

    let signatureBase64Clean: string | null =
      doctorSignature ||
      recipeData?.doctorSignature ||
      recipeData?.author?.signatureBase64 ||
      null
    if (!signatureBase64Clean) {
      try {
        const sigRes = await fetch("/api/users/signature")
        if (sigRes.ok) {
          const sigData = await sigRes.json()
          if (sigData?.signatureBase64) {
            signatureBase64Clean = sigData.signatureBase64
          }
        }
      } catch {}
    }

    const [logoData, watermarkData] = await Promise.all([
      loadImageData(logoUrl),
      loadImageData(watermarkUrl),
    ])

    doc.setDrawColor(210, 215, 220)
    doc.setLineDashPattern([2, 2], 0)
    doc.line(middleX, 5, middleX, 205)
    doc.setLineDashPattern([], 0)

    const drawSide = (startX: number, isRightSide: boolean) => {
      if (watermarkData) {
        try {
          doc.saveGraphicsState()
          const gState = new (doc as any).GState({ opacity: watermarkOpacity })
          doc.setGState(gState)
          const wmWidth = 48
          const wmHeight = (watermarkData.height / watermarkData.width) * wmWidth
          const wmX = startX + colWidth / 2 - wmWidth / 2
          const wmY = 80
          doc.addImage(watermarkData.base64, "PNG", wmX, wmY, wmWidth, wmHeight, undefined, "FAST")
          doc.restoreGraphicsState()
        } catch {}
      }

      let textOffsetX = 0
      if (logoData) {
        try {
          const targetHeight = 11
          const calculatedWidth = (logoData.width / logoData.height) * targetHeight
          doc.addImage(logoData.base64, "PNG", startX, 10, calculatedWidth, targetHeight, undefined, "FAST")
          textOffsetX = calculatedWidth + 4
        } catch {}
      }

      // Encabezados
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(0, 139, 205)
      doc.text(clinicName.toUpperCase(), startX + textOffsetX, 15)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(15, 23, 42)
      doc.text(clinicSlogan.toUpperCase(), startX + textOffsetX, 19.5)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(clinicHolder, startX + colWidth, 15, { align: "right" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.text(`RUC: ${clinicRuc}`, startX + colWidth, 19.5, { align: "right" })

      doc.setDrawColor(0, 139, 205)
      doc.setLineWidth(0.6)
      doc.line(startX, 23, startX + colWidth, 23)

      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(`Fecha de emisión: ${format(new Date(), "dd/MM/yyyy")}`, startX, 28)

      doc.setTextColor(220, 38, 38)
      doc.setFont("helvetica", "bold")
      const folioId = recipeData?.id ? recipeData.id.substring(0, 6).toUpperCase() : "REC-01"
      doc.text(`N° ${folioId}`, startX + colWidth, 28, { align: "right" })

      // Cuadro Paciente
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(startX, 32, colWidth, 20, 2, 2, "F")

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 139, 205)
      doc.text("Paciente:", startX + 4, 37.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(15, 23, 42)
      doc.text(patientName, startX + 22, 37.5)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 139, 205)
      doc.text("Edad:", startX + 85, 37.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(15, 23, 42)
      doc.text(`${patientAge || "--"} Años`, startX + 96, 37.5)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 139, 205)
      doc.text("Doc. Identidad:", startX + 4, 43)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(15, 23, 42)
      const finalDocId =
        patientDocId && patientDocId.trim().length > 0 && patientDocId !== "No registrado"
          ? patientDocId
          : "No registrado"
      doc.text(finalDocId, startX + 30, 43)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(220, 38, 38)
      doc.text("Alergias:", startX + 4, 48.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105)
      doc.text(patientAllergies || "Ninguna reportada", startX + 22, 48.5)

      // Contenido (Izquierda / Derecha)
      if (!isRightSide) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.setTextColor(0, 139, 205)
        doc.text("Medicamentos (R.P.)", startX, 58)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(startX, 60, startX + colWidth, 60)

        const medsContent = parseHtmlToCleanLines(recipeData?.medications)
        if (medsContent) {
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
          doc.setTextColor(15, 23, 42)
          const splitLines = doc.splitTextToSize(medsContent, colWidth)
          doc.text(splitLines, startX, 65)
        }
      } else {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.setTextColor(0, 139, 205)
        doc.text("Indicaciones", startX, 58)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(startX, 60, startX + colWidth, 60)

        const indsContent = parseHtmlToCleanLines(recipeData?.indications)
        if (indsContent) {
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
          doc.setTextColor(15, 23, 42)
          const splitLines = doc.splitTextToSize(indsContent, colWidth)
          doc.text(splitLines, startX, 65)
        }

        const obsContent = parseHtmlToCleanLines(recipeData?.observations)
        if (obsContent) {
          const obsStartY = 148
          doc.setFont("helvetica", "bold")
          doc.setFontSize(7.5)
          doc.setTextColor(194, 65, 12)
          doc.text("OBSERVACIONES / RECOMENDACIONES ESPECIALES:", startX, obsStartY)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.5)
          doc.setTextColor(15, 23, 42)
          const splitObs = doc.splitTextToSize(obsContent, colWidth)
          doc.text(splitObs, startX, obsStartY + 4)
        }
      }

      // ===============================================
      // 4. FIRMA Y PIE DE PÁGINA PROFESIONAL
      // ===============================================
      const finalY = 178

      // Renderizado directo del Base64 de la firma
      if (signatureBase64Clean && signatureBase64Clean.startsWith("data:")) {
        try {
          const sigW = 40
          const sigH = 15
          const sigX = startX + colWidth / 2 - sigW / 2
          const sigY = finalY - sigH - 1

          doc.addImage(signatureBase64Clean, "PNG", sigX, sigY, sigW, sigH, undefined, "FAST")
        } catch (err) {
          console.error("Error al inyectar firma en jsPDF:", err)
        }
      }

      // Línea divisoria
      doc.setDrawColor(15, 23, 42)
      doc.setLineWidth(0.4)
      doc.line(startX + 25, finalY, startX + 95, finalY)

      // Nombre del especialista (sin forzar mayúsculas)
      const rawDocName =
        doctorName ||
        recipeData?.doctorName ||
        recipeData?.author?.name ||
        "Dr. Especialista"
      const finalDocName = rawDocName.startsWith("Dr") ? rawDocName : `Dr. ${rawDocName}`

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text(finalDocName, startX + colWidth / 2, finalY + 4, { align: "center" })

      // Especialidad
      const finalSpecialty =
        doctorSpecialty ||
        recipeData?.doctorSpecialty ||
        recipeData?.author?.specialty ||
        "Ortodoncia"
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(71, 85, 105)
      doc.text(finalSpecialty, startX + colWidth / 2, finalY + 7.2, { align: "center" })

      // Matrícula
      const finalLicense =
        doctorLicense ||
        recipeData?.doctorLicense ||
        recipeData?.author?.professionalCard ||
        recipeData?.author?.licenseNumber ||
        ""
      if (finalLicense && finalLicense.trim() !== "") {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6.5)
        doc.setTextColor(100, 116, 139)
        doc.text(`Matrícula / Reg. MSP: ${finalLicense}`, startX + colWidth / 2, finalY + 10.2, {
          align: "center",
        })
      }

      // Franja y pie de clínica
      doc.setDrawColor(0, 139, 205)
      doc.setLineWidth(0.8)
      doc.line(startX, finalY + 12, startX + colWidth, finalY + 12)

      doc.setFontSize(6.5)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text(`DIRECCIÓN: ${clinicAddress.toUpperCase()}`, startX + colWidth / 2, finalY + 15, {
        align: "center",
      })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(6)
      doc.setTextColor(71, 85, 105)
      doc.text(
        `Cel.: ${clinicPhone}  •  e-mail: ${clinicEmail}  •  Quito - Ecuador`,
        startX + colWidth / 2,
        finalY + 18,
        { align: "center" }
      )
    }

    drawSide(leftColX, false)
    drawSide(rightColX, true)
    return { doc, fileName }
  }

  // ==========================================
  // DISPARADORES DE ACCIÓN
  // ==========================================
  const handleDownloadOnly = async () => {
    setIsActionLoading(true)
    try {
      const { doc, fileName } = await generateRecipePDF()
      doc.save(fileName)
      toast({ title: "PDF Descargado", description: "El archivo se guardó correctamente." })
    } catch {
      toast({ title: "Error al generar PDF", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSendAndOpenWhatsApp = async () => {
    const cleanDigits = phone.replace(/\D/g, "")
    if (!cleanDigits || cleanDigits.length < 9) {
      toast({
        title: "Número incorrecto",
        description: "Verifica el número de WhatsApp con código de país.",
        variant: "destructive",
      })
      return
    }
    setIsActionLoading(true)
    try {
      const { doc, fileName } = await generateRecipePDF()
      doc.save(fileName)

      const msg =
        `Hola *${patientName}*,\n` +
        `Aquí tienes tu receta médica emitida por *${clinicName}*:\n\n` +
        `💊 *Medicamentos (R.P.):*\nVer archivo PDF adjunto\n\n` +
        `📋 *Indicaciones:*\nVer archivo PDF adjunto\n\n` +
        `_Que te mejores pronto._`

      window.open(`https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`, "_blank")
      toast({
        title: "¡Receta descargada y WhatsApp abierto!",
        description: "Arrastra el archivo PDF descargado a la conversación para enviarlo.",
      })
      onClose()
    } catch {
      toast({ title: "No se pudo procesar el envío", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[490px] bg-card border-border/80 rounded-[28px] p-0 shadow-2xl overflow-hidden font-sans">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 shrink-0">
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span>Enviar Receta por WhatsApp</span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                PACIENTE: {patientName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Número de WhatsApp (con código de país)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-11 rounded-xl font-mono text-sm border-border/80 focus-visible:ring-[#25D366]"
                placeholder="+593 999999999"
              />
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200/80 p-3.5 rounded-2xl space-y-1.5 shadow-xs">
            <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#008bcd] shrink-0" /> Flujo rápido sin fricción
            </p>
            <p className="text-[11px] text-slate-700 leading-relaxed font-normal">
              Al hacer clic en <strong className="text-slate-900">&quot;Abrir Chat y Descargar&quot;</strong> se
              guardará el PDF oficial con tu firma y matrícula institucional en tu equipo y se abrirá el chat de
              WhatsApp del paciente para adjuntarlo.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button
            variant="outline"
            onClick={handleDownloadOnly}
            disabled={isActionLoading}
            className="w-full sm:w-auto rounded-xl h-10 px-4 text-xs font-bold border-border/80 hover:bg-muted gap-2 cursor-pointer"
          >
            {isActionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#008bcd]" />
            )}
            Solo PDF
          </Button>

          <Button
            onClick={handleSendAndOpenWhatsApp}
            disabled={isActionLoading || phone.length < 8}
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebc59] text-white rounded-xl h-10 px-6 text-xs font-bold shadow-md shadow-[#25D366]/20 gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Abrir Chat y Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}