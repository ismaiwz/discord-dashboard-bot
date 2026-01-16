// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = 3000;
const passport = require('passport');
const session = require('express-session');
const { title } = require('node:process');
const config = require('./config.js');
 const DiscordStrategy = require('passport-discord').Strategy;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.set('view engine', 'ejs');


const client = new Client({ intents: [Object.values(GatewayIntentBits)] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

app.use(session({
    secret: 'egeninamı',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// passport.js discord setup goes here fix serialize problem
passport.use(new DiscordStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    scope: config.scope
}, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.render('index', { user: req.user, title: 'Home', botGuilds: client.guilds.cache }); 
});

app.get('/auth/discord', (req, res) => {
    passport.authenticate('discord')(req, res);
});
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
});
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.get('/dashboard/:guildID', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect('/');
    res.render('dashboard', { user: req.user, guild: guild, title: 'Dashboard' });
});

app.post('/dashboard/:guildID/ban'  , async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect('/');
    const memberID = req.body.memberId; 
    try {
        await guild.members.ban(memberID, { reason: 'Banned via web dashboard' });
        res.redirect(`/dashboard/${guild.id}`);
    } catch (error) {
        console.error('Error banning member:', error);
        res.redirect(`/dashboard/${guild.id}`);
    }
});
// member.kick is not function hatası 
app.post('/dashboard/:guildID/kick'  , async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect('/');
    const memberID = req.body.memberId;
    try {
        await guild.members.kick(memberID, 'Kicked via web dashboard');
        res.redirect(`/dashboard/${guild.id}`);
    } catch (error) {
        console.error('Error kicking member:', error);
        res.redirect(`/dashboard/${guild.id}`);
    }
});

client.login(config.token);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});