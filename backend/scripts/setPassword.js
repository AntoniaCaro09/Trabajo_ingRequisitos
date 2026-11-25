'use strict';
// Ejecutar en backend: node scripts/setPassword.js correo@empresa.cl
const path = require('path');
require('dotenv').config({path:path.join(__dirname,'..','.env')});
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const correo = String(process.argv[2]||'').trim().toLowerCase();
if (!correo.includes('@')) {console.error('Uso: node scripts/setPassword.js correo@empresa.cl');process.exit(1);}
if (!process.stdin.isTTY) {console.error('Ejecuta desde una terminal interactiva para ocultar la contraseña.');process.exit(1);}

function pedirOculta(mensaje) {
  return new Promise((resolve,reject)=>{
    process.stdout.write(mensaje);
    let valor='';
    process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
    function terminar(error) {
      process.stdin.setRawMode(false);process.stdin.pause();
      process.stdin.removeListener('data',alTeclear);process.stdout.write('\n');
      if(error)reject(error);else resolve(valor);
    }
    function alTeclear(c) {
      if(c==='\u0003')return terminar(new Error('Cancelado'));
      if(c==='\r'||c==='\n')return terminar(null);
      if(c==='\u007f'||c==='\b'){valor=valor.slice(0,-1);return;}
      if(c.charCodeAt(0)>=32&&valor.length<128)valor+=c;
    }
    process.stdin.on('data',alTeclear);
  });
}
(async()=>{
  const pool=new Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),
    user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
  try {
    const clave=await pedirOculta('Contraseña (no se mostrará): ');
    if(clave.length<12)throw new Error('Utiliza al menos 12 caracteres.');
    const hash=await bcrypt.hash(clave,12);
    const r=await pool.query('UPDATE public.usuarios SET password_hash=$1 WHERE LOWER(correo)=$2 RETURNING id',[hash,correo]);
    if(!r.rowCount)throw new Error('No existe ese correo en usuarios.');
    process.stdout.write(`Contraseña configurada para el ID ${r.rows[0].id}.\n`);
  }catch(e){console.error(e.message);process.exitCode=1;}
  finally{await pool.end();}
})();
