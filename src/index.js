"use strict";
let env = require('./../env.json');
let $ = require('jquery');
global.jQuery = $;
global.Tether = require('tether');
let bootstrap = require('bootstrap');
let mapboxgl = require('mapbox-gl');
let data = require('./data.json');
mapboxgl.accessToken = env.mapbox;
const map = new mapboxgl.Map({
	container: 'root',
	style: 'mapbox://styles/mapbox/light-v9',
	attributionControl: false,
	center: [-0.127665, 51.507400],
	zoom: 3,
	minZoom: 1,
	dragRotate: false
}).addControl(new mapboxgl.NavigationControl())
	.addControl(new mapboxgl.ScaleControl());
let lines = data.lines;
let stops = data.stops;
map.on('load', function() {
	lines.map(function(line, i) {
		map.addLayer({
			"id": i + "-" + line.name,
			"type": "line",
			"source": {
				"type": "geojson",
				"data": {
					"type": "Feature",
					"properties": {},
					"geometry": {
						"type": "LineString",
						"coordinates": line.stops.map(function(item) {
							let stop = $.grep(stops, function(e) {
								return e.id == item;
							})[0];
							return [stop.lon, stop.lat];
						})
					}
				}
			},
			"layout": {
				"line-cap": "round",
				"line-join": "round"
			},
			"paint": {
				"line-color": line.color,
				"line-width": 2
			}
		});
	});
	const markerDiameter = 8;
	const markerBorder = 1;
	let minLon = stops[0].lon;
	let maxLon = stops[0].lon;
	let minLat = stops[0].lat;
	let maxLat = stops[0].lat;
	stops.map(function(stop, i) {
		let el = document.createElement('div');
		el.className = 'marker';
		el.style.backgroundColor = 'white';
		el.style.border = markerBorder + 'px solid black';
		el.style.borderRadius = '50%';
		el.style.overflow = 'hidden';
		el.style.cursor = 'pointer';
		el.style.width = markerDiameter + 'px';
		el.style.height = markerDiameter + 'px';
		el.title = stop.name;
		$(el).attr('data-toggle', 'tooltip');
		$(el).attr('data-placement', 'top');
		new mapboxgl.Marker(el, {offset: [(-markerDiameter / 2) - markerBorder, (-markerDiameter / 2) - markerBorder]})
			.setLngLat([stop.lon, stop.lat])
			.addTo(map);
		if(stop.lon < minLon) {
			minLon = stop.lon;
		}
		if(stop.lon > maxLon) {
			maxLon = stop.lon;
		}
		if(stop.lat < minLat) {
			minLat = stop.lat;
		}
		if(stop.lat > maxLat) {
			maxLat = stop.lat;
		}
	});
	$('[data-toggle="tooltip"]').tooltip();
	map.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
		padding: 75
	});
	let container = $(document.createElement('div'));
	container.addClass('mapboxgl-ctrl');
	let input = $(document.createElement('input'));
	input.addClass('form-control form-control-lg');
	input.attr('type', 'text');
	input.attr('title', 'Search');
	input.attr('placeholder', 'Search');
	let results = $(document.createElement('ul'));
	results.addClass('search-results');
	input.keyup(function() {
		results.html('');
		let filteredResults = stops.filter(function(stop) {
			let query = input.val().toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, "-").trim();
			return stop.id.includes(query) && query.length > 1;
		});
		if(filteredResults.length > 0) {
			input.addClass('results');
			if(filteredResults.length > 8)
				filteredResults.splice(8, filteredResults.length - 8);
		}
		else
			input.removeClass('results');
		filteredResults.map(function(stop) {
			let li = $(document.createElement('li'));
			li.html(stop.name);
			li.click(function() {
				map.flyTo({
					center: [stop.lon, stop.lat],
					zoom: 16
				});
				results.html('');
				input.val(stop.name);
				input.removeClass('results');
			});
			results.append(li);
		});
	});
	$('.mapboxgl-ctrl-top-left').append(container.append(input).append(results));
});