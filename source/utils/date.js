const formatDateForAPI = (date) => date.toISOString().split('T')[0];

const getFormattedLocalDateTime = (utcDateString) => { 
  return new Date(utcDateString).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDateWithOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

module.exports = {
  formatDateForAPI,
  getFormattedLocalDateTime,
  getDateWithOffset
};