function getDateMMDDYYYY(){
    let d = new Date()
    return `${d.getMonth()+1}-${d.getDate()}-${d.getFullYear()}`
}

function getWeekandYear(){
    const today = new Date();
    const currentWeek = Math.ceil(
      (today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
    );
    return {
        year: today.getFullYear(),
        currentWeek: currentWeek,
    }
}

module.exports = {
    getDateMMDDYYYY,
    getWeekandYear
}