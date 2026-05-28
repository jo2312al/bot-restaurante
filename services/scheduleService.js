const { ROOM_SERVICE_FORCE_OPEN } = require("../config/config");

function isRoomServiceOpen() {

    if (ROOM_SERVICE_FORCE_OPEN) {
        return true;
    }

    const mexicoTime = new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "America/Mexico_City"
        })
    );

    const hour = mexicoTime.getHours();
    const minutes = mexicoTime.getMinutes();
    const current = hour * 60 + minutes;

    const morningStart = 7 * 60;
    const morningEnd = 12 * 60;
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
