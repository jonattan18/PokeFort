// Load Model Data.
const page_model = require('../models/pages');

// Load Config Data.
const config = require('../config/config.json');

// Function to get all pokemons from a given user id.
let createpage = (ChannelID, UserID, MessageID, Embed, CurrentPage) => new Promise((resolve, reject) => {
    page_model.findOne({ ChannelID: ChannelID, UserID: UserID }, (err, page_data) => {
        if (err) reject(err);

        if (Embed.length > config.PAGE_MAX_LENGTH) {
            var slice_index = 0;
            var slice_end = config.PAGE_MAX_LENGTH;
            if (CurrentPage > config.PAGE_MAX_LENGTH) {
                slice_index = (CurrentPage - 10) < 0 ? 0 : (CurrentPage - 10);
                slice_end = (CurrentPage + config.PAGE_MAX_LENGTH) > Embed.length ? Embed.length : (CurrentPage + config.PAGE_MAX_LENGTH);
            }
            Embed = Embed.slice(slice_index, slice_end);
        }

        var update_data = {
            ChannelID: ChannelID,
            UserID: UserID,
            MessageID: MessageID,
            Embed: Embed,
            CurrentPage: CurrentPage,
        }

        if (page_data) {
            page_data.UserID = update_data.UserID;
            page_data.MessageID = update_data.MessageID;
            page_data.Embed = update_data.Embed;
            page_data.CurrentPage = update_data.CurrentPage;
        }
        else (page_data = new page_model(update_data));
        page_data.save();

    });
    setTimeout(resolve, 5000);
});

module.exports = { createpage };