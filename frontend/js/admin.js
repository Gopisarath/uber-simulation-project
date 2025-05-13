const token = localStorage.getItem("token");

// Revenue by Date
async function fetchRevenue() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/statistics/revenue", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("revenueResult");

    if (res.ok) {
      let html = "<ul class='list-group'>";
      data.forEach(day => {
        html += `<li class='list-group-item'>${day.date}: <strong>$${day.totalRevenue}</strong></li>`;
      });
      html += "</ul>";
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Failed to load revenue.</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("revenueResult").innerHTML =
      '<div class="alert alert-danger">Request failed.</div>';
  }
}

// Ride Stats
async function fetchRideStats() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/statistics/rides?type=area", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("rideStatsResult");

    if (res.ok) {
      let html = "<ul class='list-group'>";
      data.forEach(area => {
        html += `<li class='list-group-item'>${area.area}: <strong>${area.rideCount} rides</strong></li>`;
      });
      html += "</ul>";
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Failed to load ride stats.</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("rideStatsResult").innerHTML =
      '<div class="alert alert-danger">Error fetching stats.</div>';
  }
}

// Get Drivers
async function fetchDrivers() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/drivers", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("driverList");

    if (res.ok) {
      let html = "<ul class='list-group'>";
      data.forEach(d => {
        html += `<li class='list-group-item'>${d.driverId}</li>`;
      });
      html += "</ul>";
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Failed to load drivers.</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("driverList").innerHTML =
      '<div class="alert alert-danger">Request failed.</div>';
  }
}

// Get Customers
async function fetchCustomers() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/customers", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("customerList");

    if (res.ok) {
      let html = "<ul class='list-group'>";
      data.forEach(c => {
        html += `<li class='list-group-item'>${c.customerId}</li>`;
      });
      html += "</ul>";
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Failed to load customers.</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("customerList").innerHTML =
      '<div class="alert alert-danger">Request failed.</div>';
  }
}

// Get All Bills
async function fetchAllBills() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/bills", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const output = document.getElementById("billList");

    if (res.ok) {
      let html = "<ul class='list-group'>";
      data.forEach(bill => {
        html += `<li class='list-group-item'>${bill.billingId} - $${bill.totalAmount}</li>`;
      });
      html += "</ul>";
      output.innerHTML = html;
    } else {
      output.innerHTML = `<div class="alert alert-danger">Failed to load bills.</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("billList").innerHTML =
      '<div class="alert alert-danger">Request failed.</div>';
  }
}
