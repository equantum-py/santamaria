"use client";
import {useEffect,useState} from "react";
import {AdminModuleFrame} from "./module-frame";
type RecordItem={id:string;name:string;status:"borrador"|"activa"|"pausada";detail:string;start:string;end:string};
export default function MarketingModule({kind}:{kind:"promociones"|"marketing"}){
 const label=kind==="promociones"?"Promociones":"Campañas";
 const key="santamaria-admin-demo:"+kind+":v1";
 const [items,setItems]=useState<RecordItem[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [name,setName]=useState("");const [detail,setDetail]=useState("");const [start,setStart]=useState("");const [end,setEnd]=useState("");const [error,setError]=useState("");
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const value:unknown=JSON.parse(raw);if(Array.isArray(value))setItems(value.filter((x):x is RecordItem=>typeof x==="object"&&x!==null&&typeof x.id==="string"&&typeof x.name==="string"&&["borrador","activa","pausada"].includes(x.status)));}}catch{setError("No se pudieron cargar los datos de la demo.");}setHydrated(true);},[key]);
 function persist(next:RecordItem[]){try{localStorage.setItem(key,JSON.stringify(next));setItems(next);setError("");}catch{setError("No se pudieron guardar los cambios.");}}
 function create(){if(!name.trim()||name.length>120||!detail.trim()||detail.length>300||!start||!end||end<start){setError("Completá nombre, descripción y fechas válidas.");return;}persist([...items,{id:crypto.randomUUID(),name:name.trim(),detail:detail.trim(),start,end,status:"borrador"}]);setName("");setDetail("");setStart("");setEnd("");}
 function change(id:string,status:RecordItem["status"]){persist(items.map(x=>x.id===id?{...x,status}:x));}
 return <AdminModuleFrame title={label}><section className="admin-panel" style={{padding:24}}><h1>{label} · Demo</h1><p>Planificación ficticia. No modifica precios del ecommerce ni publica anuncios o campañas reales.</p><form onSubmit={e=>{e.preventDefault();create();}} style={{display:"grid",gap:12,maxWidth:650}}>
 <label>Nombre<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:10}}/></label>
 <label>{kind==="promociones"?"Condiciones de la promoción":"Objetivo y canal de campaña"}<textarea required maxLength={300} value={detail} onChange={e=>setDetail(e.target.value)} style={{display:"block",width:"100%",padding:10}}/></label>
 <label>Inicio<input required type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Fin<input required type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
 <button type="submit" disabled={!hydrated}>Crear borrador</button></form>{error&&<p role="alert">{error}</p>}
 <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Nombre</th><th>Detalle</th><th>Vigencia</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.detail}</td><td>{x.start} — {x.end}</td><td>{x.status}</td><td><button onClick={()=>change(x.id,x.status==="activa"?"pausada":"activa")}>{x.status==="activa"?"Pausar demo":"Activar demo"}</button></td></tr>)}</tbody></table></div>{!items.length&&<p>Sin registros demostrativos todavía.</p>}</section></AdminModuleFrame>;
}