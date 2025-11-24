import axios from 'axios';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export const fetchCountryNews = async (countryName) => {
    try {
        // Google News RSS Search URL
        const googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(countryName + ' economy politics risk')}&hl=en-US&gl=US&ceid=US:en`;

        // Use rss2json API to convert RSS to JSON and handle CORS
        // This is much more reliable for client-side only apps
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleRssUrl)}`;

        const response = await axios.get(apiUrl);

        if (!response.data || response.data.status !== 'ok' || !response.data.items) {
            console.warn("RSS2JSON returned error or no items:", response.data);
            throw new Error('Failed to fetch news');
        }

        return response.data.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: 'Google News'
        }));

    } catch (error) {
        console.error("Error fetching news:", error);
        // Fallback to mock data if API fails (to ensure user sees SOMETHING in a demo)
        return [
            {
                title: `Economic outlook for ${countryName} remains uncertain amid global shifts`,
                link: "#",
                pubDate: new Date().toISOString(),
                source: "Global Analyst (Mock)"
            },
            {
                title: `Political updates: New policies proposed in ${countryName}`,
                link: "#",
                pubDate: new Date().toISOString(),
                source: "World News (Mock)"
            }
        ];
    }
};

export const analyzeRiskFromNews = (newsItems) => {
    if (!newsItems || newsItems.length === 0) return { scoreModifier: 0, analysis: "No recent news found." };

    let totalScore = 0;
    let relevantCount = 0;

    newsItems.forEach(item => {
        const result = sentiment.analyze(item.title);
        totalScore += result.score;
        if (result.score !== 0) relevantCount++;
    });

    const averageSentiment = relevantCount > 0 ? totalScore / relevantCount : 0;

    // Scaling: Average sentiment of -2 should add maybe 10 points to risk.
    // Average sentiment of +2 should remove 10 points.
    const scoreModifier = Math.round(averageSentiment * -5);

    let analysis = "Stable news cycle.";
    if (averageSentiment < -1) analysis = "Negative news coverage indicates potential instability.";
    if (averageSentiment > 1) analysis = "Positive news coverage suggests improving conditions.";

    return {
        scoreModifier,
        analysis
    };
};
