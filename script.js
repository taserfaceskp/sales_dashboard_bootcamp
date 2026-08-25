const URL =
"https://zuzkvajitvberyusqpgk.supabase.co/rest/v1/rpc/get_sale_dashboard";

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1emt2YWppdHZiZXJ5dXNxcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODU0NzksImV4cCI6MjEwMjQ2MTQ3OX0.JR3EsiiXh_MQHxSj_g9xYK5YPFU8pkl8tSpLcPA-stE";

const reportDate = document.getElementById("reportDate");

window.addEventListener("DOMContentLoaded", () => {

    reportDate.value =
        new Date().toISOString().split("T")[0];

    loadDashboard();

});

reportDate.addEventListener("change", () => {

    loadDashboard();

});

async function loadDashboard(){

    try{

        const response = await fetch(URL,{

            method:"POST",

            headers:{
                apikey:API_KEY,
                Authorization:"Bearer "+API_KEY,
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                report_date:reportDate.value
            })

        });

        const data = await response.json();

        const dashboard = data[0];
        const kpi = dashboard.kpi_cards;

        todaySales.innerText = kpi.TODAY_SALES;
        todayRevenue.innerText = "₹" + Number(kpi.TODAY_REVENUE).toLocaleString();
        mtdSales.innerText = kpi.mtd_sales;
        mtdRevenue.innerText = "₹" + Number(kpi.MTD_REVENUE).toLocaleString();

        leaderboard.innerHTML = "";

        dashboard.leaderboard_metrics.forEach(item=>{

            leaderboard.innerHTML += `
                <tr>
                    <td>${item.sales_representative}</td>
                    <td>${item.today_sales ?? 0}</td>
                    <td>${item.mtd_sales}</td>
                    <td>₹${Number(item.mtd_revenue).toLocaleString()}</td>
                </tr>
            `;

        });

        monthlyList.innerHTML = "";

        dashboard.monthly_metrics.forEach(item=>{

            monthlyList.innerHTML += `
                <div class="month">
                    <span>${item.month}/${item.year}</span>
                    <strong>${item.no_of_sales}</strong>
                </div>
            `;

        });

        dailyTable.innerHTML = "";

        dashboard.daily_metrics.forEach(item=>{

            dailyTable.innerHTML += `
                <tr>
                    <td>${item.order_date}</td>
                    <td>${item.no_of_sales}</td>
                    <td>₹${Number(item.total_revenue).toLocaleString()}</td>
                </tr>
            `;

        });

    }
    catch(err){

        console.error(err);

    }

}