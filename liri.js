require("dotenv").config();
var keys = require("./keys.js");
var fs = require("fs");

// TWITTER
var Twitter = require('twitter');
var client = new Twitter(keys.twitter);

// SPOTIFY
var Spotify = require('node-spotify-api');
var spotify = new Spotify(keys.spotify);

// FOR OMDB
var request = require("request");
// request("http://www.omdbapi.com/?t=remember+the+titans&y=&plot=short&apikey=trilogy")

// logging on both log.txt and console
var log = function (data) {
    fs.appendFile("log.txt", data+"\n", function(err) {
        if (err) {
            console.log(err);
        }
    });
    console.log(data);
}
// TWITTER
var myTweets = function (params='@SeanKim68289440') {
    client.get('statuses/user_timeline', {screen_name: params}, function(error, tweets, response) {
        if (!error) {
            log("");
            log("Recent history on Twitter: ");
            for (var i in tweets) {
                log(JSON.stringify(tweets[i].text + " (" + tweets[i].created_at + ")"));
            }
            log("********************");
        } else {
            throw error;
        }
    });
}



var postTweets = function (params=process.argv.slice(3).join(" ")) {    
    client.post('statuses/update', {status: params}, function(error, tweet, response) {
        if (!error) {
            log(JSON.stringify(tweet.text + " (" + tweet.created_at + ")"));
        }
    });
    log("");
    log("Posted the message on Twitter: " + params);
    log("********************");
}

// SPOTIFY
var spotifyThisSong = function (params=process.argv.slice(3).join(" ")) {
    var logSpotify = function (data, i) {
        log("");
        log(JSON.stringify(data.tracks.items[i].name + " by " + data.tracks.items[i].artists[0].name));
        log(JSON.stringify("preview: " + data.tracks.items[i].preview_url));
        log(JSON.stringify("album: " + data.tracks.items[i].album.name));
        log(JSON.stringify("track number: " + data.tracks.items[i].track_number));
        log(JSON.stringify("released date: " + data.tracks.items[i].album.release_date));
        log(JSON.stringify("album cover: " + data.tracks.items[i].album.images[0].url));
        log(JSON.stringify("album URL: " + data.tracks.items[i].album.external_urls.spotify));
        log("********************");
        log("");
    }
    var response = function (err, data) {
        if (err) {
            return log('Error occurred: ' + err);
        }
        for (var i in data.tracks.items) {
            logSpotify(data, i);
        }
        if (data.tracks.items[0] === undefined) {
            spotify.search({ type: 'track', query: "The Sign", limit: 6 }, function(err, data) {
                if (err) {
                    return log('Error occurred: ' + err);
                }
                logSpotify(data, 5);
            });
        }
    }
    var run = function (limit=1) {
        spotify.search({ type: 'track', query: params, limit: limit }, response);
    }
    run();
}

// OMDB
var movieThis = function (params=process.argv.slice(3).join("+")) {
    var logOMDB = function (movie) {
        log("");
        log("Title: " + movie.Title + " (" + movie.Year + ")");
        var tmt = "";
        if (movie.Ratings[1] !== undefined) {
            tmt = ", " + movie.Ratings[1].Value + "(Rotten Tomatoes)";
        }
        log("Rating --- " + movie.imdbRating + "(IMDB)" + tmt);
        log("Country: " + movie.Country);
        log("Language: " + movie.Language);
        log("Plot: " + movie.Plot);
        log("Actors: " + movie.Actors);
        log("********************");
        log("");
    };
    var response = function(error, response, body) {
        var movie = JSON.parse(body);
        if (movie.Title === undefined) {
            request("http://www.omdbapi.com/?t=Mr.+Nobody&y=&plot=short&apikey=trilogy", function(error, response, body) {
                var movie = JSON.parse(body);
                logOMDB(movie);
            });
        } else if (!error && response.statusCode === 200) {
            logOMDB(movie);
        }
    }
    var run = function (params) {
        request("http://www.omdbapi.com/?t=" + params + "&y=&plot=short&apikey=trilogy", response);
    }
    run(params);
}

// RANDOM
var doWhatItSays = function () {
    fs.readFile("random.txt", "utf8", function(error, data) {
        if (error) {
            return log(error);
        }
        var random = Math.floor(Math.random() * data.split("\n").length);
        var picked = data.split("\n")[random].split(",");
        log(picked[0], "----------");
        switch(picked[0]) {
            case "my-tweets": 
                myTweets();
                break;
            case "post-tweets":
                // twitter actually prevent posting same message
                postTweets(picked[1].slice(1,-1));
                break;
            case "spotify-this-song":
                spotifyThisSong(picked[1]);
                break;
            case "movie-this":
                movieThis(picked[1]);
                break;
        }
    });
}

// RUN CODE
switch (process.argv[2]) {
    // node liri.js my-tweets
    case "my-tweets": 
        myTweets();
        break;
    // node liri.js post-tweets "MESSAGE"
    case "post-tweets":
        postTweets();
        break;
    // node liri.js spotify-this-song "SONG-NAME"
    case "spotify-this-song":
        spotifyThisSong();
        break;
    // node liri.js movie-this "MOVIE-NAME"
    case "movie-this":
        movieThis();
        break;
    // node liri.js do-what-it-says
    case "do-what-it-says":
        doWhatItSays();
        break;
}