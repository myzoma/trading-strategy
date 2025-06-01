// Utility functions
const utils = {
    formatNumber: (num) => {
        return new Intl.NumberFormat('ar-SA').format(num);
    },
    
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('ar-SA');
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
