/*******************************
 * app.js — Drinks Ordering
 * Uses Firebase Firestore for real-time cross-device orders
 *
 * You MUST:
 * 1) Create a Firebase project
 * 2) Enable Firestore Database
 * 3) Replace firebaseConfig below with your config
 * 4) Include Firebase scripts in your HTML (shown below)
 *******************************/

// 1) ✅ PASTE YOUR FIREBASE CONFIG HERE (from Firebase Console)
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

// 2) Initialize Firebase + Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3) Collection where orders are stored
const ORDERS_COLLECTION = "drinkOrders";

// 4) Utility: safe text (prevents weird HTML injection in order list)
function escapeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Called by menu buttons:
 * orderDrink("Guinness")
 */
async function orderDrink(drinkName) {
  try {
    // Optional: allow table number if an input exists
    const tableInput = document.getElementById("tableNumber");
    const tableNumber = tableInput ? tableInput.value.trim() : "";

    // Create an order document
    await db.collection(ORDERS_COLLECTION).add({
      drink: drinkName,
      table: tableNumber || null,
      status: "new",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // User feedback
    const msg = document.getElementById("message");
    if (msg) {
      msg.textContent = `✅ Sent: ${drinkName}${tableNumber ? ` (Table ${tableNumber})` : ""}`;
      setTimeout(() => (msg.textContent = ""), 2000);
    }
  } catch (err) {
    alert("Order failed: " + err.message);
  }
}

/**
 * Orders screen:
 * If the page contains an element with id="orders",
 * we live-update it with new orders from Firestore.
 */
function startOrdersScreen() {
  const ordersEl = document.getElementById("orders");
  if (!ordersEl) return; // Not on the orders page

  db.collection(ORDERS_COLLECTION)
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      if (snapshot.empty) {
        ordersEl.innerHTML = "<p>No orders yet.</p>";
        return;
      }

      let html = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const drink = escapeText(data.drink || "");
        const table = data.table ? escapeText(data.table) : "";
        const status = escapeText(data.status || "new");

        html += `
          <div class="order-card">
            <div class="order-main">
              <div class="order-drink">${drink}</div>
              <div class="order-meta">
                ${table ? `Table ${table}` : "No table"}
                • <span class="order-status">${status}</span>
              </div>
            </div>

            <div class="order-actions">
              <button class="small" onclick="markDone('${doc.id}')">Done</button>
              <button class="small danger" onclick="deleteOrder('${doc.id}')">Delete</button>
            </div>
          </div>
        `;
      });

      ordersEl.innerHTML = html;
    });
}

async function markDone(orderId) {
  await db.collection(ORDERS_COLLECTION).doc(orderId).update({
    status: "done"
  });
}

async function deleteOrder(orderId) {
  await db.collection(ORDERS_COLLECTION).doc(orderId).delete();
}

// Auto-start if on orders screen
startOrdersScreen();