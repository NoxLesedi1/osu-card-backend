const express = require("express");

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

        // 🔍 DEBUG CHECK (IMPORTANT)
        if (!html || html.length < 1000) {
            return res.json({
                error: "Empty or blocked response from Mutualify",
                hint: "Render may be blocked or site is JS-rendered"
            });
        }

        // 🧠 Simple regex-based fallback scraping (more stable than cheerio here)
        const rows = [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)];

        let players = [];

        for (const row of rows) {
            const text = row[1];

            const nameMatch = text.match(/<td[^>]*>(.*?)<\/td>/g);

            if (!nameMatch || nameMatch.length < 3) continue;

            const name = nameMatch[1]?.replace(/<[^>]+>/g, "").trim();
            const mutualsRaw = nameMatch[2]?.replace(/<[^>]+>/g, "").trim();
            const mutuals = parseInt(mutualsRaw.replace(/[^0-9]/g, ""));

            if (!name || isNaN(mutuals)) continue;

            players.push({
                username: name,
                mutuals: mutuals,
                rarity: getRarity(mutuals)
            });
        }

        // If still empty, return debug info
        if (players.length === 0) {
            return res.json({
                error: "No players parsed",
                hint: "Site structure likely changed or is JS-rendered",
                rawPreview: html.slice(0, 500)
            });
        }

        res.json(players);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Scraping failed",
            details: err.toString()
        });
    }
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
