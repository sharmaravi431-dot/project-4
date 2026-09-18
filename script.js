"use strict";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(n);
const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const dateLabel = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", {day:"numeric", month:"short"});
const uid = prefix => prefix + "-" + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
const initials = name => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();

const paths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  bookings: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 5h3"/>',
  rooms: '<path d="M3 18v3m18-3v3M3 12h18v6H3zM5 12V5h14v7M8 9h3m2 0h3"/>',
  guests: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  housekeeping: '<path d="m15 3-5 9m-4 0 8 4-3 6-9-5zM18 8h4m-2-2v4"/>',
  billing: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
  dining: '<path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18m11 0V3c-5 4-5 10 0 10"/>',
  inventory: '<path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4m-9 4v11M7 5l9 4"/>',
  staff: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M9 5V3h6v2m-7 12a4 4 0 0 1 8 0"/><circle cx="12" cy="11" r="2"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.dashboard}</svg>`;

function seed() {
  const rooms = Array.from({length:12}, (_,i) => ({
    id: String(101+i), type: i > 8 ? "Presidential suite" : i > 4 ? "Executive suite" : "Deluxe room",
    rate: i > 8 ? 14500 : i > 4 ? 8500 : 4800,
    status: i < 4 ? "Occupied" : i === 7 ? "Dirty" : i === 11 ? "Maintenance" : "Available",
    capacity: i > 8 ? 4 : 2
  }));
  const bookings = [
    {id:"BK-2401",name:"Olivia Bennett",email:"olivia@example.test",room:"101",in:day(-2),out:day(1),status:"Checked in",paid:true},
    {id:"BK-2402",name:"Arjun Mehta",email:"arjun@example.test",room:"102",in:day(-1),out:day(),status:"Checked in",paid:false},
    {id:"BK-2403",name:"Emma Wilson",email:"emma@example.test",room:"103",in:day(-3),out:day(2),status:"Checked in",paid:true},
    {id:"BK-2404",name:"Noah Williams",email:"noah@example.test",room:"104",in:day(-1),out:day(2),status:"Checked in",paid:false},
    {id:"BK-2405",name:"Priya Sharma",email:"priya@example.test",room:"106",in:day(),out:day(3),status:"Confirmed",paid:false},
    {id:"BK-2406",name:"Liam Anderson",email:"liam@example.test",room:"110",in:day(1),out:day(4),status:"Confirmed",paid:true}
  ].map(b=>({...b, amount: nights(b.in,b.out)*rooms.find(r=>r.id===b.room).rate}));
  return {
    version:1, hotel:"The Grand Aura", bookings, rooms,
    tasks:[{id:"HK-1",room:"108",assignee:"Maya Patel",priority:"High",status:"Pending"}],
    inventory:[
      {id:"I1",name:"Bath towels",category:"Housekeeping",stock:84,min:30},
      {id:"I2",name:"Shampoo bottles",category:"Amenities",stock:18,min:25},
      {id:"I3",name:"Coffee capsules",category:"Food & beverage",stock:120,min:40},
      {id:"I4",name:"Bed linen sets",category:"Housekeeping",stock:22,min:25}
    ],
    staff:[
      {id:"S1",name:"Maya Patel",role:"Housekeeping",shift:"07:00 – 15:00",status:"On duty"},
      {id:"S2",name:"Daniel Kim",role:"Front desk",shift:"08:00 – 16:00",status:"On duty"},
      {id:"S3",name:"Sofia Rossi",role:"Restaurant",shift:"12:00 – 20:00",status:"Off duty"},
      {id:"S4",name:"James Carter",role:"Maintenance",shift:"09:00 – 17:00",status:"On duty"}
    ],
    orders:[
      {id:"ORD-101",room:"101",item:"Continental breakfast",qty:2,total:1300,status:"Preparing"},
      {id:"ORD-102",room:"103",item:"Pasta primavera",qty:1,total:850,status:"Delivered"}
    ],
    activity:[{text:"Your demo workspace is ready",time:new Date().toISOString()}]
  };
}

const STORAGE_KEY = "aura-hotel-demo-v1";
let state;
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  state = stored?.version === 1 &&
    ["rooms","bookings","tasks","inventory","staff","orders","activity"].every(k=>Array.isArray(stored[k]))
    ? stored : seed();
} catch { state = seed(); }

let currentPage = "dashboard";
let filterText = "";
let statusFilter = "All";
let toastTimer;

const pages = [
  ["dashboard","Overview","A little clarity. A lot of exceptional hospitality."],
  ["bookings","Reservations","Every arrival, departure, and stay in one place."],
  ["rooms","Rooms & suites","Beautiful spaces. Effortlessly managed."],
  ["guests","Guest directory","Great hospitality starts with knowing your guests."],
  ["housekeeping","Housekeeping","Keep every room ready for its next story."],
  ["billing","Billing & payments","A clear picture of your reservation payments."],
  ["dining","Restaurant","From your kitchen to their doorstep."],
  ["inventory","Inventory","The essentials, always accounted for."],
  ["staff","Team management","The people behind every exceptional stay."],
  ["settings","Settings","Make this workspace feel like your property."]
];

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>$("#toast").classList.add("hidden"), 3500);
}
function save(message) {
  if (message) state.activity.unshift({text:message,time:new Date().toISOString()});
  state.activity = state.activity.slice(0,20);
  let persisted = true;
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { persisted = false; }
  render();
  toast(persisted ? message || "Changes saved" : "Updated for this session. Browser storage is unavailable.");
}
function badge(status) {
  const color = ["Available","Checked in","Paid","Ready","Delivered","On duty","Healthy"].includes(status) ? "green"
    : ["Dirty","Pending","Unpaid","Low stock","Preparing","High"].includes(status) ? "orange"
    : ["Maintenance","Off duty"].includes(status) ? "red" : "purple";
  return `<span class="badge ${color}"><span class="dot"></span>${escapeHTML(status)}</span>`;
}
const person = (name,sub="") => `<div class="person"><div class="avatar">${escapeHTML(initials(name))}</div><div>${escapeHTML(name)}${sub?`<small>${escapeHTML(sub)}</small>`:""}</div></div>`;
function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.join(""):`<tr><td colspan="${headers.length}" class="empty">No records found.</td></tr>`}</tbody></table></div>`;
}
const tr = cells => `<tr>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`;
const action = (label,kind,id,extra="") => `<button class="btn sm ${extra}" data-action="${kind}" data-id="${escapeHTML(id)}">${label}</button>`;
const match = (...values) => values.join(" ").toLowerCase().includes(filterText.toLowerCase());
const filteredStatus = s => statusFilter === "All" || statusFilter === s;
function toolbar(placeholder, statuses = [], extra = "") {
  return `<div class="toolbar"><input id="search" aria-label="${escapeHTML(placeholder)}" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(filterText)}">
    ${statuses.length?`<select id="statusFilter" aria-label="Filter by status"><option>All</option>${statuses.map(s=>`<option ${s===statusFilter?"selected":""}>${s}</option>`).join("")}</select>`:""}${extra}</div>`;
}
function kpi(label,value,note,name) {
  return `<div class="kpi"><div class="kpi-top">${label}<span class="kpi-icon">${icon(name)}</span></div><div class="kpi-value">${value}</div><div class="kpi-note">${note}</div></div>`;
}
function bookingRows(bookings,compact=false) {
  return bookings.map(b=>tr([
    person(b.name,b.id),
    `<span class="muted">#</span> ${b.room}`,
    `${dateLabel(b.in)} <span class="muted">→</span> ${dateLabel(b.out)}`,
    badge(b.status),
    ...(compact?[]:[money(b.amount),b.status==="Confirmed"
      ?action("Check in","checkin",b.id)
      :b.status==="Checked in"?action("Check out","checkout",b.id):'<span class="muted">Completed</span>'])
  ]));
}
function dashboard() {
  const occupied = state.rooms.filter(r=>r.status==="Occupied").length;
  const ready = state.rooms.filter(r=>r.status==="Available").length;
  const collected = state.bookings.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const arrivals = state.bookings.filter(b=>b.in===day() && b.status==="Confirmed").length;
  return `
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow">THE ART OF A GREAT STAY</div>
        <h2>More than a stay.<br>A seamless experience.</h2>
        <p>You have ${arrivals} expected arrival${arrivals!==1?"s":""} today and ${ready} rooms ready to welcome your guests.</p>
        <button class="btn" data-page="bookings">Manage reservations ${icon("arrow")}</button>
      </div>
      <div class="scene" aria-hidden="true">
        <div class="scene-floor"></div><div class="building"><div class="building-side"></div>
          <div class="building-face">${"<span></span>".repeat(12)}</div><div class="hotel-sign">AURA</div>
        </div><div class="float-tag">✦ A better kind of hospitality</div>
      </div>
    </section>
    <div class="kpi-grid">
      ${kpi("Room occupancy",Math.round(occupied/state.rooms.length*100)+"%",`${occupied} of ${state.rooms.length} rooms occupied`,"rooms")}
      ${kpi("Reservations",state.bookings.length,"All saved reservations","bookings")}
      ${kpi("Recorded payments",money(collected),"Room charges · demo payments","billing")}
      ${kpi("Available rooms",ready,"Clean and ready for check-in","check")}
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><h2>Recent reservations</h2><button class="btn sm" data-page="bookings">View all ↗</button></div>
        ${table(["Guest","Room","Stay","Status"],bookingRows(state.bookings.slice(-5).reverse(),true))}
      </section>
      <section class="panel"><div class="panel-head"><h2>Room snapshot</h2><span class="muted small">${state.rooms.length} rooms</span></div>
        <div class="mini-rooms">${state.rooms.map(r=>`<div class="mini-room"><strong>${r.id}</strong><small style="color:${r.status==="Available"?"var(--green)":r.status==="Occupied"?"var(--purple)":"var(--orange)"}">${r.status}</small></div>`).join("")}</div>
      </section>
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><h2>Today's departures</h2><span class="badge orange">Front desk</span></div>
        ${table(["Guest","Room","Payment","Action"],state.bookings.filter(b=>b.out<=day()&&b.status==="Checked in").map(b=>tr([person(b.name),b.room,badge(b.paid?"Paid":"Unpaid"),action("Check out","checkout",b.id)])))}
      </section>
      <section class="panel"><div class="panel-head"><h2>Activity feed</h2><span class="muted small">Latest updates</span></div>
        ${state.activity.slice(0,3).map(a=>`<div class="activity-item"><span class="activity-icon">${icon("check")}</span><div><p>${escapeHTML(a.text)}</p><small class="muted">${new Date(a.time).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</small></div></div>`).join("")}
      </section>
    </div>`;
}
function bookingsPage() {
  const list=state.bookings.filter(b=>match(b.name,b.id,b.room)&&filteredStatus(b.status));
  return `<section class="panel">${toolbar("Search guest, booking or room…",["Confirmed","Checked in","Checked out"],'<button class="btn" data-action="export">Export CSV ↓</button>')}
    ${table(["Guest","Room","Stay dates","Status","Room total","Action"],bookingRows(list.slice().reverse()))}</section>`;
}
function roomsPage() {
  const list=state.rooms.filter(r=>match(r.id,r.type)&&filteredStatus(r.status));
  return `${toolbar("Search rooms…",["Available","Occupied","Dirty","Maintenance"])}
    <div class="room-grid">${list.map(r=>`<article class="room-card">
      <div class="room-art">${badge(r.status)}</div><div class="room-info">
      <div class="flex between"><h3>Room ${r.id}</h3><span class="price">${money(r.rate)}</span></div>
      <div class="flex between muted small"><span>${r.type}</span><span>per night</span></div>
      <div class="room-footer"><span class="muted small">${r.capacity} guests · Wi-Fi · Ensuite</span>
      ${r.status==="Available"?action("Book room","bookroom",r.id):r.status==="Dirty"?action("View task","housekeeping",r.id):r.status==="Maintenance"?action("Mark ready","ready",r.id):badge("Checked in")}</div>
      ${r.status==="Available"?`<div style="margin-top:12px">${action("Set maintenance","maintenance",r.id)}</div>`:""}
      </div></article>`).join("")||'<div class="empty">No rooms found.</div>'}</div>`;
}
function guestsPage() {
  const guests = new Map();
  state.bookings.forEach(b=>{
    const key=b.email.toLowerCase();
    const g=guests.get(key)||{name:b.name,email:b.email,stays:0,total:0};
    g.stays++; g.total+=b.amount; guests.set(key,g);
  });
  return `<section class="panel">${toolbar("Search guest name or email…")}
    ${table(["Guest","Email","Reservations","Booked room value"],[...guests.values()].filter(g=>match(g.name,g.email)).map(g=>tr([person(g.name),escapeHTML(g.email),g.stays,money(g.total)])))}</section>`;
}
function housekeepingPage() {
  return `<section class="panel">${toolbar("Search room or team member…",["Pending","In progress","Ready"])}
    ${table(["Task","Room","Assigned to","Priority","Status","Action"],state.tasks.filter(t=>match(t.room,t.assignee)&&filteredStatus(t.status)).map(t=>tr([
      escapeHTML(t.id),t.room,person(t.assignee),badge(t.priority),badge(t.status),
      t.status==="Ready"?'<span class="muted">Completed</span>':action(t.status==="Pending"?"Start cleaning":"Mark ready","task",t.id)
    ])))}</section>`;
}
function billingPage() {
  const paid=state.bookings.filter(b=>b.paid).reduce((s,b)=>s+b.amount,0);
  const unpaid=state.bookings.filter(b=>!b.paid).reduce((s,b)=>s+b.amount,0);
  return `<div class="kpi-grid">
    ${kpi("Recorded payments",money(paid),"Demo room payments","billing")}
    ${kpi("Outstanding",money(unpaid),"Unpaid reservation balances","bookings")}
    ${kpi("Payment records",state.bookings.length,"One per reservation","inventory")}
    ${kpi("Currency","INR","Taxes and restaurant charges excluded","settings")}
    </div><section class="panel">${toolbar("Search guest or reservation…",["Paid","Unpaid"])}
    ${table(["Reservation","Guest","Room charge","Payment","Action"],state.bookings.filter(b=>match(b.id,b.name)&&filteredStatus(b.paid?"Paid":"Unpaid")).map(b=>tr([
      escapeHTML(b.id),person(b.name),money(b.amount),badge(b.paid?"Paid":"Unpaid"),
      b.paid?'<span class="muted">Payment recorded</span>':action("Record demo payment","pay",b.id)
    ])))}</section>`;
}
function diningPage() {
  return `<section class="panel">${toolbar("Search room or menu item…",["Preparing","Delivered"],'<button class="btn primary" data-action="neworder">＋ New order</button>')}
    ${table(["Order","Room","Item","Quantity","Total","Status","Action"],state.orders.filter(o=>match(o.room,o.item)&&filteredStatus(o.status)).map(o=>tr([
      escapeHTML(o.id),o.room,escapeHTML(o.item),o.qty,money(o.total),badge(o.status),
      o.status==="Preparing"?action("Mark delivered","deliver",o.id):'<span class="muted">Completed</span>'
    ])))}</section>`;
}
function inventoryPage() {
  return `<section class="panel">${toolbar("Search inventory…")}
    ${table(["Item","Department","In stock","Minimum","Status","Action"],state.inventory.filter(i=>match(i.name,i.category)).map(i=>tr([
      escapeHTML(i.name),escapeHTML(i.category),i.stock,i.min,badge(i.stock<i.min?"Low stock":"Healthy"),action("Restock +10","restock",i.id)
    ])))}</section>`;
}
function staffPage() {
  return `<section class="panel">${toolbar("Search team members…",["On duty","Off duty"])}
    ${table(["Team member","Department","Shift","Status","Action"],state.staff.filter(s=>match(s.name,s.role)&&filteredStatus(s.status)).map(s=>tr([
      person(s.name),s.role,s.shift,badge(s.status),action(s.status==="On duty"?"End shift":"Start shift","shift",s.id)
    ])))}</section>`;
}
function settingsPage() {
  return `<section class="panel settings-box"><h2>Property preferences</h2>
    <p class="muted small">Settings and operational records are saved locally on this device.</p>
    <form id="settingsForm" class="stack">
      <div class="field"><label for="hotelName">Property name</label><input id="hotelName" name="hotelName" maxlength="70" required value="${escapeHTML(state.hotel)}"></div>
      <div><button class="btn primary" type="submit">Save preferences</button></div>
    </form>
    <hr style="border:0;border-top:1px solid var(--stroke);margin:28px 0">
    <h3>Demo workspace</h3><p class="muted small">Reset removes your local changes and restores the sample hotel.</p>
    <button class="btn danger" data-action="reset">Reset demo data</button>
    <p class="muted small" style="margin:24px 0 0;line-height:1.8">This prototype does not provide authentication, secure guest-data storage, tax invoices, channel synchronization, or payment processing. Do not enter real personal or payment information.</p>
  </section>`;
}
const renderers = {dashboard,bookings:bookingsPage,rooms:roomsPage,guests:guestsPage,housekeeping:housekeepingPage,billing:billingPage,dining:diningPage,inventory:inventoryPage,staff:staffPage,settings:settingsPage};

function render() {
  const page=pages.find(p=>p[0]===currentPage);
  $("#pageTitle").textContent=page[1];
  $("#pageDescription").textContent=page[2];
  $("#propertyName").textContent=state.hotel;
  $("#navigation").innerHTML=pages.map(([id,label])=>`<button class="nav-item ${id===currentPage?"active":""}" data-page="${id}" ${id===currentPage?'aria-current="page"':""}>${icon(id)}${label}</button>`).join("");
  $("#view").innerHTML=renderers[currentPage]();
}
function closeMenu() {
  document.body.classList.remove("menu-open");
  $("#menuToggle").setAttribute("aria-expanded","false");
}
function navigate(page) {
  if (!renderers[page]) return;
  currentPage=page; filterText=""; statusFilter="All"; closeMenu(); render();
}
function openModal(title,body,onSubmit) {
  $("#modalTitle").textContent=title;
  $("#modalForm").innerHTML=body+`<p id="formError" class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="btn" id="cancelModal">Cancel</button><button class="btn primary" type="submit">Save</button></div>`;
  $("#cancelModal").onclick=()=>$("#modal").close();
  $("#modalForm").onsubmit=e=>{
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  };
  $("#modal").showModal();
}
const fail = message => {$("#formError").textContent=message;};

function bookingModal(selectedRoom="") {
  const options=state.rooms.filter(r=>r.status!=="Maintenance");
  openModal("Create reservation",`
    <div class="form-grid">
      <div class="field"><label for="guestName">Guest name</label><input id="guestName" name="name" required maxlength="70" placeholder="e.g. Taylor Smith"></div>
      <div class="field"><label for="guestEmail">Demo email</label><input id="guestEmail" type="email" name="email" required maxlength="120" placeholder="guest@example.test"></div>
      <div class="field"><label for="checkIn">Check-in date</label><input id="checkIn" type="date" name="in" min="${day()}" value="${day()}" required></div>
      <div class="field"><label for="checkOut">Check-out date</label><input id="checkOut" type="date" name="out" min="${day(1)}" value="${day(1)}" required></div>
      <div class="field full"><label for="roomSelect">Room · availability checked on save</label><select id="roomSelect" name="room" required>
        ${options.map(r=>`<option value="${r.id}" ${r.id===selectedRoom?"selected":""}>${r.id} · ${r.type} · ${money(r.rate)}/night</option>`).join("")}
      </select></div>
      <div class="full muted small">Room-only pricing. Taxes, extras, and restaurant orders are not included.</div>
    </div>`,data=>{
      const b=Object.fromEntries(data);
      b.name=b.name.trim(); b.email=b.email.trim();
      if (!b.name) return fail("Enter a guest name.");
      if (b.in<day() || b.out<=b.in) return fail("Choose a valid stay with check-out after check-in.");
      const room=state.rooms.find(r=>r.id===b.room);
      if (!room || room.status==="Maintenance") return fail("This room is unavailable.");
      const overlaps=state.bookings.some(x=>x.room===b.room&&x.status!=="Checked out"&&b.in<x.out&&b.out>x.in);
      if (overlaps) return fail("This room already has an overlapping reservation. Choose another room or dates.");
      state.bookings.push({...b,id:uid("BK"),status:"Confirmed",paid:false,amount:nights(b.in,b.out)*room.rate});
      $("#modal").close();
      save(`Reservation created for ${b.name}`);
    });
  $("#checkIn").addEventListener("change",e=>{
    const d=new Date(e.target.value+"T12:00:00");
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate()+1);
    const min=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    $("#checkOut").min=min;
    if ($("#checkOut").value<min) $("#checkOut").value=min;
  });
}

const menu = [
  {name:"Continental breakfast",price:650},
  {name:"Pasta primavera",price:850},
  {name:"Club sandwich",price:550},
  {name:"Fresh fruit platter",price:420}
];
function orderModal() {
  const occupied=state.rooms.filter(r=>r.status==="Occupied");
  if (!occupied.length) return toast("Check in a guest before creating a room-service order.");
  openModal("New room-service order",`<div class="form-grid">
    <div class="field"><label for="orderRoom">Occupied room</label><select id="orderRoom" name="room">${occupied.map(r=>`<option>${r.id}</option>`).join("")}</select></div>
    <div class="field"><label for="orderQty">Quantity</label><input id="orderQty" name="qty" type="number" min="1" max="20" value="1" required></div>
    <div class="field full"><label for="orderItem">Menu item</label><select id="orderItem" name="item">${menu.map((m,i)=>`<option value="${i}">${m.name} · ${money(m.price)}</option>`).join("")}</select></div>
    <p class="full muted small">Restaurant totals are tracked separately from room payments in this demo.</p>
    </div>`,data=>{
      const item=menu[Number(data.get("item"))], qty=Number(data.get("qty"));
      const room=String(data.get("room"));
      if (!item||!Number.isInteger(qty)||qty<1||qty>20||!occupied.some(r=>r.id===room)) return fail("Choose a valid room, menu item, and quantity.");
      state.orders.unshift({id:uid("ORD"),room,item:item.name,qty,total:item.price*qty,status:"Preparing"});
      $("#modal").close(); save(`Room-service order created for room ${room}`);
    });
}

function exportBookings() {
  // Neutralize spreadsheet formulas when exporting user-entered values.
  const csvCell=value=>{
    let text=String(value??"");
    if (/^[\s]*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text)) text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  };
  const rows=[
    ["Booking","Guest","Email","Room","Check-in","Check-out","Status","Room total INR","Payment"],
    ...state.bookings.filter(b=>match(b.name,b.id,b.room)&&filteredStatus(b.status)).map(b=>
      [b.id,b.name,b.email,b.room,b.in,b.out,b.status,b.amount,b.paid?"Paid":"Unpaid"])
  ];
  const blob=new Blob(["\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob), link=document.createElement("a");
  link.href=url; link.download="aura-reservations.csv"; document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast("Filtered reservations exported");
}
function handleAction(kind,id) {
  const booking=state.bookings.find(b=>b.id===id);
  if(kind==="bookroom") return bookingModal(id);
  if(kind==="housekeeping") return navigate("housekeeping");
  if(kind==="neworder") return orderModal();
  if(kind==="export") return exportBookings();
  if(kind==="checkin"&&booking?.status==="Confirmed") {
    const room=state.rooms.find(r=>r.id===booking.room);
    if(booking.in>day()) return toast("Check-in is available on or after the arrival date.");
    if(booking.out<=day()) return toast("This reservation's stay dates have ended.");
    if(room.status!=="Available") return toast("The room must be vacant and clean before check-in.");
    booking.status="Checked in"; room.status="Occupied";
    return save(`${booking.name} checked in to room ${room.id}`);
  }
  if(kind==="checkout"&&booking?.status==="Checked in") {
    if(!booking.paid) return toast("Record the demo room payment in Billing before checkout.");
    if(state.orders.some(o=>o.room===booking.room&&o.status==="Preparing")) return toast("Complete pending room-service orders before checkout.");
    booking.status="Checked out";
    state.rooms.find(r=>r.id===booking.room).status="Dirty";
    state.tasks.unshift({id:uid("HK"),room:booking.room,assignee:"Maya Patel",priority:"High",status:"Pending"});
    return save(`Room ${booking.room} checked out; cleaning task created`);
  }
  if(kind==="pay"&&booking&&!booking.paid) {
    openModal("Record demo payment",`<p class="muted">Mark the room charge of <strong>${money(booking.amount)}</strong> for ${escapeHTML(booking.name)} as paid?</p><p class="small muted">This only updates the prototype. No money is charged.</p>`,()=>{
      booking.paid=true; $("#modal").close(); save(`Demo payment recorded for ${booking.name}`);
    });
    return;
  }
  if(kind==="task") {
    const t=state.tasks.find(t=>t.id===id); if(!t||t.status==="Ready") return;
    t.status=t.status==="Pending"?"In progress":"Ready";
    if(t.status==="Ready") state.rooms.find(r=>r.id===t.room).status="Available";
    return save(`Room ${t.room}: housekeeping ${t.status.toLowerCase()}`);
  }
  if(kind==="maintenance"||kind==="ready") {
    const room=state.rooms.find(r=>r.id===id); if(!room) return;
    if(kind==="maintenance"&&room.status!=="Available") return;
    if(kind==="maintenance"&&state.bookings.some(b=>b.room===id&&b.status==="Confirmed"&&b.out>day())) return toast("This room has upcoming reservations. Assign maintenance to another room.");
    if(kind==="ready"&&room.status!=="Maintenance") return;
    room.status=kind==="maintenance"?"Maintenance":"Available";
    return save(`Room ${id} marked ${room.status.toLowerCase()}`);
  }
  if(kind==="deliver") {
    const o=state.orders.find(o=>o.id===id); if(!o||o.status==="Delivered") return;
    o.status="Delivered"; return save(`Order delivered to room ${o.room}`);
  }
  if(kind==="restock") {
    const item=state.inventory.find(i=>i.id===id); if(!item) return;
    item.stock+=10; return save(`Added 10 units of ${item.name.toLowerCase()}`);
  }
  if(kind==="shift") {
    const member=state.staff.find(s=>s.id===id); if(!member) return;
    member.status=member.status==="On duty"?"Off duty":"On duty";
    return save(`${member.name} is now ${member.status.toLowerCase()}`);
  }
  if(kind==="reset") {
    openModal("Reset demo workspace",'<p class="muted">This permanently replaces local reservations and changes with fresh sample data. Continue?</p>',()=>{
      state=seed(); $("#modal").close(); save("Demo workspace reset");
    });
  }
}

document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-page]");
  if(nav) return navigate(nav.dataset.page);
  const control=e.target.closest("[data-action]");
  if(control) handleAction(control.dataset.action,control.dataset.id);
});
$("#view").addEventListener("input",e=>{
  if(e.target.id!=="search") return;
  const pos=e.target.selectionStart;
  filterText=e.target.value;
  $("#view").innerHTML=renderers[currentPage]();
  const input=$("#search");
  input.focus(); input.setSelectionRange(pos,pos);
});
$("#view").addEventListener("change",e=>{
  if(e.target.id==="statusFilter") {
    statusFilter=e.target.value;
    $("#view").innerHTML=renderers[currentPage]();
    $("#statusFilter").focus();
  }
});
$("#view").addEventListener("submit",e=>{
  if(e.target.id!=="settingsForm") return;
  e.preventDefault();
  const name=new FormData(e.target).get("hotelName").trim();
  if(!name) return toast("Enter a property name.");
  state.hotel=name; save("Property preferences saved");
});
$("#newBooking").onclick=()=>bookingModal();
$("#closeModal").onclick=()=>$("#modal").close();
$("#menuToggle").onclick=()=>{
  const expanded=document.body.classList.toggle("menu-open");
  $("#menuToggle").setAttribute("aria-expanded",String(expanded));
};
$("#overlay").onclick=closeMenu;
document.addEventListener("keydown",e=>{if(e.key==="Escape") closeMenu();});
render();
