// API functions
const api = {
    baseURL: 'https://api.example.com',
    
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}/${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};
