//Global variables that are needed throughout in various methods.
var unit = 'f';
var currentLoc = '';

//This function is the basis for the program.  It takes the longitude and latitude
// values and converts it into the state, city, and zip data.
var setLoc = function(url){
	//Start with a JSON request
	$.getJSON(url, function(data){
		//Check to see if the servers were able to find a location from the 2D point.
		if (data.status === 'ZERO_RESULTS'){
			//Set some values to aware the user of the program's failure just in case.
			$('#locEnter').attr('value', '');
			$('#locEnter').attr('placeholder', 'Invalid Location');
		}
		else{
			$('#locEnter').attr('value', '');
			$('#locEnter').attr('placeholder', 'Location');
			var components = data.results[0].address_components;
			var city;
			var state;
			//Scan through the JSON return for necessary data.
			for (var i = 0; i < components.length; i++){
			var comp = components[i];
				if (comp.types.indexOf('locality') !== -1){
					city = comp.long_name;
				}
				if (comp.types.indexOf('administrative_area_level_1') !== -1){
					state = comp.short_name;
				}
				if (comp.types.indexOf('postal_code') !== -1){
					if (currentLoc.length != 0){
						//Aware the user the program was able to find the location.
						$('#locEnter').attr('placeholder', 'Location changed');
					}
					currentLoc = comp.short_name;
				}
			}
			//Check to see if the location is supported with future functionality.
			if (city === null || state === null || currentLoc === null){
				$('#location').text('Unsupported location');
			}
			else{
				$('#location').text(city + ', ' + state);
				var locAdd = city + ', ' + state;
				//Access localStorage for past locations.
				//If not previous entries have been added, a new entry with the key 'locs' will be added.
				if (localStorage.getItem('locs') === null){
					var firstLoc = new Array(1);
					firstLoc[0] = locAdd;
					//Add it back to local storage.
					localStorage.setItem('locs', JSON.stringify(firstLoc));
				}
				else{
					var allLocs = JSON.parse(localStorage.getItem('locs'));
					var index = -1;
					//Scan the previous entries to see if the location typed in matches any before it.
					for (var i = 0; i < allLocs.length; i++){
						if (allLocs[i] == locAdd){
							index = i;
						}
					}

					//If the location was typed in before, move it to the front of the stack.
					if (index > 0){
						for (var i = index - 1; i >=0; i--){
							allLocs[i + 1] = allLocs[i];
						}
						allLocs[0] = locAdd;
					}
					//Else add it to the localStorage.
					else if (index != 0){
						//The storage only keepes track of the five most recent entries
						if (allLocs.length < 5){
							var tempArr = new Array(allLocs.length + 1);
							//Adjust the array.
							for (var j = 0; j < allLocs.length; j++){
								tempArr[j + 1] = allLocs[j]
							}
							allLocs = tempArr;
						}
						else{
							for (var j = allLocs.length - 2; j >= 0; j--){
								allLocs[j + 1] = allLocs[j];
							}
						}
						//Add the current location
						allLocs[0] = locAdd;
						
					}
					//Restore the array when done.
					localStorage.setItem('locs', JSON.stringify(allLocs));
				}

				//Display the previous locations
				var memoryLocs = JSON.parse(localStorage.getItem('locs'));
				for (var i = 0; i <= 4; i++){
					if (i < memoryLocs.length){
						$('#loc' + i).text(memoryLocs[i]);
					}
					else{
						//Empty was used as a placeholder to let the user know that he or she could store more locations
						$('#loc' + i).text("Empty");
					}
				}
				//After setting the location, set the weather and the news.
				setWeather();
				setNews();
			}
		}	
				

	}, function(err){
		//in case of failure, notify the user.
		$('#locEnter').attr('value', '');
		$('#locEnter').attr('placeholder', 'Invalid Location');
		$('#location').text('Unsupported location');
	});
};

//This function completes the implementation of the weather.  The user has access to current conditions,
//as well as future conditions for the next couple days.
var setWeather = function(){
	//Get the url needed for the weather data.
	var url = 'http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20weather.forecast%20WHERE%20location%3D' + currentLoc + '%20AND%20u%3D%22' + unit + '%22&format=json';
	
	//Send a request for the data.
	$.getJSON(url, function(data){
		//Set all the html divs/tds to their correct information
		var comp = data.query.results.channel.item.forecast[0];
		$('#lTemp').text(comp.low + '\u00B0');
		$('#hTemp').text(comp.high + '\u00B0');
		$('#cTemp').text(data.query.results.channel.item.condition.temp + '\u00B0');
		$('#cHumidity').text(parseInt(data.query.results.channel.atmosphere.humidity) + '%');
		$('#cPressure').text(parseInt(data.query.results.channel.atmosphere.pressure) + data.query.results.channel.units.pressure);
		$('#cVisibility').text(parseInt(data.query.results.channel.atmosphere.visibility) + data.query.results.channel.units.distance);
		$('#cWind').text(parseInt(data.query.results.channel.wind.speed) + data.query.results.channel.units.speed);
		$('#overallW').text('Currently: ' + data.query.results.channel.item.condition.text);
		$('#predictW').text('Predicted: ' + data.query.results.channel.item.forecast[0].text);
		//For loop iterates over the next couple days
		for (var i = 1; i < 5; i++){
			$('#hDay' + i).text(data.query.results.channel.item.forecast[i].high + '\u00B0');
			$('#lDay' + i).text(data.query.results.channel.item.forecast[i].low + '\u00B0');
			$('#fDay' + i).text(data.query.results.channel.item.forecast[i].text.toLowerCase());
			if (i != 1){
				var day = '';
				//Converts the nickname of a day into the longname for the user.
				switch(data.query.results.channel.item.forecast[i].day){
					case 'Sun':
						day = 'Sunday';
						break;
					case 'Mon':
						day = 'Monday';
						break;
					case 'Tue':
						day = 'Tuesday';
						break;
					case 'Wed':
						day = 'Wednesday';
						break;
					case 'Thu':
						day = 'Thursday';
						break;
					case 'Fri':
						day = 'Friday';
						break;
					case 'Sat':
						day = 'Saturday';
						break;
					default:
						break;
				}
				$('#dName' + i).text(day);
				$('#d' + i).text(day)
			}
		}

		//Allow the user to access the weather now that it is completed.
		$('#lw').attr('href', '#weather');

	}, function(err){
		$('#location').text('Weather not supported');
	});

};


//The set news function takes 10 news stories from the area the user is interested in and displays them
//in a user-friendly manner.
var setNews = function(){
	//Url is needed once again based on the user's location.
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%20%3D%20'http%3A%2F%2Fnews.google.com%2Fnews%3Fgeo%3D" + currentLoc + "%26output%3Drss'&format=json";
	//Send request
	$.getJSON(url, function(data){
		//Clear out the current news list.
		$('#newslist').html('');
		//Cap the number of stories at 10.
		var totLength = 0;
		if (data.query.results.item.length > 10){
			totLength = 10;
		}
		else{
			totLength = data.query.results.item.length;
		}
		//Iterate through all 10 stories
		for (var i = 0; i < totLength; i++){
			var description = data.query.results.item[i].description;
			//Parse through the descriptions of the news stories (lot's of trial and error)
			if (description.indexOf('</font></b></font><br /><font size="-1">') !== -1 && (description.indexOf('nbsp') != -1 || description.indexOf('...') != -1)){
				var newsUpdate = '<div data-role="collapsible"><h3 id="news' + i + 'H"></h3><p id="news' + i + 'C"></p></div>';
				//Add a collapsibe element
				$('#newslist').append(newsUpdate);
				var temp = data.query.results.item[i].title;
				if (temp.indexOf('-') !== -1){
					temp = temp.substring(0, temp.lastIndexOf('-') - 1);
				}
				$('#news' + i + 'H').text(temp);
				//Just some more parsing for the needed description.  I found two different protocols used, hence
				//the else if statement.
				description = description.substring(description.indexOf('</font></b></font><br /><font size="-1">') + 40);
				if ((description.indexOf('...') === -1 || (description.indexOf('nbsp') < description.indexOf('...') && description.indexOf('...') !== -1))&& description.indexOf('nbsp') !== -1){
					description = description.substring(0, description.indexOf('nbsp') - 9) +'...';
				}
				else if (description.indexOf('...') !== -1){
					description = description.substring(0, description.indexOf('...') - 10) + '...';
				}
				else{
					//Just in case
					description = '';
				}
				//Add the descriptions to the collapsible objects.
				description += '<a href="' + data.query.results.item[i].link + '">Read more</a>';
				$('#news' + i + 'C').html(description);
				
			}


		}
		//Refresh the collapsible list so it can be re-styled.
		$('#newslist').trigger('create');
		//Allow the user to access the news.
		$('#ln').attr('href', '#news');
	}, function (err){
		$('#location').text('News not supported');
	});
};

//Simply gets the user's current location.
var getCurrentLoc = function(){
	$('#location').text('Getting current location...');
	navigator.geolocation.getCurrentPosition(function(position) {
    	var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + ',' + position.coords.longitude + "&sensor=true";
    	setLoc(url);
	}, function(err){
		//Warns the user if geolocation is not supported.
		$('#location').text('Geolocation not supported');
	});

	

};

//There was an issue with using straight addresses vs. longitude and latitude, so addresses are converted before
//being passed into the setLoc() function.
var convertAdd = function(url){
	$.getJSON(url, function(data){
		if (data.status === "ZERO_RESULTS"){
			$('#locEnter').attr('value', '');
			$('#locEnter').attr('placeholder', 'Invalid Location');
		}
		else{
			var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng + "&sensor=true";
			setLoc(url);
		}
	}, function(err){
		$('#location').text('Error retrieving location');
	});
};

//Sets up the webpage for the user.
$(document).ready(function(){
	//Check to see if this is the first time the user has accessed the page. Just use his or her location if so.
	if (localStorage.getItem('locs') === null){
		getCurrentLoc();
	}
	else{
		//Take the most recent location and convert it into latitude and longitude.
		var loc1 = JSON.parse(localStorage.getItem('locs'));
		var url = convertAdd('http://maps.googleapis.com/maps/api/geocode/json?address=' + loc1[0].toString() + '&sensor=true');
		setLoc(url);
	}
	
	//Detects if the user wants to switch from imperial to metric, or vice versa.
	$('#tempUnit').change(function(){
		var change = $('#tempUnit').val();
		if (change === 'on'){
			unit = 'c';
		}
		else{
			unit = 'f';
		}
		//Reset the weather
		setWeather();
	});

	//Handles requests for new locations that the user types in.
	$('#locSubmit').click(function(){
		var reqLoc = $('#locEnter').val();
		var url = convertAdd('http://maps.googleapis.com/maps/api/geocode/json?address=' + reqLoc + '&sensor=true');
		setLoc(url);
	});

	//Allows the user to click a previously typed in location.
	$('.lClick').click(function(){
		if ($(this).text() != "Empty"){
			convertAdd('http://maps.googleapis.com/maps/api/geocode/json?address=' + $(this).text() + '&sensor=true');
		}
	});
	//Functionality for the small button on the front page which resets the loc to the current geographical location.
	$('#getLocNow').click(function(){
		getCurrentLoc();
	});
	
});






