const currencySymbols = {
    // Major Global Currencies
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'CHF': 'Fr',
    'CAD': 'C$',
    'AUD': 'A$',
    
    // Middle Eastern & Arabic Currencies
    'SAR': 'ر.س',
    'AED': 'د.إ',
    'QAR': 'ر.ق',
    'KWD': 'د.ك',
    'BHD': 'د.ب',
    'OMR': 'ر.ع',
    'EGP': 'ج.م',
    'JOD': 'د.ا',
    'LBP': 'ل.ل',
    'IQD': 'ع.د',
    
    // Other Regional Currencies
    'TRY': '₺',
    'INR': '₹',
    'PKR': '₨',
    'RUB': '₽',
    'SGD': 'S$',
    'HKD': 'HK$',
    'MYR': 'RM',
    'IDR': 'Rp',
    'THB': '฿',
    'KRW': '₩'
};

// List of RTL currencies that should have the symbol after the amount
const rtlCurrencies = [
    'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'JOD', 'LBP', 'IQD'
];

export const formatPrice = (amount, currency = 'USD') => {
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = Number(amount).toFixed(2);
    
    // For RTL currencies, place symbol after the amount
    if (rtlCurrencies.includes(currency)) {
        return `${formattedAmount} ${symbol}`;
    }
    
    return `${symbol}${formattedAmount}`;
};
