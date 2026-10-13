import { DomainError } from "./errors.ts";
import { applyInventoryMovement } from "./inventory.ts";
import type { DemoState, DemoPurchase } from "./types";
function unique(state: DemoState, id: string) { if (!id.trim() || state.processedOperationIds.includes(id)) throw new DomainError("Operación repetida o inválida.", "DUPLICATE_OPERATION"); }
function validName(value: string, label: string) { const name = value.trim(); if (!name || name.length > 120) throw new DomainError(label + " inválido.", "INVALID_NAME"); return name; }
export function addSupplier(state: DemoState, input: { operationId: string; name: string; contact: string }, now = new Date().toISOString()): DemoState {
 unique(state,input.operationId); const name=validName(input.name,"Proveedor"); const number=state.counters.supplier+1;
 return {...state,updatedAt:now,suppliers:[...state.suppliers,{id:"demo-supplier-"+number,name,contact:input.contact.trim().slice(0,160),active:true,isFictitious:true}],counters:{...state.counters,supplier:number},processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function editSupplier(state: DemoState, input: {operationId:string; id:string; name:string; contact:string; active:boolean},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId); if(!state.suppliers.some(x=>x.id===input.id))throw new DomainError("Proveedor inexistente.","SUPPLIER_NOT_FOUND");
 return {...state,updatedAt:now,suppliers:state.suppliers.map(x=>x.id===input.id?{...x,name:validName(input.name,"Proveedor"),contact:input.contact.trim().slice(0,160),active:input.active}:x),processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function addCustomer(state: DemoState,input:{operationId:string;name:string;kind:"consumer"|"business"},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);const number=state.counters.customer+1;return {...state,updatedAt:now,customers:[...state.customers,{id:"demo-customer-new-"+number,displayName:validName(input.name,"Cliente"),kind:input.kind,isFictitious:true}],counters:{...state.counters,customer:number},processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function editCustomer(state: DemoState,input:{operationId:string;id:string;name:string;kind:"consumer"|"business"},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);if(!state.customers.some(x=>x.id===input.id))throw new DomainError("Cliente inexistente.","CUSTOMER_NOT_FOUND");
 return {...state,updatedAt:now,customers:state.customers.map(x=>x.id===input.id?{...x,displayName:validName(input.name,"Cliente"),kind:input.kind}:x),processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function createPurchase(state:DemoState,input:{operationId:string;supplierId:string;lines:Array<{productId:string;quantity:number;unitCostPyg:number}>;note:string},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);
 if(!state.suppliers.some(x=>x.id===input.supplierId&&x.active))throw new DomainError("Seleccioná un proveedor activo.","SUPPLIER_NOT_FOUND");
 if(!input.lines.length)throw new DomainError("Agregá productos.","EMPTY_ITEMS");
 const ids=new Set<string>();
 for(const line of input.lines){if(ids.has(line.productId)||!state.inventory.some(x=>x.productId===line.productId))throw new DomainError("Producto duplicado o inexistente.","INVALID_PRODUCT");ids.add(line.productId);
 if(!Number.isSafeInteger(line.quantity)||line.quantity<1||!Number.isSafeInteger(line.unitCostPyg)||line.unitCostPyg<0||!Number.isSafeInteger(line.quantity*line.unitCostPyg))throw new DomainError("Cantidades y costos deben ser enteros válidos.","INVALID_PURCHASE_LINE");}
 const number=state.counters.purchase+1;
 const purchase:DemoPurchase={id:"demo-purchase-"+number,number:"DEM-COMP-"+String(number).padStart(4,"0"),supplierId:input.supplierId,status:"draft",lines:input.lines.map(x=>({...x})),createdAt:now,receivedAt:null,note:input.note.trim().slice(0,500),isFictitious:true};
 return {...state,updatedAt:now,purchases:[...state.purchases,purchase],counters:{...state.counters,purchase:number},processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function orderPurchase(state:DemoState,input:{operationId:string;purchaseId:string},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);const purchase=state.purchases.find(x=>x.id===input.purchaseId);
 if(!purchase||purchase.status!=="draft")throw new DomainError("Solo se puede ordenar una compra en borrador.","INVALID_PURCHASE_STATUS");
 return {...state,updatedAt:now,purchases:state.purchases.map(x=>x.id===purchase.id?{...x,status:"ordered"}:x),processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
export function receivePurchase(state:DemoState,input:{operationId:string;purchaseId:string;actor:string},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);const purchase=state.purchases.find(x=>x.id===input.purchaseId);
 if(!purchase||purchase.status!=="ordered")throw new DomainError("La compra no está pendiente de recepción.","INVALID_PURCHASE_STATUS");
 const actor=validName(input.actor,"Responsable");
 let next=state;
 for(const line of purchase.lines)next=applyInventoryMovement(next,{productId:line.productId,kind:"receipt",quantity:line.quantity,referenceId:purchase.id,reason:"Recepción de compra "+purchase.number,actor},now);
 return {...next,updatedAt:now,purchases:next.purchases.map(x=>x.id===purchase.id?{...x,status:"received",receivedAt:now}:x),processedOperationIds:[...next.processedOperationIds,input.operationId]};
}
export function cancelPurchase(state:DemoState,input:{operationId:string;purchaseId:string},now=new Date().toISOString()):DemoState {
 unique(state,input.operationId);const purchase=state.purchases.find(x=>x.id===input.purchaseId);
 if(!purchase||purchase.status==="received"||purchase.status==="cancelled")throw new DomainError("No se puede cancelar esta compra.","INVALID_PURCHASE_STATUS");
 return {...state,updatedAt:now,purchases:state.purchases.map(x=>x.id===purchase.id?{...x,status:"cancelled"}:x),processedOperationIds:[...state.processedOperationIds,input.operationId]};
}
