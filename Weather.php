<html>
	<head>
		<link rel="stylesheet" href="./css/styles.css">
	</head>
	<body onload="Main()">

		<div id = "weather-api-data" style="display:none">
			<?php
				$api_url="https://api.openweathermap.org/data/2.5/weather?q=Hobart&units=metric&appid=****";
				$json_data = file_get_contents($api_url);
				$output = $json_data;
				echo htmlspecialchars($output);
			?>
		</div>

		<div id = "astro-api-data" style ="display: none">
			<?php
				$api_url="https://api.ipgeolocation.io/astronomy?apiKey=****=-42.8821&long=147.3272";
				$json_data = file_get_contents($api_url);
				$output = $json_data;
				echo htmlspecialchars($output);
			?>
		</div>

		<canvas id = "main-canvas"></canvas>

		<script src = "./scripts/main.js"></script>
	</body>
</html>