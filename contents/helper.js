async function createSentenceCard(word, kana, glosses, lastSub) {
    const url = 'http://localhost:5123/add_card';
    const regex = new RegExp(`(${word})`, 'gi');
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Matches the 'accept' header in curl
            "Content-Type": "application/json", // Matches the 'content-type' header in curl
        },
        body: JSON.stringify({
            front: lastSub.replace(regex, `<b>${word}</b>`),
            back: `${word} ${kana}<br>${glosses.join(", ")}`,
            deck: 'Japanese mining deck'
        }),
    });
    
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
}

async function getDictionary(word) {
    const url = "https://jotoba.de/api/search/words"; // Correct endpoint
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json", // Matches the 'accept' header in curl
                "Content-Type": "application/json", // Matches the 'content-type' header in curl
            },
            body: JSON.stringify({
                query: word, // Ensure the query parameter is correct
                language: "English", // English language set as in the curl request
                no_english: false, // Correct flag
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const json = await response.json();
        
        // Check for existence of words and return the first word's reading and gloss
        if (json.words && json.words.length > 0) {
            const wordData = json.words[0];
            const kana = wordData.reading?.kana || "No kana available";
            const common = wordData.common ? "common" : "uncommon";
            const glosses = wordData.senses?.[0]?.glosses || "No definition available";
            
            return {kana, common, glosses};
        } else {
            return "No dictionary data found."; // Graceful fallback message
        }
    } catch (error) {
        console.error("Error:", error.message);
        return "Error retrieving dictionary data."; // Graceful fallback message
    }
}

function isJapanese(text) {
    const japaneseRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
    return japaneseRegex.test(text);
}