var testing = false; // Flag to avoid loading online data for local testing

// Array to contain the available wind headings (for converting wind heading in degrees to cardinal directions)
var windHeadings = [
	"N",
	"NNE",
	"NE",
	"ENE",
	"E",
	"ESE",
	"SE",
	"SSE",
	"S",
	"SSW",
	"SW",
	"WSW",
	"W",
	"WNW",
	"NW",
	"NNW",
	"N"
];
	
// Iamge variables
var weatherMapImg;
var cloudMapImg;
var kMapImg;
var kGraphImg;
var kunanyiCamImg;
var imagesHeight; // A pixel value calculated once the images are loaded (used to adjust canvas height)
var weatherMapLoaded = false;
var cloudMapLoaded = false;
var kMapLoaded = false;
var kGraphLoaded = false;
var kunanyiCamLoaded = false;

// Canvas Variables
var canvas;
var ctx;
var minWidth = 0; // minimum width of the canvas, in pixels (set by the width of loaded images)
var canvasWidth = 0.4; // Canvas width as a ratio of inner window size
var canvasHeight = 0.8; // Canvas height as a ratio of inner window size - probably better if this is dynamically set based on how many elements we need displayed
var canvasMargin = 0.1; // White space between edge of canvas and content as a ratio of the absolute canvas width
var canvasSpacing = 0.02; // White space between elements on the canvas as a ratio of the absolute canvas width
var canvasRowHeight = 0.1; // Height of rows as a ratio of absolute canvas height (we need three data rows and three rows for the map)
var timeMarkerWidth = 0.002; // Width of the red lines marking 6am/midday/6pm on the astro data (as a ratio of canvas width)

// Screen size varialbes so they can be stored at a single point to prevent different calculations for related values 
var screenHeight;
var screenWidth;

// Data section heights - values are given as ratio of inner window height
var headerFooterHeight = .05; // Vertical space at top and bottom of canvas
var astroDataHeight = .1; // Sun/moon data section
var windDataHeight = .1; // Wind speed/direction data section
var atmosDataHeight = .1; // temp/humid/press data section
var spacerHeight = .01; // spacer between sections

// Pixel values for the top of each section
var imgHeight;
var astroDataY;
var windDataY;
var atmosDataY;
var imagesY;

// Colour values
var textColour = "rgba(0,0,0,1)";
var tileColour = "rgba(128,128,128,1)";
var bgColour = "rgba(250,250,255,1)";
var sunColour = "rgba(255,255,128,1)";
var moonColour = "rgba(192,192,192,1)";
var sunnightColour = "rgba(0,0,128,1)";
var sundeltaColour = "rgba(255,192,128,1)"; //Sunset or sunrise
var moonnightColour = "rgba(0,0,0,1)";
var moondeltaColour = "rgba(92,92,92,1)"; // Moonset or moonrise
var timeMarkerColourMajor = "rgba(255,0,0,1)"; // marker for 6am, midday, and 6pm
var timeMarkerColourMinor = "rgba(128,128,128,1)"; // marker for 3am, 9am, 3pm, and 9pm

// Boundary values used to calculate tile colours
var minPress = 1000; // min pressure displayed
var maxPress = 1050; // max pressure displayed
var minTemp = 0; // min temperature displayed
var maxTemp = 30; // max temperature displayed

// Containers for API data
var weatherDataJSON = [];
var suntimeDataJSON = [];

// Misc variables
var fontSize = 0.05; // As a ratio of screen size


// Primary function call
var Main = function () {
	console.log("Starting...");
	LoadData();
}

var LoadData = function() {
	console.log("Load data");
	if (testing) {
		console.log("Data load skipped");
	} else {
		var weatherAPI = document.getElementById('weather-api-data');
		weatherDataJSON = JSON.parse(weatherAPI.innerText);

		var astroAPI = document.getElementById('astro-api-data');
		suntimeDataJSON = JSON.parse(astroAPI.innerText);
	}
	
	LoadImageData();
}

// Connect to divs on the HTML
var InitDivs = function() {
	canvas = document.getElementById('main-canvas');
}

// Set up the canvas for drawing
var InitCanvas = function() {	
	console.log("Init canvas");
	ctx = canvas.getContext('2d');
	screenHeight = window.innerHeight;
	screenWidth = window.innerWidth;
	var newWidth = screenWidth * canvasWidth;
	if (newWidth < minWidth) {
		console.log("min width");
		canvas.width = minWidth;
	} else {
		console.log("width = " + newWidth);
		canvas.width = newWidth;
	}
	canvas.height = screenHeight * ((headerFooterHeight * 2) + astroDataHeight + windDataHeight + (spacerHeight * 2) + atmosDataHeight);
}

// Display temperature data - ie, draw a box, colour it based on temperature, write the actual temp in
var DisplayTempData = function() {
	console.log("Display temp data");

	// Calculate a colour value, based on temperature and temperature bounds
	if (testing) {
		var tempValue = 15;
	} else {
		tempValue = weatherDataJSON.main.temp
	}
	var colourTemp = tempValue;
	if (colourTemp > maxTemp) colourTemp = maxTemp;
	if (colourTemp < minTemp) colourTemp = minTemp;
	var tempRange = maxTemp - minTemp;
	var colourTemp = colourTemp / tempRange;
	var tempR = colourTemp * 255;
	var tempG = (colourTemp * 64) + 128;
	var tempB = (colourTemp * 127) + 128;
	var tempColour = "rgba(" + tempR + "," + tempG + "," + tempB + ",1)";
	ctx.fillStyle = tempColour;

	// Draw a rectangle of that colour, starting at the top left corner (accounting for margins) and wide enough to allow three similar rectangles before the right margin
	var topX = canvas.width * canvasMargin;
	var topY = atmosDataY;
	var width = (canvas.width - (canvas.width * canvasMargin * 2)) / 3 - (canvas.width * canvasSpacing);
	var height = screenHeight * atmosDataHeight;
	ctx.fillRect(topX, topY, width, height);
	
	// Write the temperature data, centered
	var textY = topY + fontSize;
	ctx.fillStyle = textColour;
	ctx.fillText(" " + Math.round(tempValue) + "°", topX, textY);
}

// Display humidity data - ie, draw a box, colour it based on humidity, write the actual humidity value in
var DisplayHumidData = function() {
	console.log("Display humidity data");
	// Calculate the colour based on humidity
	if (testing) {
		var humidValue = 82;
	} else {
		var humidValue = weatherDataJSON.main.humidity
	}
	
	var humidColour = "rgba(128,128,255,"+ humidValue / 100+")";
	ctx.fillStyle = humidColour;
	
	// Calculate where to draw the humidity tile
	var width = (canvas.width - (canvas.width * canvasMargin * 2)) / 3 - (canvas.width * canvasSpacing);
	var height = screenHeight * atmosDataHeight;
	var topX = (canvas.width * canvasMargin) + width + (canvas.width * canvasSpacing);
	var topY = atmosDataY;

	// Draw the tile
	ctx.fillRect(topX, topY, width, height);
	
	// Write the humidity value, centered
	var textY = topY + fontSize;
	ctx.fillStyle = textColour;
	ctx.fillText(" " + humidValue +"%", topX, textY);
}

// Display pressure data tile
var DisplayPressData = function() {
	console.log("Display pressure data");
	// Calculate the pressure tile colour based on air pressure and pressure bounds
	if (testing) {
		var airPress = 900;
	} else {
		var airPress = weatherDataJSON.main.pressure;
	}
	
	var pressColour = airPress;
	if (pressColour > maxPress) pressColour = maxPress;
	if (pressColour < minPress) pressColour = minPress;
	var pressRange = maxPress - minPress;
	pressColour = pressColour - 1000;
	pressColour = pressColour / pressRange;
	var pressR = pressColour * 255;
	var pressG = (pressColour * 64) + 128;
	var pressB = (pressColour * 127) + 128;
	var tempColour = "rgba(" + pressR + "," + pressG + "," + pressB + ",1)";
	ctx.fillStyle = tempColour;
	
	// Calculate where to draw the tile
	var width = (canvas.width - (canvas.width * canvasMargin * 2)) / 3 - (canvas.width * canvasSpacing);
	var height = screenHeight * atmosDataHeight;
	var topX = (canvas.width * canvasMargin) + (width * 2) + (canvas.width * canvasSpacing * 2);
	var topY = atmosDataY;

	// Draw the tile
	ctx.fillRect(topX, topY, width, height);
	
	// Write the pressure value, centered
	var textY = topY + fontSize;
	ctx.fillStyle = textColour;
	ctx.fillText(" " + airPress + "mbar", topX, textY);
}

// Display the wind data tile
var DisplayWindData = function() {
	console.log("Display wind data");
	// Calculate a colour based on wind speed and direction (NW is red, all others blue, alpha/intensity is determined by speed)
	if (testing) {
		var windSpeed = 0.45;
		var windDegrees = 200;
	} else {
		var windSpeed = weatherDataJSON.wind.speed;
		var windDegrees = weatherDataJSON.wind.deg;
	}

	var windHeading = windHeadings[Math.round(windDegrees / 22.5)];
	var windColourMod = windSpeed;
	if (windColourMod > 100) windColourMod = 100;
	if (windColourMod < 0) windColourMod = 0;
	windColourMod = windColourMod / 100;
	if (windColourMod < 0.25) windColourMod = 0.25;
	var windTileColour;
	if (windHeading == "NW" || windHeading == "NNW") {
		var windTileColour = "rgba(255, 128,128,"+windColourMod+")";
	} else {
		var windTileColour = "rgba(128, 128,255,"+windColourMod+")";
	}
	ctx.fillStyle = windTileColour;
	
	// Draw a rectangle of that colour on the second row that crosses the whole canvas
	var width = canvas.width - (canvas.width * canvasMargin * 2) - (canvas.width * canvasSpacing);
	var height = screenHeight * windDataHeight;
	var topX = canvas.width * canvasMargin;
	var topY = windDataY;
	ctx.fillRect(topX, topY, width, height);
	
	// Write the wind direction and speed, centered
	var textY = topY + fontSize;
	ctx.fillStyle = textColour;
	ctx.fillText(" " + windSpeed + "km/h " + windHeading, topX, textY);
}

// Display data about the sun and moon as a series of cells showing when each rises and sets throughout the day
var DisplayAstroData = function() {
	console.log("Display astro data");
	// Calculate where to draw the data
	var topXSun = canvas.width * canvasMargin;
	var topY = astroDataY;
	var height = (screenHeight * astroDataHeight) / 2;
	
	// Get the API data
	if (testing) {
		var riseHour = 6;
		var riseMinute = 30;
		var setHour = 18;
		var setMinute = 30;
		var moonsetHour = 5;
		var moonsetMinute = 30;
		var moonriseHour = 22;
		var moonriseMinute = 30;
	} else {
		var sunriseTime = suntimeDataJSON.sunrise.split(":");
		var riseHour = parseInt(sunriseTime[0]);
		var riseMinute = parseInt(sunriseTime[1]);
		
		var sunsetTime = suntimeDataJSON.sunset.split(":");
		var setHour = parseInt(sunsetTime[0]);
		var setMinute = parseInt(sunsetTime[1]);
		
		var moonriseTime = suntimeDataJSON.moonrise.split(":");
		var moonsetTime = suntimeDataJSON.moonset.split(":");
		var moonriseHour = parseInt(moonriseTime[0]);
		var moonriseMinute = parseInt(moonriseTime[1]);
		var moonsetHour = parseInt(moonsetTime[0]);
		var moonsetMinute = parseInt(moonsetTime[1]);
	}
	
	// Draw the cells
	var i;
	var cellWidth = (canvas.width - (canvasMargin * canvas.width * 2) - (canvas.width * canvasSpacing))/ 24;
	
	// Cycle through each hour to draw a cell each for the sun and moon
	for (i = 0; i < 24; i++) {
		// Sun
		if (i < 12) {
			// It's before midday and...
			if (i < riseHour) {
				ctx.fillStyle = sunnightColour; // The sun isn't up yet.
			} else if (i < riseHour + 1 && riseMinute > 0) {
				ctx.fillStyle = sundeltaColour; // The sun is rising.
			} else {
				ctx.fillStyle = sunColour; // The sun is up.
			}
		} else {
			// It's after midday and...
			if (i > setHour) {
				ctx.fillStyle = sunnightColour; // The sun has set.
			} else if (i > setHour - 1 && setMinute > 0) {
				ctx.fillStyle = sundeltaColour; // The sun is setting.
			} else {
				ctx.fillStyle = sunColour; // The sun is still up.
			}
		}
		// Draw a cell for the sun
		var currentX = topXSun + (i * cellWidth);
		ctx.fillRect(currentX, topY, cellWidth, height);
		ctx.fillStyle = bgColour;
		ctx.fillRect(currentX, topY, 1, height);
		
		// Moon
		if (moonriseHour < 12) {
			// The moon is rising before midday and...
			if (i < 12) {
				// ...it's before midday and...
				if (i < moonriseHour) {
					ctx.fillStyle = moonnightColour; // The moon isn't up.
				} else if (i < moonriseHour + 1 && moonriseMinute > 0) {
					ctx.fillStyle = moondeltaColour; // The moon is rising.
				} else {
					ctx.fillStyle = moonColour; // The moon is up.
				}
			} else {
				// ...it's after midday and...
				if (i > moonsetHour) {
					ctx.fillStyle = moonnightColour; // The moon has set.
				} else if (i > moonsetHour - 1 && moonsetMinute > 0) {
					ctx.fillStyle = moondeltaColour; // The moon is rising.
				} else {
					ctx.fillStyle = moonColour; // The moon is still up.
				}
			}
		} else {
			// The moon is rising after midday and...
			if (i < 12) {
				// ...it's before midday and...
				if (i < moonsetHour) {
					ctx.fillStyle = moonColour; // The moon is still up.
				} else if (i < moonsetHour + 1 && moonsetMinute > 0) {
					ctx.fillStyle = moondeltaColour; // The moon is setting.
				} else {
					ctx.fillStyle = moonnightColour; // The moon has set.
				}
			} else {
				// ...it's after midday and...
				if (i > moonriseHour) {
					ctx.fillStyle = moonColour; // The moon is up.
				} else if (i > moonriseHour - 1 && moonriseMinute > 0) {
					ctx.fillStyle = moondeltaColour; // The moon is rising.
				} else {
					ctx.fillStyle = moonnightColour; // The moon isn't up yet.
				}
			}
		}
		
		// Draw a cell for the moon
		ctx.fillRect(currentX, topY + height + 1, cellWidth, height);
		ctx.fillStyle = bgColour;
		ctx.fillRect(currentX, topY + height + 1, 1, height);
	}

	// Draw lines to mark 6am, midday, and 6pm
	ctx.fillStyle = timeMarkerColourMajor;
	ctx.fillRect(topXSun + (6 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // Six am
	ctx.fillRect(topXSun + (12 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // midday (1/2 across canvas);
	ctx.fillRect(topXSun + (18 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // six pm (3/4 across canvas);

	// Draw lines to mark 3am, 9am, 3pm, 9pm
	ctx.fillStyle = timeMarkerColourMinor;
	ctx.fillRect(topXSun + (3 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // 3am
	ctx.fillRect(topXSun + (9 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // 9am
	ctx.fillRect(topXSun + (15 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // 3pm
	ctx.fillRect(topXSun + (21 * cellWidth), topY, canvas.width * timeMarkerWidth, height * 2); // 9pm
}

var DisplayImages = function() {
	if (testing) {
		console.log("Image display skipped");
	} else {
		console.log("Display images");
		// Set the pixel value for where each image should start drawing from, height
		var weatherMapY = imagesY;
		var cloudMapY = weatherMapY + weatherMapImg.height;
		var kMapY = cloudMapY + cloudMapImg.height;
		var kGraphY = kMapY + kMapImg.height;
		var kunanyiCamY = kGraphY + kGraphImg.height;

		// Set the pixel value for where each image should start drawing from, height 
		var weatherMapX = (canvas.width - weatherMapImg.width) / 2;
		var cloudMapX = (canvas.width - cloudMapImg.width) / 2;
		var kMapX = (canvas.width - kMapImg.width) / 2;
		var kGraphX = (canvas.width - kGraphImg.width) / 2;
		var kunanyiCamX = (canvas.width - kunanyiCamImg.width) / 2;

		ctx.drawImage(weatherMapImg, weatherMapX, weatherMapY);
		ctx.drawImage(cloudMapImg, cloudMapX, cloudMapY);
		ctx.drawImage(kMapImg, kMapX, kMapY);
		ctx.drawImage(kGraphImg, kGraphX, kGraphY);
		ctx.drawImage(kunanyiCamImg, kunanyiCamX, kunanyiCamY, kunanyiCamImg.width, kunanyiCamImg.height);
	}
}

// Loads the raw data for the images that will be displayed
// Also sets a pixel value for how much space the images will need on the page (to be added to calculated canvas height)
var LoadImageData = function() {
	if (testing) {
		console.log("Image data load skipped");
		DrawData();
	} else {
		console.log("Load images");
		// Define the image holders
		weatherMapImg = new Image();
		cloudMapImg = new Image();
		kMapImg = new Image();
		kGraphImg = new Image();
		kunanyiCamImg = new Image();

		// Load the images and flag when they're ready (nested so they load one at a time)
		weatherMapImg.onload = function() {
			weatherMapLoaded = true;
			if (minWidth < weatherMapImg.width) {
				minWidth = weatherMapImg.width;
			}
			CheckImageLoad();
		}

		cloudMapImg.onload = function() {
			cloudMapLoaded = true;
			if (minWidth < cloudMapImg.width) {
				minWidth = cloudMapImg.width;
			}
			CheckImageLoad();
		}

		kMapImg.onload = function() {
			kMapLoaded = true;
			if (minWidth < kMapImg.width){
				minWidth = kMapImg.width;
			}
			CheckImageLoad();
		}

		kGraphImg.onload = function() {
			kGraphLoaded = true;
			if (minWidth < kGraphImg.width) {
				minWidth = kGraphImg.width;
			}
			CheckImageLoad();
		}	
		
		kunanyiCamImg.onload = function() {
			kunanyiCamLoaded = true;
			CheckImageLoad();
		}

		// Set the sources (last to ensure the onload functions are ready)
		weatherMapImg.src = "http://www.bom.gov.au/fwo/IDG00103.png";
		cloudMapImg.src = "https://www.snow-forecast.com/images2/tasmaniacloud6.cc23.jpg";
		kMapImg.src = "https://www.sws.bom.gov.au/Images/Geophysical/Latest%20Conditions/Maps/auskindex.gif";
		kGraphImg.src = "https://services.swpc.noaa.gov/images/planetary-k-index.gif";
		kunanyiCamImg.src = "https://hccapps.hobartcity.com.au/webcams/platform";
	}
}

// once all the image data is loaded we can start displaying things
var CheckImageLoad = function() {
	console.log("Checking loaded images...");
	if (weatherMapLoaded && cloudMapLoaded && kMapLoaded && kGraphLoaded && kunanyiCamLoaded) {
		console.log("All images loaded");

		// Set up the document
		InitDivs();
		InitCanvas();

		// Update the size of the webcam image
		var newHeight = kunanyiCamImg.height * (canvas.width / kunanyiCamImg.width);
		var newWidth = canvas.width;
		kunanyiCamImg.height = newHeight;
		kunanyiCamImg.width = newWidth;
		imagesHeight = weatherMapImg.height + cloudMapImg.height + kMapImg.height + kGraphImg.height + kunanyiCamImg.height;

		// Draw everything
		UpdateCanvasHeight();
		DrawData();
	}
}

// Sets the canvas height once all the images are loaded and fills in the background colour
var UpdateCanvasHeight  = function() {
	console.log("Update canvas height");
	canvas.height = canvas.height + imagesHeight;
	ctx.font = (fontSize * canvas.width) + "px Helvetica";
	fontSize = fontSize * canvas.width;
	console.log(ctx.font);
}

// Called once the images are loaded and the canvas height is set
// Draws everything on the page
var DrawData = function() {
	console.log("Draw all data");

	// Fill the background
	ctx.fillStyle = bgColour;
	ctx.fillRect(0,0,canvas.width, canvas.height);

	// Set the height of each section
	var dataY = screenHeight * headerFooterHeight; // The top most part of the data, all other section heights build on this
	astroDataY = dataY;
	windDataY = astroDataY + (screenHeight * astroDataHeight) + (screenHeight * spacerHeight);
	atmosDataY = windDataY + (screenHeight * windDataHeight);
	imagesY = atmosDataY + (screenHeight * spacerHeight) + (screenHeight * atmosDataHeight);

	// Draw the data in each section
	DisplayAstroData();
	DisplayHumidData();
	DisplayPressData();
	DisplayTempData();
	DisplayWindData();
	DisplayImages();
}