const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
function insert(s, anchor, line, marker) {
  if (s.includes(marker)) return s;
  const index=s.indexOf(anchor);
  if(index<0 || s.indexOf(anchor,index+anchor.length)>=0) throw new Error('Ancla ausente o ambigua: '+anchor);
  return s.slice(0,index)+line+'\n'+s.slice(index);
}
const files=[
 ['components/admin/admin-sidebar.tsx',s=>{
   s=insert(s,'  LayoutDashboard,','  Trash2,','  Trash2,');
   return insert(s,'  { name: "Auditoría de Sistema",','  { name: "Papelera de pacientes", href: "/admin/papelera", icon: Trash2 },','href: "/admin/papelera"');
 }],
 ['app/admin/layout.tsx',s=>insert(s,'  { label: "Auditoría",','  { label: "Papelera", href: "/admin/papelera" },','href: "/admin/papelera"')],
 ['prisma/schema.prisma',s=>{
   const re=/model AuditLog\s*\{[\s\S]*?\n\}/;
   const m=s.match(re);if(!m)throw new Error('No se encuentra modelo AuditLog');
   let model=m[0];
   if(!/\barchivedPatientId\s+String\?/.test(model)){
     const anchor=/^(\s*patientId\s+String\?[^\r\n]*)$/m;
     if(!anchor.test(model))throw new Error('AuditLog.patientId incompatible');
     model=model.replace(anchor,'$1\n  archivedPatientId String?');
   }
   const rel=/^(\s*patient\s+Patient\?\s+@relation\([^\r\n]*onDelete:\s*)(Cascade|Restrict|SetNull|NoAction)([^\r\n]*)$/m;
   if(!rel.test(model))throw new Error('AuditLog.patient incompatible');
   model=model.replace(rel,'$1SetNull$3');
   return s.replace(re,()=>model);
 }]
];
try{
 const plan=files.map(([name,fn])=>{const file=path.join(root,name);const old=fs.readFileSync(file,'utf8');return {name,file,old,next:fn(old)}}).filter(p=>p.old!==p.next);
 if(!plan.length){console.log('Integración ya aplicada.');process.exit(0)}
 const backup=path.join(root,'.backup-papelera-'+Date.now());
 for(const p of plan){const dest=path.join(backup,p.name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,p.old)}
 const written=[];
 try{for(const p of plan){written.push(p);fs.writeFileSync(p.file,p.next)}}catch(e){for(const p of written)fs.writeFileSync(p.file,p.old);throw e}
 console.log('Integración aplicada:',plan.map(p=>p.name).join(', '));console.log('Respaldo de código:',backup);console.log('Ejecuta npx prisma generate y npm run build. No uses db push.');
}catch(e){console.error('No se pudo integrar:',e.message);process.exitCode=1}
