const https = require('https');

// Remplacez par le nom d'un acteur que vous souhaitez rechercher
const actorName = 'Bill Skarsgård';  // Nom de l'acteur à rechercher
const encodedActorName = encodeURIComponent(actorName);  // Encodage du nom pour qu'il soit compatible avec l'URL

const options = {
    method: 'GET',
    hostname: 'moviesminidatabase.p.rapidapi.com',
    port: null,
    path: `/actor/imdb_id_byName/${encodedActorName}/`,  // Insérer le nom encodé dans l'URL
    headers: {
        'x-rapidapi-key': '4b1e857466mshc87f9e8bc157972p184376jsn043ac2c26541',  // Assurez-vous que la clé API est correcte
        'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
    }
};

const req = https.request(options, function (res) {
    const chunks = [];

    res.on('data', function (chunk) {
        chunks.push(chunk);
    });

    res.on('end', function () {
        const body = Buffer.concat(chunks);
        console.log(body.toString());  // Affiche la réponse de l'API dans la console
    });
});

req.on('error', (e) => {
    console.error(`Erreur lors de la requête : ${e.message}`);
});

req.end();