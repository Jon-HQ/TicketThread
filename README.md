Created by [Vega](https://twitter.com/cryptovega_) and [Jon_HQ](https://twitter.com/jon_hq)

To invite the bot follow this link: [Public bot](https://discord.com/api/oauth2/authorize?client_id=993570644665053306&permissions=362924854336&scope=bot%20applications.commands)

**Installation**

1. Install [Node.js](https://hostadvice.com/how-to/install-node-js-on-your-linux-virtual-server/)
2. Install NPM using the `npm install -g npm` command
3. Create a bot at https://discord.com/developers/applications 
4. Get the bot's token ![image](https://user-images.githubusercontent.com/92063473/174147837-b06dc16b-b67d-425c-85b2-e775e2c257c2.png)
5. Copy the token and paste it in replacement of the token in .env ![image](https://user-images.githubusercontent.com/92063473/174149171-e7eb9ba8-cc47-4ca9-be8c-c49c2093b3ff.png)
6. Go to the Bot tab and turn on Message Content Intent and Server Member Intent.
7. Go to the Discord Developer Portal > OAuth2 > URL Generator
8. Then select `bot` & `applications.commands` ![image](https://user-images.githubusercontent.com/92063473/174148293-40d1c6d3-8f88-4729-a271-c10d317ddeb5.png)
9. Finally select the permissions `Read Messages/View Channel` `Send Messages` `Create Private Threads` `Send Messages in Threads` ` Manage Threads` `Use Slash Commands`![image](https://user-images.githubusercontent.com/92063473/174148751-87ea9605-0c3c-4dc0-a5e8-981f6db06ec4.png)
10. Bot will additionally need embed links/add reactions.
11. To invite the bot copy the url it has generated ![image](https://user-images.githubusercontent.com/92063473/174149017-3459d9b7-2742-4b1f-ab44-8ec6e77cf421.png)

**Running the bot**

To start the bot simply run `node index.js`






