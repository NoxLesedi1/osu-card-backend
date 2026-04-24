const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

function getRarity(mutuals) {
    if (mutuals >= 200000) return "Mythic";
    if (mutuals >= 80000) return "Legendary";
    if (mutuals >= 30000) return "Epic";
    if (mutuals >= 10000) return "Rare";
    return "Common";
}

app.get("/rankings", async (req, res) => {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new"
        });

        const page = await browser.newPage();

        await page.goto(
            "https://mutualify.stanr.info/rankings?page=1",
            { waitUntil: "networkidle2" }
        );

        const players = await page.evaluate(() => {
            const rows = document.querySelectorAll("table tbody tr");

            let data = [];

            rows.forEach(row => {
                const cols = row.querySelectorAll("td");

                const name = cols[1]?.innerText?.trim();
                const mutuals = parseInt(cols[2]?.innerText?.trim());

                if (name && !isNaN(mutuals)) {
                    data.push({
                        username: name,
                        mutuals: mutuals
                    });
                }
            });

            return data;
        });

        await browser.close();

        // Apply rarity AFTER scraping (cleaner + safer)
        const finalData = players.map(p => ({
            username: p.username,
            mutuals: p.mutuals,
            rarity: getRarity(p.mutuals)
        }));

        // Sort highest mutuals first
        finalData.sort((a, b) => b.mutuals - a.mutuals);

        res.json(finalData);

    } catch (err) {
        console.log(err);

        if (browser) await browser.close();

        res.status(500).json({
            error: "Scraping failed"
        });
    }
});

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
});