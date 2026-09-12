"use client"

import React, { useState, useEffect } from "react"
import { Mail, Loader2, Send } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SendEmailModal({ isOpen, onClose, payment, patient }: any) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (patient?.email || payment?.patient?.email) {
      setEmail(patient?.email || payment?.patient?.email || "")
    }
  }, [patient, payment])

  if (!payment) return null

  const paymentNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: "Atención", description: "Por favor ingresa un correo electrónico válido.", variant: "default" })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/payments/${payment.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        toast({ title: "Comprobante Enviado", description: `Se ha enviado el comprobante a ${email}`, variant: "success" })
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo enviar el correo del comprobante.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border rounded-2xl p-6 font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Mail className="w-5 h-5 text-[#008bcd]" /> Enviar Comprobante por Correo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Se enviará el comprobante digital del pago <strong className="text-foreground">{paymentNum}</strong> al paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Correo Electrónico del Destinatario</Label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="rounded-xl h-10 text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs h-10">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
              Enviar Comprobante
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}