const express = require("express");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

function getRarity(mutuals) {
    if (mutuals >= 200000) return "Mythic";
    if (mutuals >= 80000) return "Legendary";
    if (mutuals >= 30000) return "Epic";
    if (mutuals >= 10000) return "Rare";
    return "Common";
}

app.get("/", (req, res) => {
    res.send("OSU Card Backend Running");
});

app.get("/rankings", async (req, res) => {
    try {
        const response = await fetch("https://mutualify.stanr.info/rankings?page=1");
        const html = await response.text();

        const $ = cheerio.load(html);

        let players = [];

        $("tr").each((i, el) => {
            const cols = $(el).find("td");
            if (cols.length < 3) return;

            const name = $(cols[1]).text().trim();
            const raw = $(cols[2]).text().replace(/[^0-9]/g, "");
            const mutuals = parseInt(raw);

            if (name && !isNaN(mutuals)) {
                players.push({
                    username: name,
                    mutuals: mutuals,
                    rarity: getRarity(mutuals)
                });
            }
        });

        res.json(players);

    } catch (err) {
        console.log(err);
        res.status(500).send("scraping failed");
    }
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
