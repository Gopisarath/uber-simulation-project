document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You're not logged in. Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const payload = JSON.parse(atob(token.split(".")[1]));
  const customerId = payload.customerId;

  fetchBillsForCustomer(customerId);

  const form = document.getElementById("predictForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      await predictFare(token);
    });
  }
});

// 🔄 Predict Fare from Form
async function predictFare(token) {
  const pickupLat = parseFloat(document.getElementById("pickupLat").value);
  const pickupLon = parseFloat(document.getElementById("pickupLon").value);
  const dropoffLat = parseFloat(document.getElementById("dropoffLat").value);
  const dropoffLon = parseFloat(document.getElementById("dropoffLon").value);
  const passengers = parseInt(document.getElementById("passengerCount").value);
  const pickupTime = document.getElementById("pickupTime").value;
  const output = document.getElementById("fareResult");

  const payload = {
    pickup_latitude: pickupLat,
    pickup_longitude: pickupLon,
    dropoff_latitude: dropoffLat,
    dropoff_longitude: dropoffLon,
    passenger_count: passengers,
    pickup_time: pickupTime
  };

  try {
    const res = await fetch("http://localhost:5050/predict", {

      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.fare_amount) {
      output.innerHTML = `<div class="alert alert-success">💲 Estimated Fare: <strong>$${data.fare_amount}</strong></div>`;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Error: ${data.detail || "Prediction failed."}</div>`;
    }
  } catch (err) {
    console.error("Fare prediction error:", err);
    output.innerHTML = `<div class="alert alert-danger">Failed to contact prediction service</div>`;
  }
}

// 📄 Fetch bills for current customer
async function fetchBillsForCustomer(customerId) {
  const token = localStorage.getItem("token");
  const output = document.getElementById("billResult");
  output.innerHTML = "";

  try {
    const res = await fetch(`http://localhost:3000/api/admin/bills/customer/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const bills = await res.json();

    if (res.ok && bills.length > 0) {
      let html = `<h5 class="mb-3">Your Bills</h5>`;
      bills.forEach(bill => {
        html += `
          <div class="card mb-3 p-3 shadow">
            <p><strong>Bill ID:</strong> ${bill.billingId}</p>
            <p><strong>Ride ID:</strong> ${bill.rideId}</p>
            <p><strong>Pickup:</strong> ${bill.sourceLocation?.address}</p>
            <p><strong>Dropoff:</strong> ${bill.destinationLocation?.address}</p>
            <p><strong>Fare:</strong> $${bill.actualPrice?.toFixed(2)}</p>
            <p><strong>Status:</strong> ${bill.status}</p>
            <p><strong>Payment:</strong> ${bill.paymentMethod}</p>
            <p><strong>Date:</strong> ${new Date(bill.date).toLocaleString()}</p>
            ${
              bill.status === "pending"
                ? `<button class="btn btn-success btn-sm mt-2" onclick="payBill('${bill.billingId}')">Pay Now</button>`
                : ""
            }
          </div>
        `;
      });
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-warning">No bills found for your account.</div>`;
    }
  } catch (err) {
    console.error("Bill fetch error:", err);
    output.innerHTML = `<div class="alert alert-danger">Failed to load bills. Check console.</div>`;
  }
}


async function payBill(billingId) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/api/admin/bills/pay/${billingId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    alert(result.message || result.error || "Payment processed");

    fetchBillsForCustomer(JSON.parse(atob(token.split(".")[1])).customerId);
  } catch (err) {
    console.error("Payment error:", err);
    alert("Error processing payment.");
  }
}

