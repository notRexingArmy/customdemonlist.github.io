// --- USER DATA (Mock Database) ---
// This is where accounts are stored. 
const users = [
    {
        username: "Admin",
        password: "test",
        avatar: "",
        clan: "",
        country: "DE",
        bio: "",
        socials: {
            youtube: "",
        }
    },
    {
        username: "Li Mao",
        password: "test",
        avatar: "",
        clan: "",
        country: "DE",
        bio: "I game sometimes",
        socials: {
            youtube: "https://youtube.com/@li_mao",
        }
    },
    {
        username: "Athani",
        password: "athanigamingmoment",
        avatar: "",
        clan: "",
        country: "CH",
        bio: "",
        socials: {
            youtube: "https://www.youtube.com/@athani2",
        }
    },
    {
        username: "TiluGamingHD",
        password: "tilugamingmoment",
        avatar: "",
        clan: "",
        country: "DE",
        bio: "",
        socials: {
            youtube: "https://www.youtube.com/@tilugaminghd8264/videos",
        }
    }
];

// --- STAFF DATA ---
// This populates the "List Editors" section on the home page and assigns badges on profiles.
// Names must match the 'username' in the users array above to link correctly.
// Also, if the name section is commented, the section specifically for the rank wont appear
const staffData = {
    owners: [
        { name: "Li Mao" }
    ],
    moderators: [
        { name: "Athani" }
    ],
    helpers: [
        // { name: "HelperName" }
    ],
    supporters: [
        // { name: "SupporterName" }
    ]
};