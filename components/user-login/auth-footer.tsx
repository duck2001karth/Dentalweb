"use client" 

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export function AuthFooter() {
  const [isTermsOpen, setIsTermsOpen] = React.useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = React.useState(false)

  return (
    <>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Al registrarte, aceptas nuestros{" "}
        
        {/* --- MODAL DE TÉRMINOS DE SERVICIO --- */}
        <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-primary"
            >
              Términos de Servicio
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Términos de Servicio</DialogTitle>
              {/* 2. AGREGAMOS EL DIALOG DESCRIPTION PARA QUITAR EL WARNING */}
              <DialogDescription className="sr-only">
                Términos y condiciones para el uso del sistema Carmo Dental.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground space-y-2">
              <p>
                ¡Bienvenido a <strong>Carmo Dental</strong>! Al usar nuestro software de gestión clínica, aceptas
                cumplir con los siguientes términos.
              </p>
              <p>
                <strong>1. Uso de la Cuenta:</strong> Eres responsable de
                mantener la confidencialidad de tus credenciales de acceso y de cualquier actividad en el sistema bajo tu rol.
              </p>
              <p>
                <strong>2. Privacidad del Paciente:</strong> Como usuario del sistema, te comprometes a manejar 
                las historias clínicas y datos de los pacientes bajo los más estrictos estándares de confidencialidad médica.
              </p>
              <p>
                <strong>3. Limitación de Responsabilidad:</strong> El servicio de software se
                proporciona "tal cual" como una herramienta de apoyo a la gestión de la clínica.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsTermsOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* --- FIN DEL PRIMER MODAL --- */}

        {" "}y{" "}
        {/* --- MODAL DE POLÍTICA DE PRIVACIDAD --- */}
        <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-primary"
            >
              nuestra Política de Privacidad
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Política de Privacidad</DialogTitle>
              <DialogDescription className="sr-only">
                Políticas de privacidad y manejo de datos clínicos de Carmo Dental.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground space-y-3">
              <p>
                La privacidad de los datos es fundamental en <strong>Carmo Dental</strong>. Esta
                política explica qué información procesamos para potenciar la gestión de la clínica.
              </p>

              <h3 className="font-semibold text-primary">1. Información que Recopilamos</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Información de Personal:</strong> Al iniciar sesión,
                  recibimos tu nombre, correo y credenciales profesionales para configurar tu rol en el sistema.
                </li>
                <li>
                  <strong>Datos Clínicos:</strong> Almacenamos de forma segura las citas, odontogramas, 
                  historias clínicas, facturación y demás registros médicos que ingreses.
                </li>
              </ul>

              <h3 className="font-semibold text-primary">2. Cómo Usamos la Información</h3>
              <p>
                Usamos esta información exclusivamente para el funcionamiento de la clínica:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Gestión Integral:</strong> Sincronizar la agenda de pacientes, historiales médicos y control de inventario.
                </li>
              </ul>

              <h3 className="font-semibold text-primary">3. Protección de Datos</h3>
              <p>
                Sencillo: <strong>Jamás venderemos o expondremos la información personal</strong> de los pacientes 
                o del personal médico a terceros. Toda la base de datos está encriptada.
              </p>

              <h3 className="font-semibold text-primary">4. Contacto</h3>
              <p>
                Si tienes problemas de acceso, puedes contactar al administrador en:
                <strong> soporte@carmodental.com</strong>
              </p>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsPrivacyOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        .
      </p>

      <p className="px-8 text-center text-sm text-muted-foreground mt-4">
        Tu información y la de tus pacientes está protegida con seguridad clínica.
      </p>
    </>
  )
}