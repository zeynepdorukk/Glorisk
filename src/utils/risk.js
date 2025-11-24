export const calculateTotalRisk = (economic, political) => {
    return (economic + political) / 2;
};

export const getRiskColor = (score) => {
    // 0-20: Very Low Risk (Green)
    // 21-40: Low Risk (Blue-Green)
    // 41-60: Medium Risk (Yellow)
    // 61-80: High Risk (Orange)
    // 81-100: Very High Risk (Red)

    if (score <= 20) return '#10b981'; // emerald-500
    if (score <= 40) return '#06b6d4'; // cyan-500
    if (score <= 60) return '#eab308'; // yellow-500
    if (score <= 80) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
};

export const getRiskLabel = (score) => {
    if (score <= 20) return 'Very Low';
    if (score <= 40) return 'Low';
    if (score <= 60) return 'Medium';
    if (score <= 80) return 'High';
    return 'Critical';
};
