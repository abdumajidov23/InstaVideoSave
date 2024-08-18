import { config } from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import insta from 'nayan-media-downloader';
import fs from 'fs';
import fetch from 'node-fetch';
import surah from 'holy-quran';
import { styleText } from 'util';

const { ndown } = insta;

// .env faylidan tokenni yuklash
config();
const token = process.env.TOKEN;

// Botni yaratish
const bot = new TelegramBot(token, { polling: true });

// '/start' komandasi uchun javob
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `<b>Assalomu alaykum va rohmatulloh. Salomatmisiz 😊.</b> <code>${msg.from.first_name}</code> matnli xabar qoldiring.

    Buyruqlar bilan tanishing

    Savolingiz yoki taklifingiz bo'lsa yozib qoldiring😊!

    /start - botni ishga tushirish.

    /mening_profilim - sizing profilingiz haqida ma'lumot beramiz.

    /kitoblar - bu buyruq yordamida kitoblarni pdf shaklini topasiz

    /futbol_yagiliklar - futbol yangiliklarini havola orqali kirib ko'rishingiz mumkin.

    /game - onlayn oyinlar havolaga kirsangiz turli xil o'yinlarni qurilmangizga yuklamasdan ham o'ynash imkonini beradi.
    "game" - Bu kamanda shunchaki tajriba uchun qo'yilgan iltimos vaqtingizni isrof qilmang!!`, { parse_mode: 'html' });
});

// '/mening_profilim' komandasi uchun javob
bot.onText(/\/mening_profilim/, (msg) => {
    bot.sendMessage(msg.chat.id, `
        Sizning profilingiz:
ID: <code>${msg.chat.id}</code>
Sizning ismingiz:  ${msg.from.first_name}
Username: @${msg.from.username}

Savol va taklif bo'lsa yozib qoldiring📝!
`, { parse_mode: 'html' });
});

// '/futbol_yagiliklar' komandasi uchun javob
bot.onText(/\/futbol_yagiliklar/, (msg) => {
    bot.sendMessage(msg.chat.id, `
<code>${msg.from.first_name}</code> futbol haqida yangiliklarni shu havola orqali ko'rishingiz mumkin:
https://championat.asia/uz/news?page=2
`, { parse_mode: 'html' });
});

// '/game' komandasi uchun javob
bot.onText(/\/game/, (msg) => {
    bot.sendMessage(msg.chat.id, `
Shu havola orqali turli o'yinlarni topishingiz mumkin: https://poki.com

<b>Bu o'yinlar shunchaki tajriba uchun qo'yildi vaqtingizni isrof qilmang!</b>
`, { parse_mode: 'html' });
});

// '/kitoblar' komandasi uchun javob
bot.onText(/\/kitoblar/, (msg) => {
    bot.sendMessage(msg.chat.id, `
Shu havola yordamida kitoblarni pdf shaklini yuklab olishingiz mumkin

https://mykitob.uz/
`, { parse_mode: 'html' });
});

// Matnli xabarlar uchun
bot.on('message', async (msg) => {
    if (!msg.text) {
        console.log('Xabar matni mavjud emas.');
        return;
    }

    const fullResponse = {
        "Matn": msg.text,
        "ID": msg.chat.id,
        "Name": msg.from.first_name,
        "Username": msg.from.username
    };

    // Faylga yozish operatsiyasi asenkron bo'lishi kerak
    fs.promises.appendFile('chat.json', JSON.stringify(fullResponse, null, 4))
        .catch(err => console.error("Faylga yozishda xato:", err));

    if (msg.text.startsWith("https://www.instagram.com/")) {
        bot.sendMessage(msg.chat.id, "Yuklanmoqda...");
        bot.sendMessage(msg.chat.id, "⌛️");
        
        try {
            // Video URL olish
            const videoUrl = await ndown(msg.text);
            if (!videoUrl.data || !videoUrl.data[0] || !videoUrl.data[0].url) {
                throw new Error("Video URL ma'lumotlari to'g'ri emas yoki bo'sh");
            }
            const videoName = `${videoUrl.data[0].title}_instagram.mp4`;

            const file = fs.createWriteStream(videoName);

            // Video yuklash
            const response = await fetch(videoUrl.data[0].url);

            if (!response.ok) throw new Error(`HTTP xatoligi! Status: ${response.status}`);

            response.body.pipe(file);
            file.on("finish", () => {
                // bot.sendMessage(msg.chat.id, "🔔 Tayyor!");

                console.log("Video yuklandi");

                // Video faylni foydalanuvchiga yuborish
                bot.sendVideo(msg.chat.id, videoName)
                    .then(() => {
                        fs.unlinkSync(videoName); // Video faylni o'chirish
                    })
                    .catch((err) => {
                        console.error("Video yuborishda xato:", err);
                    });
            });

            file.on("error", (err) => {
                console.error("Faylga yozishda xato:", err);
            });
        } catch (error) {
            console.error("Xatolik:", error);
            bot.sendMessage(msg.chat.id, "Video yuklashda xatolik yuz berdi.");
        }
    } else if (msg.text.startsWith("https://www.youtube.com/")) {
        bot.sendMessage(msg.chat.id, "Botimiz hozircha faqat instagramdan video yuklaydi!\n\nВ настоящее время наш бот загружает видео только из Instagram!");
        
    }else {
        bot.sendMessage(7344038324, `Matn: ${msg.text}\nID: <code>${msg.chat.id}</code>\nName: ${msg.from.first_name}\nUsername: @${msg.from.username}`, { parse_mode: 'html' });
        bot.sendMessage(msg.chat.id, `${msg.from.first_name} \n <b>Vidio linkinin tashlang</b>`, { parse_mode: 'html' });
    }
});
