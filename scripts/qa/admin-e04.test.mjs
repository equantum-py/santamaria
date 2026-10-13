import assert from "node:assert/strict";
import test from "node:test";
import { createOrder, updateOrderStatus } from "../../lib/admin/domain.ts";
import { createInitialDemoState } from "../../lib/admin/demo-state.ts";
import { completeDelivery, prepareWarehouseOrder } from "../../lib/admin/fulfillment.ts";
const now = "2026-10-12T12:00:00.000Z";
const catalog = [{ id:"p1", sku:"SM-001", name:"Cemento demo", categoryId:"construccion", categoryName:"Construcción", pricePyg:50000, saleUnit:"bolsa", availability:"disponible", active:true, fictitiousPrice:true }];
function order(mode) {
 let state = createInitialDemoState(now,catalog);
 const result = createOrder(state,{operationId:"e04-order-"+mode,source:"counter",items:[{productId:"p1",quantity:2}],fulfillmentMode:mode},catalog,now);
 state = updateOrderStatus(result.state,{orderId:result.order.id,status:"confirmed",changedBy:"Ventas"},now);
 return {state,id:result.order.id};
}
test("preparación exige cantidades exactas y no descuenta stock",()=>{
 const {state,id}=order("pickup");
 const before=JSON.stringify(state);
 assert.throws(()=>prepareWarehouseOrder(state,{orderId:id,actor:"Rubén",quantities:{p1:1}},now),{code:"WAREHOUSE_QUANTITY_MISMATCH"});
 assert.equal(JSON.stringify(state),before);
 const ready=prepareWarehouseOrder(state,{orderId:id,actor:"Rubén",quantities:{p1:2}},now);
 assert.equal(ready.orders[0].status,"ready");
 assert.equal(ready.inventory[0].stockReserved,2);
 assert.equal(ready.inventory[0].stockOnHand,state.inventory[0].stockOnHand);
 assert.throws(()=>prepareWarehouseOrder(ready,{orderId:id,actor:"Rubén",quantities:{p1:2}},now),{code:"INVALID_WAREHOUSE_ORDER"});
});
test("retiro entrega una vez, descuenta y libera reserva",()=>{
 const {state,id}=order("pickup");
 assert.throws(()=>completeDelivery(state,{orderId:id,actor:"Rubén",action:"deliver",note:"Retiró"},now),{code:"INVALID_DELIVERY"});
 const ready=prepareWarehouseOrder(state,{orderId:id,actor:"Rubén",quantities:{p1:2}},now);
 const delivered=completeDelivery(ready,{orderId:id,actor:"Rubén",action:"deliver",note:"Retiró cliente demo"},now);
 assert.equal(delivered.inventory[0].stockOnHand,state.inventory[0].stockOnHand-2);
 assert.equal(delivered.inventory[0].stockReserved,0);
 assert.equal(delivered.inventoryMovements.filter(x=>x.kind==="fulfillment").length,1);
 assert.throws(()=>completeDelivery(delivered,{orderId:id,actor:"Rubén",action:"deliver",note:"Otra vez"},now),{code:"INVALID_DELIVERY"});
});
test("envío requiere despacho y constancia antes de entrega",()=>{
 const {state,id}=order("delivery");
 const ready=prepareWarehouseOrder(state,{orderId:id,actor:"Rubén",quantities:{p1:2}},now);
 assert.throws(()=>completeDelivery(ready,{orderId:id,actor:"Rubén",action:"deliver",note:"Entregado"},now),{code:"INVALID_DELIVERY"});
 assert.throws(()=>completeDelivery(ready,{orderId:id,actor:"Rubén",action:"dispatch",note:" "},now),{code:"DELIVERY_DETAILS_REQUIRED"});
 const dispatched=completeDelivery(ready,{orderId:id,actor:"Rubén",action:"dispatch",note:"Sale a reparto"},now);
 assert.equal(dispatched.inventory[0].stockReserved,2);
 const delivered=completeDelivery(dispatched,{orderId:id,actor:"Rubén",action:"deliver",note:"Recibido"},now);
 assert.equal(delivered.inventory[0].stockReserved,0);
 assert.equal(delivered.inventoryMovements.filter(x=>x.kind==="fulfillment").length,1);
});
