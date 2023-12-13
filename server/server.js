var express = require('express');
var cors = require('cors');
var geohash = require('ngeohash');
var axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const qs = require('qs');
const process = require('process')

var app = express();
const port = 3000;

app.use(cors());
app.use(express.static(process.cwd()+"/../dist/hw8/"));

app.get('/', (req,res) => {
    console.log("got / request")
  res.sendFile(process.cwd()+"/../dist/hw8/index.html")
});

app.get('/search', (req,res) => {
    console.log("got /search request")
  res.sendFile(process.cwd()+"/../dist/hw8/index.html")
});

app.get('/favorites', (req,res) => {
    console.log("got /favorites request")
  res.sendFile(process.cwd()+"/../dist/hw8/index.html")
});

app.get('/api/search', (req, res) => {
    const data = req.query;
    // console.log(data);

    const keyword = data.keyword
    const distance = data.distance
    const category = data.category
    const location = data.location

    if (location != 'none') {
        location_list = data.location.split(',')
        after_geo = geohash.encode(location_list[0], location_list[1]);

        //geohash
        // console.log(location_list)
    
        // console.log(after_geo)

        const segmentID = {
            'default':'',
            'music':'KZFzniwnSyZfZ7v7nJ',
            'sports':'KZFzniwnSyZfZ7v7nE',
            'arts&theatre':'KZFzniwnSyZfZ7v7na',
            'film':'KZFzniwnSyZfZ7v7nn',
            'miscellaneous':'KZFzniwnSyZfZ7v7n1'
        }
        seg = ''

        for (let key in segmentID) {
            if (key === category) {
                seg = segmentID[key];
            }
        }

        // console.log(seg)

        const fin_data = {
            'keyword':keyword, 
            'distance':distance, 
            'segmentID':seg, 
            'location':after_geo
        }

        // console.log(fin_data)

        //ticketmaster API
        var result = ""
        
        var totalElements = 0;
        var ticketMasterAPIResult = "";
        var responseData = {}

        async function ticketMasterAPICall() {
            var result=""
            await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
                params: {
                    apikey: '',
                    keyword: fin_data['keyword'],
                    segmentId: fin_data['segmentID'],
                    radius: fin_data['distance'],
                    unit: 'miles',
                    geoPoint: fin_data['location']
                }
            })
            .then(response => {
                responseData = response.data;
                // console.log(response)
            })
            .catch(error => {
                console.log(error);
                
                if (error.response && error.response.status === 429) {
                    console.log("Error 429: Too Many Requests");
                    ticketMasterAPICall()
                }
            });
            // console.log(responseData);
            return responseData

        }

        async function checkMusic(events) {
            var totalElements = 0;
            var artists="";

            if(events.hasOwnProperty('_embedded') == true) {
                if(events._embedded.hasOwnProperty('attractions') == true) {
                    totalElements = Object.keys(events._embedded.attractions).length; 

                    if (events._embedded.attractions[0].classifications[0].segment.name == "Music") {
                        
                        async function forLoop() {
                            for (var i=0; i<totalElements; i++) {
                                artists += events._embedded.attractions[i].name;
                                artists += "$"
                            }
                        }
                        await forLoop()

                        artists = artists.slice(0, -1);
                        // console.log("fin artists::::", artists)

                        return artists
                    }
                    else
                        return ""
                    
                }
                else
                    return ""
            }
            return ""
        }
        
        async function checkUndefined(input_data) {
            if (input_data === "Undefined"){
                input_data = ""
                return input_data
            }
            else
                return input_data
        }

        async function loadData(){
            var response = new Array();

            ticketMasterAPIResult = await ticketMasterAPICall()
            // console.log("ticket: ", ticketMasterAPIResult)

            if (Object.keys(ticketMasterAPIResult).length > 0) {
                if (ticketMasterAPIResult.page.totalElements > 0) {
                    events_json = ticketMasterAPIResult._embedded.events
                    totalElements = Object.keys(events_json).length; 
            
                    if (totalElements > 20){
                        totalElements = 20;
                    }
            


                    async function forLoop() {
                        for (var i=0; i<totalElements; i++) {
                            one_event= {}
                            fin_music = await checkMusic(events_json[i])

                            one_event = {
                                id: await checkUndefined(events_json[i].id),
                                date: await checkUndefined(events_json[i].dates.start.localDate),
                                time: await checkUndefined(events_json[i].dates.start.localTime),
                                icon: await checkUndefined(events_json[i].images[0].url),
                                event: await checkUndefined(events_json[i].name),
                                genre: await checkUndefined(events_json[i].classifications[0].segment.name),
                                venue: await checkUndefined(events_json[i]._embedded.venues[0].name),
                                music: fin_music
                            }
                            response.push(one_event)
                        }

                    }

                    await forLoop()
                }
            }
            // console.log(response);
            
            // res.json(response) //

            finalll = JSON.stringify(response);
            return finalll;
        }


        async function sort(){
            
            function asc(title_name) {
                return function(a, b) {
                  if (a[title_name] > b[title_name]) {    
                    return 1;    
                  } 
                  else if (a[title_name] < b[title_name]) {    
                    return -1;    
                  }
                  else {
                    return 0;
                  }
                }    
            }
                  
            var ticketData = await loadData()
        
            const jsonArray = JSON.parse(ticketData);
        
            // console.log(jsonArray)
            // Add a 'dateTime' property to each event, combining date and time strings
            jsonArray.forEach(event => {
                event.dateTime = event.date + 'T' + event.time;
            });
            
            // Sort the eventData array using the asc function
            const sortedEventData = jsonArray.sort(asc('dateTime'));
            
            // Remove the 'dateTime' property from each event
            sortedEventData.forEach(event => {
                delete event.dateTime;
            });
            
            // Convert the sorted array to an object with index numbers as keys
            const indexedSortedEventData = sortedEventData.reduce((result, item, index) => {
                result[index] = item;
                return result;
            }, {});
            
            // console.log("+++++++ final sorted data +++++++++")
            // console.log(indexedSortedEventData);

            res.json(indexedSortedEventData);
                  
        }
        
        sort()
        
    }
    else
        res.json("")
})

app.get('/api/eventDetail', (req, res) => {
    const data = req.query;
    // console.log("detail data: ", data)
    var result = "";

    if (data != "") {

        // console.log(data);

        const id = data.id
        // console.log("id:::", id)

        async function checkDate(events){
            if (events.hasOwnProperty("dates") == true) {
                if (events.dates.hasOwnProperty("start") == true) {
                    if (events.dates.start.hasOwnProperty("localDate")) {
                        return events.dates.start.localDate
                    }
                }
            }
            return ""
        }

        async function checkTime(events){
            if (events.hasOwnProperty("dates") == true) {
                if (events.dates.hasOwnProperty("start") == true) {
                    if (events.dates.start.hasOwnProperty("localTime")) {
                        return events.dates.start.localTime
                    }
                }
            }
            return ""
        }

        async function checkAoT(events) {
            result = ""
          
            if (events._embedded.hasOwnProperty("attractions") == true) {
              let totalElements = Object.keys(events._embedded.attractions).length; // search num of artists
          
              async function forLoop() {
                for (let i = 0; i < totalElements-1; i++) {
                    result += events._embedded.attractions[i].name + " | "
                }
                result += events._embedded.attractions[totalElements-1].name
              }
          
              await forLoop();
          
            //   console.log(result)
              return result;
            }
            return "";
          }
          

        async function checkVenue(events) {
            if (events._embedded.hasOwnProperty("venues") == true) {
                return events._embedded.venues[0].name
            }
            return ""
        }

        async function checkGenre(events) {
            // console.log(events.classifications)

            result = ""

            if (await events.hasOwnProperty("classifications") == true) {
                var num = 0;

                if (await events.classifications[0].hasOwnProperty("segment") == true) {
                    var name = events.classifications[0].segment.name;
                    if (name != "Undefined") {
                        result += name+" | ";
                        num++;
                    }
                }
                if (await events.classifications[0].hasOwnProperty("genre") == true) {
                    var genre = events.classifications[0].genre.name;
                    if (genre != "Undefined") {
                        result += genre+" | ";
                        num++;
                    }
                }
                if (await events.classifications[0].hasOwnProperty("subGenre") == true) {
                    var subgenre = events.classifications[0].subGenre.name;
                    if (subgenre != "Undefined") {
                        result += subgenre+" | ";
                        num++;
                    }
                }
                if (await events.classifications[0].hasOwnProperty("type")) {
                    var type = events.classifications[0].type.name;
                    if (type != "Undefined") {
                        result += type+" | ";
                        num++;
                    }
                }
                if (await events.classifications[0].hasOwnProperty("subType")) {
                    var subtype = events.classifications[0].subType.name;
                    if (subtype != "Undefined") {
                        result += subtype+" | ";
                        num++;
                    }
                }
                if (num != 0) {
                    result = result.slice(0, -3); //remove last |
                    return result
                }
                else
                    return ""
            } 
            return ""
        }

        async function checkMinPrice(events) {
            if (await events.hasOwnProperty("priceRanges") == true) {
                return events.priceRanges[0].min
            }
            return ""
        }

        async function checkMaxPrice(events) {
            if (await events.hasOwnProperty("priceRanges") == true) {
                return events.priceRanges[0].max
            }
            return ""
        }

        async function checkStatus(events) {
            var text = ""
            if (await events.dates.hasOwnProperty("status") == true) {
                text = events.dates.status.code
                if (text == "onsale") {
                    text = "On Sale";
                }
                else if (text == "rescheduled") {
                    text = "Rescheduled";
                }
                else if (text == "postponed") {
                    text = "Postponed";
                }
                else if (text == "offsale") {
                    text = "Off Sale";
                }
                else if (text == "cancelled") {
                    text = "Cancelled";
                }
                return text
            }
            return ""
        }

        async function checkStatusClass(events) {
            var text = ""
            if (await events.dates.hasOwnProperty("status") == true) {
                text = events.dates.status.code
                if (text == "onsale") {
                    text = "status_green";
                }
                else if (text == "rescheduled") {
                    text = "status_orange";
                }
                else if (text == "postponed") {
                    text = "status_orange";
                }
                else if (text == "offsale") {
                    text = "status_red";
                }
                else if (text == "cancelled") {
                    text = "status_black";
                }
                return text
            }
            return ""
        }

        async function checkSeatmap(events) {
            if (events.hasOwnProperty("seatmap") == true) {
                return events.seatmap.staticUrl
            }
            return ""
        }

        async function checkBuyUrl(events) {
            if (await events.hasOwnProperty("url") == true) {
            return events.url
            }
            return ""
        }

        async function ticketMasterAPICall() {
            var result=""
            await axios.get('https://app.ticketmaster.com/discovery/v2/events/', {
                params: {
                    apikey: '',
                    id: id
                }
            })
            .then(response => {
                const responseData = response.data;
                result = responseData._embedded.events;
            })
            .catch(error => {
                console.log(error);
            });
            // console.log(result);
            return result
        }
//////////
        async function loadData(){
            response = {}

            ticketMasterAPIResult = await ticketMasterAPICall()
            // console.log(ticketMasterAPIResult);

            if (Object.keys(ticketMasterAPIResult).length > 0) {
               
                    
                    fin_date = await checkDate(ticketMasterAPIResult[0])
                    fin_time = await checkTime(ticketMasterAPIResult[0])
                    fin_aot = await checkAoT(ticketMasterAPIResult[0])
                    fin_venue = await checkVenue(ticketMasterAPIResult[0])
                    fin_genre = await checkGenre(ticketMasterAPIResult[0])
                    fin_min_price = await checkMinPrice(ticketMasterAPIResult[0])
                    fin_max_price = await checkMaxPrice(ticketMasterAPIResult[0])
                    fin_status = await checkStatus(ticketMasterAPIResult[0])
                    fin_status_class = await checkStatusClass(ticketMasterAPIResult[0])
                    fin_seatmap = await checkSeatmap(ticketMasterAPIResult[0])
                    fin_buyurl = await checkBuyUrl(ticketMasterAPIResult[0])

                    response = {
                        name: ticketMasterAPIResult[0].name,
                        date: fin_date,
                        time: fin_time,
                        aot: fin_aot,
                        venue: fin_venue,
                        genre: fin_genre,
                        priceMin: fin_min_price,
                        priceMax: fin_max_price,
                        status: fin_status,
                        status_class: fin_status_class,
                        seatmap: fin_seatmap,
                        buyurl: fin_buyurl,
                        id: id
                    }
                
            }
            // console.log(response);
            res.json(response);
        }
        
        loadData()
    }
    else
        res.json("")
})

app.get('/api/venueDetail', (req, res) => {
    const data = req.query;
    // console.log("venuedetail:::", data);

    if (data != "") {
        var result = "";

        // console.log(data);

        const venue = data.venue

        // console.log(venue)



        async function checkAddr(venues) {
            result = ""

            if (venues.hasOwnProperty("address") == true) {
                if (venues.address.hasOwnProperty("line1") == true) {
                    result += venues.address.line1;
                    result += ", "
                }
                if (venues.hasOwnProperty("city") == true) {
                    result += venues.city.name;
                    result += ", "
                }
                if (venues.hasOwnProperty("state") == true) {
                    result += venues.state.stateCode;
                }
                return result;
            }
            return "";
        }

        async function checkPhone(venues) {
            if (venues.hasOwnProperty("boxOfficeInfo") == true) {
                if (venues.boxOfficeInfo.hasOwnProperty("phoneNumberDetail") == true) {
                    return venues.boxOfficeInfo.phoneNumberDetail;
                }
                return "";
            }
            return "";
        }

        async function checkOpenHours(venues) {
            if (venues.hasOwnProperty("boxOfficeInfo") == true) {
                if (venues.boxOfficeInfo.hasOwnProperty("openHoursDetail") == true) {
                    return venues.boxOfficeInfo.openHoursDetail;
                }
                return "";
            }
            return "";
        }

        async function checkGR(venues) {
            if (venues.hasOwnProperty("generalInfo") == true) {
                if (venues.generalInfo.hasOwnProperty("generalRule") == true) {
                    return venues.generalInfo.generalRule;
                }
                return "";
            }
            return "";
        }

        async function checkCR(venues) {
            if (venues.hasOwnProperty("generalInfo") == true) {
                if (venues.generalInfo.hasOwnProperty("childRule") == true) {
                    return venues.generalInfo.childRule;
                }
                return "";
            }
            return "";
        }


        async function ticketMasterAPICall() {
            var result=""

            await axios.get('https://app.ticketmaster.com/discovery/v2/venues.json', {
                params: {
                    apikey: '',
                    keyword: venue
                }
            })
            .then(response => {
                const responseData = response.data;
                
                if (responseData.page.totalElements != 0) {
                    result = responseData._embedded.venues;
                }
                else
                    return false;
            })
            .catch(error => {
                console.log(error);
            });
            // console.log(result);
            return result
        }

        async function loadData(){
            response = {}

            ticketMasterAPIResult = await ticketMasterAPICall()
            // console.log("ticket::", ticketMasterAPIResult);

            if (ticketMasterAPIResult != false) {
                fin_addr = await checkAddr(ticketMasterAPIResult[0])
                fin_phone = await checkPhone(ticketMasterAPIResult[0])
                fin_openhour = await checkOpenHours(ticketMasterAPIResult[0])
                fin_gr = await checkGR(ticketMasterAPIResult[0])
                fin_cr = await checkCR(ticketMasterAPIResult[0])
    
                response = {
                    name: ticketMasterAPIResult[0].name,
                    addr: fin_addr,
                    phone: fin_phone,
                    openhour: fin_openhour,
                    gr: fin_gr,
                    cr: fin_cr,
                    long: ticketMasterAPIResult[0].location.longitude,
                    lat: ticketMasterAPIResult[0].location.latitude
                }
                res.json(response);
            }
            else {
                res.json("");
            }

            // console.log(response);
        }
        loadData()  
    } 
    else
        res.json("")
  })

  app.get('/api/artistDetail', (req, res) => {
    const apiString = req.url;

    const splitString = apiString.split("artist=");
    // console.log("split string::", splitString)

    if (splitString.length > 1) {
        const artists = splitString[1];
        if (artists != '') {
            const decodedArtists = decodeURIComponent(artists);
            const artistArray = decodedArtists.split('$');
            // console.log("artist array", artistArray);

            // console.log("+++++ origin:++++", data);

            // const artist = data
            // console.log("====artist:", artist)

            // var redirectUri = 'http://localhost:4200/search'
            var client_id = ''
            var client_secret = '';


            const spotifyApi = new SpotifyWebApi({
                clientId: client_id,
                clientSecret: client_secret,
            });
                
            const authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
                },
                data: qs.stringify({
                    grant_type: 'client_credentials',
                }),
            };
                
            async function getAccessToken() {
                try {
                        const response = await axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers });
                        if (response.status === 200) {
                            const token = response.data.access_token;
                            spotifyApi.setAccessToken(token);
                        } 
                        else if (response.status === 401) {
                            // console.log("401 error!!!===");
                      
                            // When status code 401: get another token
                            const grantResponse = await spotifyApi.clientCredentialsGrant();

                            if (grantResponse.statusCode === 200) {
                                const token = grantResponse.body.access_token;
                                spotifyApi.setAccessToken(token);
                            }
                            else {
                                console.log('Error getting access token using clientCredentialsGrant');
                            }
                        } 
                        else {
                            console.log('*** error!! ***');
                        }
                    } catch (error) {
                        console.error('Error getting access token', error);
                    }
            }
            
                
            async function search_artist(query) {
                try {
                    const data = await spotifyApi.searchArtists(query);
                    const artists = data.body.artists.items;

                    // console.log("spotify seach result:: ", data)
                    return artists;
                } catch (error) {
                    console.error('Error searching for artists', error);
                }
            }

            async function search_albums(id) {
                var albums = new Array();

                try { 
                    const data = await spotifyApi.getArtistAlbums(id, {limit: 3});
                    // console.log("get albums:::", data)
                    var num_of_albums = data.body.total

                    if (num_of_albums > 3)
                        num_of_albums = 3;
                    
                    async function forLoop() {
                        for (var i=0; i<num_of_albums; i++) {
                            albums.push(data.body.items[i].images[0].url)
                        }
                    }
                    await forLoop()

                    // console.log("========= images ==========")
                    // console.log(albums)

                    // const artists = data.body.artists.items;
                    return albums;

                } catch (error) {
                    console.error('Error searching for albums', error);
                }
            }
                
            async function searchData_artist(artist){ 
                final_artist = {}

                await getAccessToken();
                const artists = await search_artist(artist);
                artistsTotalElements = Object.keys(artists).length;


                async function forLoop() {
                    for (var i=0; i<artistsTotalElements; i++) {
                       artist_name = artists[i].name
                    //    console.log(artist_name, artists[i].name)

                       if (String(artist_name).toLowerCase() == String(artist).toLowerCase()) {
                           final_artist = artists[i]
                           break;
                       }
                        
                    }

                }
                
                // check attractions with api result
                if(artistsTotalElements > 0) {
                    await forLoop()
                    // console.log("FInal artist:::: ---- ", final_artist)
                    return final_artist
                }

                else
                    return "";
            }

            async function searchData_albums(id){ 
                await getAccessToken();
                const albums = await search_albums(id);

                if (albums.length != 0)
                    // console.log(albums);
                    return albums;
                else
                    return "";
            }

            async function loadData() {
                var totalElements = artistArray.length;
                var response = new Array();

                // console.log("num of elements:", totalElements)

                if (totalElements > 0){

                    async function forLoop() {
                        for (var i=0; i<totalElements; i++) {
                            one_artist = await searchData_artist(artistArray[i])
                            // console.log("artist result length888 :::", Object.keys(one_artist).length)
                            if (Object.keys(one_artist).length != 0) {
                                albums = await searchData_albums(one_artist.id)

                                extracted_one_artist_info = {
                                    name: one_artist.name,
                                    followers: one_artist.followers.total,
                                    popularity: one_artist.popularity,
                                    link: one_artist.external_urls.spotify,
                                    photo: one_artist.images[0].url,
                                }

                                if (one_artist.length != 0) {
                                    for (var j = 0; j<albums.length; j++) {
                                        var keyname = 'album'+String(j+1)
                                        extracted_one_artist_info[keyname] = albums[j]
                                    }
                                    response.push(extracted_one_artist_info)
                                }
                            }
                            
                        }

                    }
                    await forLoop()

                    // console.log("spotify final result:: ", response);
                    res.json(response);
                }
                else
                    res.json("")
            }
            loadData()
        }
        else 
            res.json("");
    } 
    else {
        // console.log("No artists found in the input string");
        res.json("");
    }

    
})

app.get('/api/autoComplete', (req, res) => {
    const data = req.query;
    // console.log(data);

    async function ticketMasterAPICall() {
        var result=""

        await axios.get('https://app.ticketmaster.com/discovery/v2/suggest', {
            params: {
                apikey: '',
                keyword: data.keyword
            }
        })
        .then(response => {
            const responseData = response.data;
            
            if (responseData.hasOwnProperty('_embedded') == true) {
                result = responseData._embedded.attractions;
            }
            else
                result = {}
        })
        .catch(error => {
            console.log(error);
        });
        // console.log(result);
        return result
    }

    async function loadData(){
        var response = {}
        
        if (data.keyword != '') {
            // console.log("true")
            ticketMasterAPIResult = await ticketMasterAPICall()
            // console.log("ticket::", ticketMasterAPIResult);

            if (ticketMasterAPIResult.length != 0) {

                async function forLoop() {
                    for (var i=0; i<ticketMasterAPIResult.length; i++) {
                        var one_keyword = ticketMasterAPIResult[i].name;

                        response[i] = {
                            name: one_keyword
                        };
                        

                    }
                }
                await forLoop()
            }
        }
        // console.log(response)
        res.json(response)
    }
    loadData()  

  })

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})