document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("predictForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      await predictFare();
    });
  }
});

// 🔄 Predict Fare from Embedded Form
async function predictFare() {
  const pickupLat = parseFloat(document.getElementById("pickupLat").value);
  const pickupLon = parseFloat(document.getElementById("pickupLon").value);
  const dropoffLat = parseFloat(document.getElementById("dropoffLat").value);
  const dropoffLon = parseFloat(document.getElementById("dropoffLon").value);
  const passengers = parseInt(document.getElementById("passengerCount").value);
  const pickupTime = document.getElementById("pickupTime").value;
  const output = document.getElementById("fareResult");
  const token = localStorage.getItem("token");

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
