const URL = "https://zuzkvajitvberyusqpgk.supabase.co/rest/v1/rpc/get_sale_dashboard";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1emt2YWppdHZiZXJ5dXNxcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODU0NzksImV4cCI6MjEwMjQ2MTQ3OX0.JR3EsiiXh_MQHxSj_g9xYK5YPFU8pkl8tSpLcPA-stE";

// DOM Elements
const reportDate = document.getElementById("reportDate");
const todaySales = document.getElementById("todaySales");
const todayRevenue = document.getElementById("todayRevenue");
const mtdSales = document.getElementById("mtdSales");
const mtdRevenue = document.getElementById("mtdRevenue");
const leaderboard = document.getElementById("leaderboard");
const monthlyList = document.getElementById("monthlyList");
const dailyTable = document.getElementById("dailyTable");
const searchRep = document.getElementById("searchRep");
const themeToggle = document.getElementById("themeToggle");

// Chart instances
let revenueChartInstance = null;
let categoryChartInstance = null;
let rawLeaderboardData = []; // Store raw data for instant local search filtering

window.addEventListener("DOMContentLoaded", () => {
    reportDate.value = new Date().toISOString().split("T")[0];
    loadDashboard();
});

reportDate.addEventListener("change", loadDashboard);

// Local Search Filter for Leaderboard
searchRep?.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = rawLeaderboardData.filter(item => 
        item.sales_representative.toLowerCase().includes(query)
    );
    renderLeaderboard(filtered);
});

// Dark/Light Theme Toggle
themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const icon = themeToggle.querySelector("i");
    if (icon) {
        icon.classList.toggle("fa-moon");
        icon.classList.toggle("fa-sun");
    }
});

async function loadDashboard() {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                apikey: API_KEY,
                Authorization: "Bearer " + API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                report_date: reportDate.value
            })
        });

        const data = await response.json();
        const dashboard = data[0];
        const kpi = dashboard.kpi_cards;

        // 1. Populate KPI Cards (Handling case-sensitivity smoothly)
        todaySales.innerText = kpi.TODAY_SALES ?? kpi.today_sales ?? 0;
        todayRevenue.innerText = "₹" + Number(kpi.TODAY_REVENUE ?? kpi.today_revenue ?? 0).toLocaleString();
        mtdSales.innerText = kpi.mtd_sales ?? kpi.MTD_SALES ?? 0;
        mtdRevenue.innerText = "₹" + Number(kpi.MTD_REVENUE ?? kpi.mtd_revenue ?? 0).toLocaleString();

        // 2. Render Leaderboard & Save Cache for Search
        rawLeaderboardData = dashboard.leaderboard_metrics || [];
        renderLeaderboard(rawLeaderboardData);

        // 3. Render Monthly List
        monthlyList.innerHTML = "";
        dashboard.monthly_metrics.forEach(item => {
            monthlyList.innerHTML += `
                <div class="month">
                    <span>${item.month}/${item.year}</span>
                    <strong>${item.no_of_sales} sales</strong>
                </div>
            `;
        });

        // 4. Render Daily Metrics Table (Including AOV Calculation)
        dailyTable.innerHTML = "";
        dashboard.daily_metrics.forEach(item => {
            const salesCount = Number(item.no_of_sales) || 1;
            const rev = Number(item.total_revenue) || 0;
            const aov = rev / salesCount;

            dailyTable.innerHTML += `
                <tr>
                    <td>${item.order_date}</td>
                    <td>${item.no_of_sales}</td>
                    <td>₹${rev.toLocaleString()}</td>
                    <td>₹${Math.round(aov).toLocaleString()}</td>
                </tr>
            `;
        });

        // 5. Render Chart.js Visualizations
        renderCharts(dashboard.daily_metrics);

    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

function renderLeaderboard(data) {
    leaderboard.innerHTML = "";
    data.forEach(item => {
        const todayCount = item.today_sales ?? 0;
        const statusBadge = todayCount > 0 
            ? `<span style="color:#22c55e; font-weight:600;">Active</span>` 
            : `<span style="color:#94a3b8;">Idle</span>`;

        leaderboard.innerHTML += `
            <tr>
                <td><strong>${item.sales_representative}</strong></td>
                <td>${todayCount}</td>
                <td>${item.mtd_sales}</td>
                <td>₹${Number(item.mtd_revenue).toLocaleString()}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
}

function renderCharts(dailyMetrics) {
    if (!dailyMetrics || dailyMetrics.length === 0) return;

    const labels = dailyMetrics.map(d => d.order_date).reverse();
    const revenueData = dailyMetrics.map(d => d.total_revenue).reverse();
    const salesData = dailyMetrics.map(d => d.no_of_sales).reverse();

    // Destroy existing instances to prevent duplicate rendering bugs
    if (revenueChartInstance) revenueChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();

    // Line Chart: Revenue Trend
    const revCtx = document.getElementById("revenueChart")?.getContext("2d");
    if (revCtx) {
        revenueChartInstance = new Chart(revCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Daily Revenue (₹)",
                    data: revenueData,
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Bar Chart: Daily Sales Volume
    const catCtx = document.getElementById("categoryChart")?.getContext("2d");
    if (catCtx) {
        categoryChartInstance = new Chart(catCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Sales Volume",
                    data: salesData,
                    backgroundColor: "#3b82f6",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}
