let establishments = [
    {
        location: "London",
        phone: "+441234567890",
        full_phone: "+44 12 3456 7890",
        address: "London, United Kingdom",
        address_link: "https://maps.google.com/",
        hours: "10:00 - 22:00",
        days: "Saturday - Sunday",
        geo: [51.509865, -0.118092],
    },
    {
        location: "New York",
        phone: "+112345678901",
        full_phone: "+1 123 456 78901",
        address: "New York, United States",
        address_link: "https://maps.google.com/",
        hours: "10:00 - 22:00",
        days: "Saturday - Sunday",
        geo: [40.712784, -74.005941],
    },
    {
        location: "Kiev",
        phone: "+3801234567890",
        full_phone: "+380 12 3456 7890",
        address: "Kiev, Ukraine",
        address_link: "https://maps.google.com/",
        hours: "11:00 - 18:00",
        days: "Saturday - Sunday",
        geo: [50.4501, 30.5234],
    },
];

let ourEstablishmentsText = establishments.map(establishment => {
    let text;
    text = `⭐️ <b>Coffee Brøs <i>in ${establishment.location}</i></b>`;
    text += `\n📞 <a href="tel:${establishment.phone}">${establishment.full_phone}</a>`;
    text += `\n📍 <a href="${establishment.address_link}">${establishment.address}</a>`;
    text += `\n🕓 ${establishment.days}: <b>${establishment.hours}</b>`;
    return text;
}).join('\n\n');

module.exports = { establishments, ourEstablishmentsText };