// import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";
//
// const app = new Application();
//
// app.use(ctx => {
//   ctx.response.body = "Hello World!";
// })
// await app.listen({ port: 8000 });

import { createBot, startBot, GatewayIntents } from 'https://deno.land/x/discordeno@13.0.0/mod.ts';
import { BOT_ID, BOT_TOKEN } from "./config.ts";
import { logger } from "./src/utils/logger.ts";
const log = logger({ name: "Main" });
log.info("Starting Bot, this might take a while...");
export const bot = createBot({
  token: BOT_TOKEN,
  botId: BOT_ID,
  intents: [GatewayIntents.Guilds, GatewayIntents.GuildMessages],
  events: {
      ready() {
          log.info("Bot is ready!");
      },
      messageCreate(message) {
          if (message.content === "!ping") {
              message.reply("Pong using Discordeno!");
          }
      },
  }
});

bot.gateway.presence = {
  status: "online",
  activities: []
};
await startBot(bot);
