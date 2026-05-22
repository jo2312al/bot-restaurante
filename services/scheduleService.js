function isRoomServiceOpen() {

    const mexicoTime = new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "America/Mexico_City"
        })
    );

    const hour = mexicoTime.getHours();
    const minutes = mexicoTime.getMinutes();

    const current = hour * 60 + minutes;

    // 7:00 AM - 12:00 PM
    const morningStart = 7 * 60;
    const morningEnd = 11 * 60;

    // 6:00 PM - 11:00 PM
    const eveningStart = 18 * 60;
    const eveningEnd = 23 * 60;

    return (
        (current >= morningStart && current <= morningEnd) ||
        (current >= eveningStart && current <= eveningEnd)
    );

}

module.exports = {
    isRoomServiceOpen
};