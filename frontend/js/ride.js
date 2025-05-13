// ✅ Booking logic
document.getElementById("rideForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const customerId = payload.customerId;

  const rideData = {
    customerId,
    pickupLocation: {
      latitude: parseFloat(document.getElementById("pickupLat").value),
      longitude: parseFloat(document.getElementById("pickupLon").value),
      address: "Pickup Address"
    },
    dropoffLocation: {
      latitude: parseFloat(document.getElementById("dropoffLat").value),
      longitude: parseFloat(document.getElementById("dropoffLon").value),
      address: "Dropoff Address"
    }
  };

  const res = await fetch("http://localhost:3000/api/admin/rides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(rideData)
  });

  const result = await res.json();
  document.getElementById("rideResult").innerHTML =
    res.ok
      ? `<div class="alert alert-success">Ride booked successfully!</div>`
      : `<div class="alert alert-danger">Error: ${result.message || result.error}</div>`;
});

// ✅ Ride history with Edit and Cancel buttons
async function viewRides() {
  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const customerId = payload.customerId;

  // ✅ CORRECT HISTORY API ENDPOINT
  const res = await fetch(`http://localhost:3000/api/admin/rides/customer/${customerId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const container = document.getElementById("rideHistory");

  if (res.ok && data.rides?.length > 0) {
    let html = `<h5 class="mt-3">Ride History:</h5>`;
    data.rides.forEach(ride => {
      html += `
        <div class="card p-3 mb-2">
          <p><strong>Date:</strong> ${new Date(ride.dateTime).toLocaleString()}</p>
          <p><strong>Pickup:</strong> ${ride.pickupLocation?.address}</p>
          <p><strong>Dropoff:</strong> ${ride.dropoffLocation?.address}</p>
          <p><strong>Status:</strong> ${ride.status}</p>
          <p><strong>Driver ID:</strong> ${ride.driverId}</p>
          <p><strong>Price:</strong> $${ride.actualPrice?.toFixed(2) || 'N/A'}</p>`;

      if (ride.status === 'requested') {
        html += `
          <button class="btn btn-sm btn-warning mt-2 me-2" onclick='openEditModal(${JSON.stringify(ride)})'>Edit Ride</button>
          <button class="btn btn-sm btn-danger mt-2" onclick='cancelRide("${ride.rideId}")'>Cancel Ride</button>
        `;
      }

      html += `</div>`;
    });

    container.innerHTML = html;
  } else {
    container.innerHTML = `<div class="alert alert-warning">No past rides found.</div>`;
  }
}


// ✅ Open edit modal with prefilled values
function openEditModal(ride) {
  document.getElementById("editRideId").value = ride.rideId;
  document.getElementById("editPickupLat").value = ride.pickupLocation.latitude;
  document.getElementById("editPickupLon").value = ride.pickupLocation.longitude;
  document.getElementById("editDropoffLat").value = ride.dropoffLocation.latitude;
  document.getElementById("editDropoffLon").value = ride.dropoffLocation.longitude;

  const modal = new bootstrap.Modal(document.getElementById("editRideModal"));
  modal.show();
}

// ✅ Submit edited ride (to ride-service → port 3003)
document.getElementById("editRideForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const rideId = document.getElementById("editRideId").value;

  const res = await fetch("http://localhost:3003/api/rides/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      rideId,
      pickupLocation: {
        latitude: parseFloat(document.getElementById("editPickupLat").value),
        longitude: parseFloat(document.getElementById("editPickupLon").value),
        address: "Updated Pickup"
      },
      dropoffLocation: {
        latitude: parseFloat(document.getElementById("editDropoffLat").value),
        longitude: parseFloat(document.getElementById("editDropoffLon").value),
        address: "Updated Dropoff"
      }
    })
  });

  const result = await res.json();
  alert(result.message || result.error || "Ride updated");
  bootstrap.Modal.getInstance(document.getElementById("editRideModal")).hide();
  viewRides();
});

// ✅ Cancel ride (also hits ride-service on port 3003)
async function cancelRide(rideId) {
  const token = localStorage.getItem("token");
  const confirmed = confirm("Are you sure you want to cancel this ride?");
  if (!confirmed) return;

  const res = await fetch("http://localhost:3003/api/rides/cancel", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rideId })
  });

  const result = await res.json();
  alert(result.message || result.error || "Ride cancelled");
  viewRides(); // Refresh
}
