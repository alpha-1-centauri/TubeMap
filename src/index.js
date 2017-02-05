import env from './../env.json';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import data from './data.json';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
mapboxgl.accessToken = env.mapbox;
const map = new mapboxgl.Map({
	container: 'root',
	style: 'mapbox://styles/mapbox/light-v9',
	attributionControl: false,
	center: [-0.127665, 51.507400],
	zoom: 11,
	minZoom: 1
});
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
});