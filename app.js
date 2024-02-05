const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const axios = require('axios');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', {userData: null, err: false});
})


app.get('/:username', async (req, res) => {
    const { username } = req.params; 

    try {
        const response = await axios.get(`https://api.github.com/users/${username}`);
        const userData = response.data;

        const repos = await getRepos(userData.repos_url);

        const map = {};
        
        for (const repo of repos) {
            const languages = await getLanguagesForRepo(repo.languages_url);

            for (const language in languages) {
                if (map[language]) {
                    map[language] += languages[language];
                } else {
                    map[language] = languages[language];

                }
            }
        }

        userData.languages = map;
        userData.quote = await getRandomQuote();
        userData.created_at = formatDate(userData.created_at);

        res.render('index', { userData, err: false });
    }
    catch(error){
        console.error(error);
        res.render('index', {err: true, userData: null});
    }
})

async function getRepos(url) {
    return await axios.get(url)
    .then((response) => response.data)
}

async function getLanguagesForRepo(languagesUrl) {
    return await axios.get(languagesUrl)
    .then((response) => response.data)
}

async function getRandomQuote(){
    return await axios.get('https://zenquotes.io/api/random')
    .then((response) => {
        console.log(response.data[0].q);
        return response.data[0].q;
    })

}

function formatDate(isoDateString) {
    const date = new Date(isoDateString);

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}


app.listen(3000, () => {
    console.log('Listening on port 3000')
})