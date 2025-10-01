export const generateClientId = () => {
  return `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

export const getMultiplierColor = (status, multiplier) => {
  if (status === 'crashed') return '#e74c3c';
  if (multiplier < 2) return '#3498db';
  if (multiplier < 5) return '#f39c12';
  return '#9b59b6';
};

export const formatCurrency = (amount) => {
  return `$${amount.toFixed(2)}`;
};

export const getCrashItemClass = (crashValue) => {
  if (crashValue < 2) return 'low';
  if (crashValue < 5) return 'medium';
  return 'high';
};