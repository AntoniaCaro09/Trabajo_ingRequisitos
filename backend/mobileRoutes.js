'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');

module.exports = function crearRutasMobile(pool) {
  const router = express.Router();
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < 32) throw new Error('Configura JWT_SECRET de al menos 32 caracteres en backend/.env');
  const rolesValidos = new Set(['OPERARIO','TECNICO','SUPERVISOR','ADMIN']);
  const uuidValido = s => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  const idValido = s => /^\d+$/.test(String(s)) && Number(s)>0;
  const prioridades = new Set(['baja','media','alta','critica']);
  const transiciones = {
    pendiente:['en_progreso','cancelada'],
    asignada:['en_progreso','cancelada'],
    en_progreso:['pausada','completada'],
    pausada:['en_progreso','cancelada'],
    completada:[],cancelada:[],
  };
  const error500 = (res,e) => {
    console.error('API móvil:',e);
    return res.status(500).json({error:'Error interno del servidor.'});
  };

  async function obtenerUsuario(id) {
    const r = await pool.query(`SELECT u.id,u.nombre,u.apellido,u.correo,
      COALESCE(ARRAY(
        SELECT DISTINCT UPPER(r.codigo)
        FROM public.roles r
        WHERE r.codigo IS NOT NULL AND (
          EXISTS(SELECT 1 FROM public.usuario_roles ur
            WHERE ur.usuario_id=u.id AND ur.rol_id=r.id)
          OR EXISTS(SELECT 1 FROM public.usuario_empresa_roles er
            WHERE er.usuario_id=u.id AND er.rol_id=r.id)
        ) ORDER BY UPPER(r.codigo)
      ),ARRAY[]::text[]) AS roles
      FROM public.usuarios u WHERE u.id=$1 AND u.estado='activo'`,[id]);
    if (!r.rowCount) return null;
    return { ...r.rows[0], id:String(r.rows[0].id),roles:r.rows[0].roles.filter(x=>rolesValidos.has(x)) };
  }

  const limiter = rateLimit({windowMs:15*60*1000,limit:10,
    standardHeaders:'draft-7',legacyHeaders:false,
    message:{error:'Demasiados intentos. Prueba más tarde.'}});
  router.post('/auth/login',limiter,async(req,res)=>{
    const correo = String(req.body?.correo || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!correo || !password || correo.length>150 || password.length>128) {
      return res.status(400).json({error:'Correo o contraseña inválidos.'});
    }
    try {
      const r=await pool.query(`SELECT id,password_hash FROM public.usuarios
        WHERE LOWER(correo)=$1 AND estado='activo'`,[correo]);
      if (!r.rowCount || !r.rows[0].password_hash ||
          !(await bcrypt.compare(password,r.rows[0].password_hash))) {
        return res.status(401).json({error:'Credenciales incorrectas.'});
      }
      const usuario = await obtenerUsuario(r.rows[0].id);
      if (!usuario || !usuario.roles.length) return res.status(403).json({error:'Usuario sin rol asignado.'});
      const token = jwt.sign({},secreto,{subject:usuario.id,expiresIn:'8h',issuer:'mantenimiento-planta'});
      return res.json({token,expiresAt:new Date(Date.now()+8*3600*1000).toISOString(),usuario});
    } catch(e){return error500(res,e);}
  });

  async function verificar(req,res,next) {
    try {
      const cabecera=String(req.headers.authorization || '');
      if (!cabecera.startsWith('Bearer ')) return res.status(401).json({error:'Falta token de acceso.'});
      const decodificado=jwt.verify(cabecera.slice(7),secreto,{issuer:'mantenimiento-planta'});
      if (typeof decodificado==='string' || !idValido(decodificado.sub)) {
        return res.status(401).json({error:'Token inválido.'});
      }
      const usuario=await obtenerUsuario(decodificado.sub);
      if (!usuario) return res.status(401).json({error:'Usuario inactivo.'});
      req.usuario=usuario;
      next();
    } catch(e){return res.status(401).json({error:'Sesión vencida o inválida.'});}
  }
  const permitir=(...autorizados)=>(req,res,next)=>{
    if (!req.usuario?.roles.some(r=>autorizados.includes(r))) {
      return res.status(403).json({error:'Tu rol no permite esta operación.'});
    }
    next();
  };
  router.get('/auth/me',verificar,(req,res)=>res.json({usuario:req.usuario}));

  router.get('/activos',verificar,async(req,res)=>{
    try {
      const r=await pool.query(`SELECT e.id::text,e.area_id::text,
        e.codigo_interno,e.codigo_qr::text,e.nombre,e.descripcion,e.estado,
        a.nombre AS area FROM public.equipos e
        JOIN public.areas a ON a.id=e.area_id ORDER BY e.codigo_interno`);
      res.json(r.rows);
    } catch(e){error500(res,e);}
  });

  router.get('/reportes',verificar,async(req,res)=>{
    try {
      const all=req.usuario.roles.some(r=>['ADMIN','SUPERVISOR'].includes(r));
      const r=await pool.query(`SELECT id::text,equipo_id::text,usuario_id::text,
        titulo,descripcion,prioridad,estado,fecha_reporte FROM public.reportes_anomalias
        WHERE ($1::boolean OR usuario_id=$2::bigint) ORDER BY fecha_reporte DESC`,
        [all,req.usuario.id]);
      res.json(r.rows);
    } catch(e){error500(res,e);}
  });

  router.post('/reportes',verificar,permitir('OPERARIO','TECNICO','SUPERVISOR','ADMIN'),async(req,res)=>{
    const {client_uuid,equipo_id,titulo,descripcion,prioridad}=req.body||{};
    const nombre=String(titulo||'').trim(),detalle=String(descripcion||'').trim();
    if (!uuidValido(client_uuid)||!idValido(equipo_id)||!nombre||nombre.length>150||
      !detalle||detalle.length>3000||!prioridades.has(prioridad)) {
      return res.status(400).json({error:'Reporte inválido.'});
    }
    try {
      const r=await pool.query(`INSERT INTO public.reportes_anomalias
        (cliente_uuid,equipo_id,usuario_id,titulo,descripcion,prioridad)
        VALUES ($1::uuid,$2::bigint,$3::bigint,$4,$5,$6)
        ON CONFLICT (cliente_uuid) WHERE cliente_uuid IS NOT NULL DO NOTHING
        RETURNING id::text,usuario_id::text`,
        [client_uuid,equipo_id,req.usuario.id,nombre,detalle,prioridad]);
      const existe=r.rowCount?r.rows[0]:(await pool.query(
        `SELECT id::text,usuario_id::text FROM public.reportes_anomalias WHERE cliente_uuid=$1::uuid`,
        [client_uuid])).rows[0];
      if (!existe || existe.usuario_id!==req.usuario.id) return res.status(409).json({error:'UUID en uso por otra persona.'});
      res.status(r.rowCount?201:200).json({id:existe.id});
    } catch(e) {
      if(e.code==='23503')return res.status(400).json({error:'Equipo no encontrado.'});
      error500(res,e);
    }
  });

  const uploadsDir=path.join(__dirname,'uploads','reportes');
  fs.mkdirSync(uploadsDir,{recursive:true});
  const upload=multer({
    storage:multer.diskStorage({
      destination:(req,file,cb)=>cb(null,uploadsDir),
      filename:(req,file,cb)=>cb(null,`${crypto.randomUUID()}.jpg`),
    }),
    limits:{fileSize:499_999,files:1},
    fileFilter:(req,file,cb)=>{
      if(file.mimetype!=='image/jpeg')return cb(new Error('Solo fotografías JPEG.'));
      cb(null,true);
    },
  });
  function fotoSegura(req,res,next) {
    upload.single('foto')(req,res,err=>{
      if(err)return res.status(400).json({error:'Fotografía inválida o de 500 KB o más.'});
      next();
    });
  }
  router.post('/reportes/:id/foto',verificar,permitir('OPERARIO','TECNICO','SUPERVISOR','ADMIN'),
    fotoSegura,async(req,res)=>{
      const limpiar=()=>{if(req.file)fs.rmSync(req.file.path,{force:true});};
      if(!idValido(req.params.id)||!req.file||!uuidValido(req.body?.client_uuid)) {
        limpiar();return res.status(400).json({error:'Reporte, foto o UUID inválidos.'});
      }
      try {
        // Verificación adicional del formato, no solo del Content-Type declarado.
        const firma=Buffer.alloc(3);
        const fd=fs.openSync(req.file.path,'r');
        try {fs.readSync(fd,firma,0,3,0);} finally {fs.closeSync(fd);}
        if(firma[0]!==0xFF||firma[1]!==0xD8||firma[2]!==0xFF) {
          limpiar();return res.status(400).json({error:'El archivo no es un JPEG válido.'});
        }
        const all=req.usuario.roles.some(r=>['SUPERVISOR','ADMIN'].includes(r));
        const rep=await pool.query(`SELECT id FROM public.reportes_anomalias
          WHERE id=$1 AND ($2::boolean OR usuario_id=$3::bigint)`,
          [req.params.id,all,req.usuario.id]);
        if(!rep.rowCount){limpiar();return res.status(403).json({error:'Sin acceso al reporte.'});}
        const ruta=path.posix.join('uploads','reportes',req.file.filename);
        const r=await pool.query(`INSERT INTO public.adjuntos_reportes_anomalias
          (cliente_uuid,reporte_anomalia_id,usuario_subida_id,nombre_archivo,ruta_archivo,tipo_mime,tamano_bytes)
          VALUES ($1::uuid,$2::bigint,$3::bigint,$4,$5,'image/jpeg',$6)
          ON CONFLICT (cliente_uuid) WHERE cliente_uuid IS NOT NULL DO NOTHING
          RETURNING id::text`,[
            req.body.client_uuid,req.params.id,req.usuario.id,req.file.filename,ruta,req.file.size,
          ]);
        if(!r.rowCount) {
          limpiar();
          const original=await pool.query(`SELECT id::text,reporte_anomalia_id::text
            FROM public.adjuntos_reportes_anomalias WHERE cliente_uuid=$1::uuid`,[req.body.client_uuid]);
          if(!original.rowCount || original.rows[0].reporte_anomalia_id!==req.params.id)
            return res.status(409).json({error:'UUID de fotografía ya utilizado.'});
          return res.json({id:original.rows[0].id});
        }
        return res.status(201).json(r.rows[0]);
      } catch(e){limpiar();return error500(res,e);}
    });

  router.get('/ordenes',verificar,permitir('TECNICO','SUPERVISOR','ADMIN'),async(req,res)=>{
    try {
      const all=req.usuario.roles.some(r=>['SUPERVISOR','ADMIN'].includes(r));
      const r=await pool.query(`SELECT id::text,reporte_anomalia_id::text,equipo_id::text,
        titulo,prioridad,estado,usuario_asignado_id::text FROM public.ordenes_trabajo
        WHERE ($1::boolean OR usuario_asignado_id=$2::bigint)
        ORDER BY id DESC`,[all,req.usuario.id]);
      res.json(r.rows);
    } catch(e){error500(res,e);}
  });

  router.patch('/ordenes/:id/estado',verificar,permitir('TECNICO','SUPERVISOR','ADMIN'),async(req,res)=>{
    const id=req.params.id,nuevo=req.body?.estado;
    if(!idValido(id)||typeof nuevo!=='string')return res.status(400).json({error:'Orden o estado inválido.'});
    const cliente=await pool.connect().catch(()=>null);
    if(!cliente)return res.status(503).json({error:'PostgreSQL no disponible.'});
    try {
      await cliente.query('BEGIN');
      const r=await cliente.query(`SELECT * FROM public.ordenes_trabajo WHERE id=$1 FOR UPDATE`,[id]);
      if(!r.rowCount){await cliente.query('ROLLBACK');return res.status(404).json({error:'Orden no encontrada.'});}
      const orden=r.rows[0];
      const admin=req.usuario.roles.some(x=>['ADMIN','SUPERVISOR'].includes(x));
      if(!admin && String(orden.usuario_asignado_id)!==req.usuario.id) {
        await cliente.query('ROLLBACK');return res.status(403).json({error:'No estás asignado a esta orden.'});
      }
      if(!(transiciones[orden.estado]||[]).includes(nuevo)) {
        await cliente.query('ROLLBACK');return res.status(409).json({error:'Transición de estado no permitida.'});
      }
      const actual=await cliente.query(`UPDATE public.ordenes_trabajo
        SET estado=$2,fecha_inicio=CASE WHEN $3::text='en_progreso' AND fecha_inicio IS NULL
          THEN CURRENT_TIMESTAMP ELSE fecha_inicio END,
          fecha_finalizacion=CASE WHEN $3::text='completada' THEN CURRENT_TIMESTAMP
          ELSE fecha_finalizacion END
        WHERE id=$1 RETURNING id::text,reporte_anomalia_id::text,equipo_id::text,
          titulo,prioridad,estado,usuario_asignado_id::text`,[id,nuevo,nuevo]);
      if(nuevo==='completada' && orden.reporte_anomalia_id) {
        await cliente.query(`UPDATE public.reportes_anomalias SET estado='resuelto' WHERE id=$1`,
          [orden.reporte_anomalia_id]);
      }
      await cliente.query('COMMIT');return res.json(actual.rows[0]);
    } catch(e){await cliente.query('ROLLBACK').catch(()=>{});return error500(res,e);}
    finally{cliente.release();}
  });

  router.get('/metricas',verificar,permitir('SUPERVISOR','ADMIN'),async(req,res)=>{
    try {
      const r=await pool.query(`SELECT
        COUNT(*) FILTER (WHERE estado IN ('pendiente','asignada','en_progreso','pausada'))::int AS abiertas,
        COUNT(*) FILTER (WHERE estado='completada')::int AS completadas,
        ROUND(AVG(EXTRACT(EPOCH FROM (fecha_finalizacion-fecha_inicio))/3600.0)
          FILTER (WHERE estado='completada' AND fecha_inicio IS NOT NULL)::numeric,2)::float AS mttr_horas
        FROM public.ordenes_trabajo`);
      res.json(r.rows[0]);
    } catch(e){error500(res,e);}
  });

  return router;
};
