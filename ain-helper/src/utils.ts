export const formatNumber = (num: number | null | undefined, decimals = 2): string => {
    if (isNaN(Number(num)) || num === null || num === undefined) return '0';
    // Handle potential floating point inaccuracies for rounding
    const factor = Math.pow(10, decimals);
    // Use Number() to satisfy TypeScript strict checks
    const rounded = Math.round((Number(num) + Number.EPSILON) * factor) / factor;
    return rounded.toLocaleString('en-PH', {
      minimumFractionDigits: 0, // Don't show .00
      maximumFractionDigits: decimals,
    });
};

export const CONFIG = {
    NUMBER_OF_WEEKS_PER_MONTH: 52/12,
    NUMBER_OF_WEEKS_PER_YEAR: 52,
};