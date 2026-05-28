const BACKEND_URL = "https://celestiview-backend.onrender.com";

const calendarGrid = document.getElementById("calendarGrid");
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];


/* ---------- Populate Years ---------- */

for(let y = 1995; y <= new Date().getFullYear(); y++){

    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;

    yearSelect.appendChild(option);
}


/* ---------- Populate Months ---------- */

months.forEach((month,i)=>{

    const option = document.createElement("option");
    option.value = i + 1;
    option.textContent = month;

    monthSelect.appendChild(option);

});


/* ---------- Default Selection ---------- */

yearSelect.value = new Date().getFullYear();
monthSelect.value = new Date().getMonth() + 1;


/* ---------- Load Calendar ---------- */

async function loadCalendar(year,month){

    calendarGrid.innerHTML = "";

    const lastDay = new Date(year,month,0).getDate();

    const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month).padStart(2,"0")}-${lastDay}`;

    try{

        const res = await fetch(
            `${BACKEND_URL}/apod-range?start=${startDate}&end=${endDate}`
        );

        const data = await res.json();

        /* Convert API data into lookup map */

        const apodMap = {};

        data.forEach(item=>{
            apodMap[item.date] = item;
        });


        /* Create EXACT days of month */

        for(let day = 1; day <= lastDay; day++){

            const date =
            `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

            const item = apodMap[date];

            const card = document.createElement("div");
            card.className = "calendar-day";

            if(item){

                if(item.media_type === "image"){

                    card.innerHTML = `
                    <img src="${item.url}" loading="lazy">
                    <span>${date}</span>
                    <div class="day-overlay">${item.title}</div>
                    `;

                }
                else{

                    card.innerHTML = `
                    <div class="video-thumb">🎥</div>
                    <span>${date}</span>
                    <div class="day-overlay">${item.title}</div>
                    `;

                }

                card.onclick = ()=>{
                    window.location.href = `index.html?date=${date}`;
                };

            }

            else{

                card.innerHTML = `
                <div class="no-apod">No Image</div>
                <span>${date}</span>
                `;

            }

            calendarGrid.appendChild(card);

        }

    }

    catch(err){

        console.error("Calendar error:",err);

    }

}


/* ---------- Dropdown Change ---------- */

function updateCalendar(){

    const year = yearSelect.value;
    const month = monthSelect.value;

    loadCalendar(year,month);

}

yearSelect.addEventListener("change",updateCalendar);
monthSelect.addEventListener("change",updateCalendar);


/* ---------- Initial Load ---------- */

updateCalendar();