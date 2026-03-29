
  if (msg) {
    msg.textContent = `✅ Sent: ${drinkName}${table ? ` (Table ${table})` : ""}`;
    setTimeout(() => (msg.textContent = ""), 2000);
  }
}

// 4) If this page has #ordersList, we’re on the bar screen → show orders
async function loadOrdersOnce() {
  const list = document.getElementById("ordersList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<p><b>❌ Could not load orders:</b> " + error.message + "</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p><b>No orders yet.</b></p>";
    return;
  }

  list.innerHTML = data
    .map(
      (o) => `
      <div class="order-card">
        <div>
          <div class="order-drink">${o.drink}</div>
          <div class="order-meta">
            ${o.table ? `Table ${o.table}` : "No table"} • ${o.time || ""}
          </div>
        </div>
      </div>`
    )
    .join("");
}

// 5) Real-time updates (when new rows are inserted)
// Important: this requires “Realtime” enabled for the table in Supabase.
// Supabase docs show listening to database changes using 'postgres_changes'. [5](https://supabase.com/docs/guides/realtime/postgres-changes)
function startRealtimeOrders() {
  const list = document.getElementById("ordersList");
  if (!list) return;

  supabaseClient
    .channel("orders-inserts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      () => loadOrdersOnce()
    )
    .subscribe();

  loadOrdersOnce();
}

startRealtimeOrders();
