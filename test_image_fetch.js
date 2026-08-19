import fetch from 'cross-fetch';

async function testFetch(query) {
    try {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        
        const regex = /murl&quot;:&quot;(https:[^&]+?)&quot;/g;
        const matches = [];
        let match;
        while ((match = regex.exec(html)) !== null && matches.length < 5) {
            matches.push(match[1]);
        }
        console.log(`Query: "${query}" - Found ${matches.length} images:`);
        console.log(matches);
    } catch (e) {
        console.error("Error:", e);
    }
}

async function run() {
    await testFetch("iPhone 15 Pro front transparent png");
    await testFetch("iPhone 15 Pro back transparent png");
}

run();
