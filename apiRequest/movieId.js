const http = require('https');

const options = {
    method: 'GET',
    hostname: 'moviesminidatabase.p.rapidapi.com',
    port: null,
    path: '/movie/id/tt0384642/',
    headers: {
        'x-rapidapi-key': '4b1e857466mshc87f9e8bc157972p184376jsn043ac2c26541',
        'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
    }
};

const req = http.request(options, function (res) {
    const chunks = [];

    res.on('data', function (chunk) {
        chunks.push(chunk);
    });

    res.on('end', function () {
        const body = Buffer.concat(chunks);
        console.log(body.toString());
    });
});

req.end();