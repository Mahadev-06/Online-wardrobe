import https from "https";

const API_KEY = "AIzaSyAR_7nlJ9MHi7aZX0nLjtAmdamRGRrlJVA";

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const parsed = JSON.parse(data);
        console.log("AVAILABLE MODELS:", parsed.models?.map((m: any) => m.name));
    } catch(e) {
        console.log(data);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
