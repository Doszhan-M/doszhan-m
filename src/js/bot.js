export { bot }

// let token = '1a341986627459:AAG04-Gffa3S47d1J1a349N9MZSXTEPJexKRw381a34';
// token = token.replace(/1a34/g, '')
const token = process.env.TELEGRAM_TOKEN;
console.log(token)
const bot = { token: token, chat_id: '-523535813', };
