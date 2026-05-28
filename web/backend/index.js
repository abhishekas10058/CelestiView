import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_URL = "https://api.nasa.gov/planetary/apod";


/* ================= SINGLE DAY APOD ================= */

app.get("/apod", async (req, res) => {

  try {

    const { date } = req.query;

    const params = {
      api_key: NASA_API_KEY,
      thumbs: true
    };

    if(date){
      params.date = date;
    }

    const response = await axios.get(NASA_URL,{ params });

    res.json(response.data);

  } catch (error) {

    console.error("NASA API ERROR:", error.message);

    res.status(500).json({
      error: "Failed to fetch APOD"
    });

  }

});

/* ================= APOD DATE RANGE ================= */

app.get("/apod-range", async (req, res) => {

  try {

    let { start, end } = req.query;

    const today = new Date().toISOString().split("T")[0];

    /* Prevent future dates */
    if(end > today){
      end = today;
    }

    const response = await axios.get(NASA_URL, {
      params: {
        api_key: NASA_API_KEY,
        start_date: start,
        end_date: end,
        thumbs: true
      }
    });

    /* Sort results by date */

    const sorted = response.data.sort(
      (a,b)=> new Date(a.date) - new Date(b.date)
    );

    res.json(sorted);

  } catch (error) {

    console.error("NASA RANGE ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to fetch APOD range"
    });

  }

});


/* ================= IMAGE PROXY (Fix NASA CORS) ================= */

app.get("/image-proxy", async (req, res) => {

  try {

    const imageUrl = req.query.url;

    console.log("Proxy image request:", imageUrl);

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);

  } catch (err) {

    console.error("Image proxy error:", err.message);

    res.status(500).send("Failed to load image");

  }

});


/* ================= CONTACT FORM EMAIL ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


app.post("/send-feedback", async (req, res) => {

  console.log("📩 Feedback request received:", req.body);

  const { name, email, message } = req.body;

  try {

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: process.env.EMAIL_USER,

      subject: "CelestiView Feedback",

      text: `
Name: ${name}
Email: ${email}

Message:
${message}

Sent at: ${new Date().toLocaleString()}
`

    });

    console.log("✅ Email sent successfully");

    res.json({ success: true });

  } catch (err) {

    console.error("❌ Email error:", err);

    res.json({ success: false });

  }

});


/* ================= START SERVER ================= */

app.listen(PORT, () => {

  console.log("🚀 Server running on http://localhost:" + PORT);

});