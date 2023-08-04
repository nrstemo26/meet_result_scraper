function getDateMMDDYYYY(){
    let d = new Date()
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
}
module.exports = {
    getDateMMDDYYYY
}