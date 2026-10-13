import test from "node:test";
import assert from "node:assert/strict";
import {createInitialDemoState} from "../../lib/admin/demo-state.ts";
import {addSupplier,editSupplier,addCustomer,editCustomer,createPurchase,orderPurchase,receivePurchase,cancelPurchase} from "../../lib/admin/procurement.ts";
import {loadDemoState,DEMO_STORAGE_KEY} from "../../lib/admin/persistence.ts";
const NOW="2026-10-13T12:00:00.000Z";
const catalog=[{id:"p1",sku:"SM-001",name:"Cemento",categoryId:"obra",categoryName:"Obra",pricePyg:50000,saleUnit:"bolsa",availability:"disponible",active:true,fictitiousPrice:true}];
function setup(){let s=createInitialDemoState(NOW,catalog);s=addSupplier(s,{operationId:"supplier-1",name:"Proveedor ficticio",contact:"demo"},NOW);return s;}
test("proveedores y clientes se guardan y editan sin duplicar operaciones",()=>{
 let s=setup();assert.equal(s.suppliers.length,1);
 assert.throws(()=>addSupplier(s,{operationId:"supplier-1",name:"Duplicado",contact:""},NOW),{code:"DUPLICATE_OPERATION"});
 s=editSupplier(s,{operationId:"supplier-edit",id:s.suppliers[0].id,name:"Proveedor demo editado",contact:"",active:true},NOW);
 s=addCustomer(s,{operationId:"customer-1",name:"Cliente demo",kind:"business"},NOW);
 s=editCustomer(s,{operationId:"customer-edit",id:s.customers.at(-1).id,name:"Cliente editado",kind:"consumer"},NOW);
 assert.equal(s.suppliers[0].name,"Proveedor demo editado");assert.equal(s.customers.at(-1).displayName,"Cliente editado");
});
test("compras: borrador, orden, recepción exacta una sola vez, sin tocar caja",()=>{
 let s=setup();const stock=s.inventory[0].stockOnHand;
 s=createPurchase(s,{operationId:"purchase-1",supplierId:s.suppliers[0].id,lines:[{productId:"p1",quantity:4,unitCostPyg:30000}],note:"Demo"},NOW);
 assert.equal(s.inventory[0].stockOnHand,stock);
 assert.throws(()=>receivePurchase(s,{operationId:"premature",purchaseId:s.purchases[0].id,actor:"Depósito"},NOW),{code:"INVALID_PURCHASE_STATUS"});
 s=orderPurchase(s,{operationId:"ordered-1",purchaseId:s.purchases[0].id},NOW);
 s=receivePurchase(s,{operationId:"received-1",purchaseId:s.purchases[0].id,actor:"Depósito"},NOW);
 assert.equal(s.inventory[0].stockOnHand,stock+4);
 assert.equal(s.inventoryMovements.filter(m=>m.referenceId===s.purchases[0].id&&m.kind==="receipt").length,1);
 assert.equal(s.cashSessions.length,0);
 assert.throws(()=>receivePurchase(s,{operationId:"received-2",purchaseId:s.purchases[0].id,actor:"Depósito"},NOW),{code:"INVALID_PURCHASE_STATUS"});
 assert.throws(()=>receivePurchase(s,{operationId:"received-1",purchaseId:s.purchases[0].id,actor:"Depósito"},NOW),{code:"DUPLICATE_OPERATION"});
});
test("no se puede cancelar compra recibida ni recibir una cancelada",()=>{
 let s=setup();s=createPurchase(s,{operationId:"p1",supplierId:s.suppliers[0].id,lines:[{productId:"p1",quantity:2,unitCostPyg:0}],note:""},NOW);
 s=cancelPurchase(s,{operationId:"cancel",purchaseId:s.purchases[0].id},NOW);
 assert.throws(()=>receivePurchase(s,{operationId:"receive",purchaseId:s.purchases[0].id,actor:"Admin"},NOW),{code:"INVALID_PURCHASE_STATUS"});
});
test("migra v2 a v3 conservando inventario y operaciones",()=>{
 const fresh=setup();const {suppliers,purchases,...rest}=fresh;const {supplier,purchase,customer,...counters}=rest.counters;
 const legacy={...rest,schemaVersion:2,counters};
 const storage={getItem:(key)=>key===DEMO_STORAGE_KEY?JSON.stringify(legacy):null,setItem:()=>{},removeItem:()=>{}};
 const loaded=loadDemoState(storage,NOW,catalog);
 assert.equal(loaded.source,"migrated");assert.equal(loaded.state.schemaVersion,3);
 assert.deepEqual(loaded.state.inventory,legacy.inventory);
 assert.deepEqual(loaded.state.orders,legacy.orders);
 assert.equal(loaded.state.suppliers.length,0);
});
