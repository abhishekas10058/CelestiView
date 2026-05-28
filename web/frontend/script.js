const BACKEND_URL = "http://localhost:5000";

/* ================= APOD ELEMENTS ================= */

const titleEl = document.querySelector(".apod-title");
const mediaContainer = document.querySelector(".apod-media");
const explanationEl = document.querySelector(".apod-explanation");
const dateLabel = document.querySelector(".current-date");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();


/* ================= FORMAT DATE ================= */

function formatDate(date){
  return date.toISOString().split("T")[0];
}


/* ================= LOAD APOD ================= */

async function loadAPOD(date){

  if(!titleEl) return;

  try{

    const res = await fetch(`${BACKEND_URL}/apod?date=${date}`);

    if(!res.ok){
      throw new Error("APOD not available for this date");
    }

    const data = await res.json();

    titleEl.textContent = data.title;
    explanationEl.textContent = data.explanation;
    dateLabel.textContent = data.date;

    renderMedia(data);

  }
  catch(err){

    console.warn("Falling back to today's APOD");

    const res = await fetch(`${BACKEND_URL}/apod`);
    const data = await res.json();

    titleEl.textContent = data.title;
    explanationEl.textContent = data.explanation;
    dateLabel.textContent = data.date;

    renderMedia(data);

  }

}


/* ================= RENDER MEDIA ================= */

function renderMedia(data){

  if(!mediaContainer) return;

  mediaContainer.innerHTML = "";

  if(data.media_type === "image"){

    mediaContainer.innerHTML = `
      <img src="${data.url}" alt="${data.title}">
    `;

  }

  else if(data.media_type === "video"){

    let videoURL = data.url;

    if(videoURL.includes("youtube.com") || videoURL.includes("youtu.be")){

      if(videoURL.includes("watch?v=")){
        videoURL = videoURL.replace("watch?v=","embed/");
      }

      if(videoURL.includes("youtu.be")){
        const id = videoURL.split("/").pop();
        videoURL = `https://www.youtube.com/embed/${id}`;
      }

      mediaContainer.innerHTML = `
        <iframe src="${videoURL}" allowfullscreen></iframe>
      `;

    }

    else{

      mediaContainer.innerHTML = `
        <div class="video-fallback">
          <p>This APOD contains a video hosted on NASA's website.</p>
          <a href="${data.url}" target="_blank" class="open-video-btn">
            ▶ Open Video on NASA Website
          </a>
        </div>
      `;

    }

  }

}


/* ================= DATE NAVIGATION ================= */

function changeDate(days){

  currentDate.setDate(currentDate.getDate()+days);

  const formatted = formatDate(currentDate);

  loadAPOD(formatted);

}

if(prevBtn && nextBtn){

  prevBtn.addEventListener("click",()=> changeDate(-1));
  nextBtn.addEventListener("click",()=> changeDate(1));

}


/* ================= LOAD FROM CALENDAR ================= */

const params = new URLSearchParams(window.location.search);
const selectedDate = params.get("date");

if(selectedDate){

  currentDate = new Date(selectedDate);
  loadAPOD(selectedDate);

}
else{

  loadAPOD(formatDate(currentDate));

}


/* ================= SHARE SYSTEM ================= */

const shareBtn = document.getElementById("shareBtn");
const shareModal = document.getElementById("shareModal");
const closeShare = document.querySelector(".close-share");

const twitter = document.getElementById("shareTwitter");
const facebook = document.getElementById("shareFacebook");
const whatsapp = document.getElementById("shareWhatsApp");

const copyBtn = document.getElementById("copyLinkBtn");


if(shareBtn){

  shareBtn.addEventListener("click",(e)=>{

    e.preventDefault();
    shareModal.style.display="flex";
    setupShareLinks();

  });

}


if(closeShare){

  closeShare.addEventListener("click",()=>{
    shareModal.style.display="none";
  });

}


window.addEventListener("click",(e)=>{

  if(shareModal && e.target === shareModal){
    shareModal.style.display="none";
  }

});


function setupShareLinks(){

  const pageURL = window.location.href;
  const title = document.querySelector(".apod-title")?.textContent || "";

  if(twitter){
    twitter.href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${pageURL}`;
  }

  if(facebook){
    facebook.href =
    `https://www.facebook.com/sharer/sharer.php?u=${pageURL}`;
  }

  if(whatsapp){
    whatsapp.href =
    `https://api.whatsapp.com/send?text=${encodeURIComponent(title)} ${pageURL}`;
  }

}


/* ================= COPY LINK ================= */

if(copyBtn){

  copyBtn.addEventListener("click",()=>{
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  });

}


/* ================= DOWNLOAD PDF ================= */

document.addEventListener("DOMContentLoaded", () => {

  const pdfBtn = document.getElementById("downloadPdfBtn");

  if(!pdfBtn) return;

  pdfBtn.addEventListener("click", async () => {

    try{

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const title = document.querySelector(".apod-title")?.textContent || "NASA APOD";
      const explanation = document.querySelector(".apod-explanation")?.textContent || "";
      const date = document.querySelector(".current-date")?.textContent || "";

      const img = document.querySelector(".apod-media img");

      let y = 20;

      /* TITLE */

      pdf.setFontSize(18);
      pdf.text(title, 10, y);

      y += 10;

      /* DATE */

      pdf.setFontSize(12);
      pdf.text(`Date: ${date}`, 10, y);

      y += 10;

      if(img){

        const image = new Image();
        image.crossOrigin = "anonymous";

        image.src = `http://localhost:5000/image-proxy?url=${encodeURIComponent(img.src)}`;

        image.onload = function(){

          const imgWidth = image.width;
          const imgHeight = image.height;

          const ratio = imgHeight / imgWidth;

          const pdfWidth = pageWidth - 20;
          const pdfHeight = pdfWidth * ratio;

          const x = (pageWidth - pdfWidth) / 2;

          /* ADD IMAGE */

          pdf.addImage(image, "JPEG", x, y, pdfWidth, pdfHeight);

          y += pdfHeight + 10;

          /* CHECK PAGE SPACE */

          if(y > pageHeight - 40){
            pdf.addPage();
            y = 20;
          }

          /* ADD EXPLANATION */

          pdf.setFontSize(11);

          const text = pdf.splitTextToSize(explanation, 180);

          pdf.text(text, 10, y);

          y += text.length * 6 + 10;

          /* SOURCE */

          pdf.setFontSize(10);
          pdf.text("Source: NASA Astronomy Picture of the Day", 10, y);

          pdf.save("NASA_APOD.pdf");

        };

      }

      else{

        const text = pdf.splitTextToSize(explanation, 180);

        pdf.text(text, 10, y);

        pdf.save("NASA_APOD.pdf");

      }

    }

    catch(err){

      console.error("PDF generation error:", err);
      alert("Failed to generate PDF");

    }

  });

});


/* ================= CONTACT FORM ================= */

const form = document.getElementById("contactForm");

if(form){

  form.addEventListener("submit", async (e)=>{

    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    try{

      const res = await fetch(`${BACKEND_URL}/send-feedback`,{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body: JSON.stringify({
          name,
          email,
          message
        })

      });

      const data = await res.json();

      if(data.success){

        alert("Message sent successfully!");
        form.reset();

      }else{

        alert("Failed to send message");

      }

    }

    catch(err){

      console.error(err);
      alert("Server error");

    }

  });

}