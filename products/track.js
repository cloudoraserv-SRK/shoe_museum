trackBtn.onclick = async () => {
  const { data } = await supabase
    .from("orders")
    .select("status, created_at")
    .eq("id", orderId.value)
    .single();

  status.innerText = data
    ? `Status: ${data.status}`
    : "Order not found";
};
