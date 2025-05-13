// Handle Create Driver form
document.getElementById("driverForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const token = localStorage.getItem("token");

  const driverData = {
    driverId: document.getElementById("driverId").value,
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phoneNumber: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zipCode: document.getElementById("zip").value,
    carDetails: document.getElementById("car").value,
    reviews: document.getElementById("reviews").value,
    introductionVideo: document.getElementById("introVideo").value
  };

  try {
    const res = await fetch("http://localhost:3000/api/admin/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(driverData)
    });

    const result = await res.json();

    const output = document.getElementById("driverResult");
    if (res.ok) {
      output.innerHTML = `<div class="alert alert-success">Driver created successfully.</div>`;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Error: ${result.error || 'Something went wrong.'}</div>`;
    }
  } catch (err) {
    console.error("Error:", err);
    document.getElementById("driverResult").innerHTML =
      '<div class="alert alert-danger">Request failed. Check console.</div>';
  }
});


// Search Driver by ID
async function searchDriver() {
  const driverId = document.getElementById("searchDriverId").value;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/api/admin/drivers/${driverId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("driverInfo");

    if (res.ok) {
      output.innerHTML = `
        <div class="card p-3 mt-3">
          <h5>${data.firstName} ${data.lastName}</h5>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phoneNumber}</p>
          <p><strong>Car:</strong> ${data.carDetails}</p>
          <p><strong>City:</strong> ${data.city}, ${data.state} ${data.zipCode}</p>
          <p><strong>Rating:</strong> ${data.rating || '-'}</p>
          <p><strong>Review:</strong> ${data.reviews || '-'}</p>
        </div>
      `;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Driver not found: ${data.error}</div>`;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("driverInfo").innerHTML =
      '<div class="alert alert-danger">Request failed. Check console.</div>';
  }
}

async function updateDriver() {
  const driverId = document.getElementById("updateDriverId").value;
  const token = localStorage.getItem("token");

  const updates = {
    email: document.getElementById("updateEmail").value,
    phoneNumber: document.getElementById("updatePhone").value,
    address: document.getElementById("updateAddress").value,
    carDetails: {
      make: "Tesla",
      model: "Model Y",
      year: 2024,
      color: "Red",
      licensePlate: "NYC9999"
    }
    
  };

  try {
    const res = await fetch(`http://localhost:3010/api/drivers/${driverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    const msgDiv = document.getElementById("driverActionStatus");

    if (res.ok) {
      msgDiv.innerHTML = `<div class="alert alert-success">Driver updated successfully.</div>`;
    } else {
      msgDiv.innerHTML = `<div class="alert alert-danger">Update failed: ${data.error}</div>`;
    }
  } catch (err) {
    console.error("Update error:", err);
    document.getElementById("driverActionStatus").innerHTML =
      '<div class="alert alert-danger">Error occurred. Check console.</div>';
  }
}


async function deleteDriver() {
  const driverId = document.getElementById("deleteDriverId").value;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3000/api/admin/drivers/${driverId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const msgDiv = document.getElementById("driverActionStatus");

    if (res.ok) {
      msgDiv.innerHTML = `<div class="alert alert-success">Driver deleted successfully.</div>`;
    } else {
      msgDiv.innerHTML = `<div class="alert alert-danger">Delete failed: ${data.error}</div>`;
    }
  } catch (err) {
    console.error("Delete error:", err);
    document.getElementById("driverActionStatus").innerHTML =
      '<div class="alert alert-danger">Error occurred. Check console.</div>';
  }
}


async function viewAssignedRides() {
  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const driverId = payload.driverId;

  const res = await fetch(`http://localhost:3003/api/rides/driver/${driverId}`, {

    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const container = document.getElementById("rideList");

  if (res.ok && data.rides?.length > 0) {
    let html = `<h5 class="mb-3">Assigned Rides:</h5>`;
    data.rides.forEach(ride => {
      html += `
        <div class="card p-3 mb-2">
          <p><strong>Ride ID:</strong> ${ride.rideId}</p>
          <p><strong>Customer:</strong> ${ride.customerId}</p>
          <p><strong>Status:</strong> ${ride.status}</p>
          <p><strong>Pickup:</strong> ${ride.pickupLocation?.address}</p>
          <p><strong>Dropoff:</strong> ${ride.dropoffLocation?.address}</p>
          <p><strong>Fare:</strong> $${ride.actualPrice?.toFixed(2) || 'N/A'}</p>`;

      if (ride.status === 'requested') {
        html += `
          <button class="btn btn-success btn-sm me-2" onclick='respondToRide("${ride.rideId}", "accepted")'>Accept</button>
          <button class="btn btn-danger btn-sm" onclick='respondToRide("${ride.rideId}", "rejected")'>Reject</button>
        `;
      }

      html += `</div>`;
    });
    container.innerHTML = html;
  } else {
    container.innerHTML = `<div class="alert alert-info">No assigned rides found.</div>`;
  }
}

async function respondToRide(rideId, action) {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:3003/api/rides/driver-response", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rideId, action })
  });

  const result = await res.json();
  alert(result.message || result.error || `Ride ${action}`);
  viewAssignedRides(); // refresh
}

